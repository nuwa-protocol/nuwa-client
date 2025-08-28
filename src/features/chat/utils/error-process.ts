import { PaymentErrorCode } from '@nuwa-ai/payment-kit';
import { Sentry } from '@/shared/services/sentry';

export enum ChatErrorCode {
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  RAV_CONFLICT = 'RAV_CONFLICT',
  PAYMENT_REQUIRED = 'PAYMENT_REQUIRED',
  PAYMENT_ERROR = 'PAYMENT_ERROR',
  IGNORED_ERROR = 'IGNORED_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
}

// Configuration: Error patterns to ignore (case-insensitive matching) for the client user
const IGNORED_ERROR_PATTERNS = ['json parsing', 'payeedid'];

// Configuration: Error patterns to ignore (case-insensitive matching) for the developer
const IGNORED_ERROR_PATTERNS_DEVELOPER = ['aborterror'];

const shouldIgnoreErrorForClient = (errorMessage: string): boolean => {
  const lowerMessage = errorMessage.toLowerCase();
  return IGNORED_ERROR_PATTERNS.some((pattern) =>
    lowerMessage.includes(pattern.toLowerCase()),
  );
};

const shouldIgnoreErrorForDeveloper = (errorMessage: string): boolean => {
  const lowerMessage = errorMessage.toLowerCase();
  return IGNORED_ERROR_PATTERNS_DEVELOPER.some((pattern) =>
    lowerMessage.includes(pattern.toLowerCase()),
  );
};

function isPaymentKitErrorLike(
  e: unknown,
): e is { code?: string; httpStatus?: number } {
  return !!e && typeof e === 'object' && typeof (e as any).code === 'string';
}

function getErrorMessage(e: unknown): string {
  if (typeof e === 'string') return e;
  if (
    e &&
    typeof e === 'object' &&
    'message' in e &&
    typeof (e as any).message === 'string'
  ) {
    return (e as any).message as string;
  }
  return 'Unknown error occurred';
}

function extractPaymentCode(e: unknown, depth = 0): string | undefined {
  if (!e || depth > 4) return undefined;
  if (isPaymentKitErrorLike(e)) return (e as any).code as string;
  const cause = (e as any)?.cause;
  if (cause) {
    const c = extractPaymentCode(cause, depth + 1);
    if (c) return c;
  }
  return undefined;
}

type ErrorWithOptionalMeta = Error & {
  code?: string;
  httpStatus?: number;
  details?: unknown;
  cause?: unknown;
};

function hasOwn(obj: unknown, key: string): boolean {
  return typeof obj === 'object' && obj !== null && Object.hasOwn(obj, key);
}

function getCause(err: unknown): unknown | undefined {
  if (!err || typeof err !== 'object') return undefined;
  if (hasOwn(err, 'cause')) return (err as { cause?: unknown }).cause;
  return undefined;
}

function getErrorChain(err: unknown, maxDepth = 8): unknown[] {
  const chain: unknown[] = [];
  let current: unknown = err;
  let depth = 0;
  while (current && depth < maxDepth) {
    chain.push(current);
    const next = getCause(current);
    if (!next || next === current) break;
    current = next;
    depth += 1;
  }
  return chain;
}

function getRootError(err: unknown): unknown {
  const chain = getErrorChain(err);
  return chain[chain.length - 1] ?? err;
}

export const processErrorMessage = (error: unknown): ChatErrorCode => {
  // Try to parse JSON error from ai-sdk's getErrorMessage
  let actualError: unknown = error;
  let statusCode: number | undefined;
  let responseBody: string | undefined;

  if (error instanceof Error && error.message) {
    try {
      const parsed = JSON.parse(error.message);
      if (parsed && typeof parsed === 'object') {
        // Extract statusCode and responseBody if available
        statusCode = parsed.statusCode;
        responseBody = parsed.responseBody;

        // Reconstruct error-like object from parsed JSON
        actualError = {
          ...parsed,
          toString: () => parsed.message || error.message,
        };

        // If responseBody contains nested error, try to parse it
        if (responseBody && typeof responseBody === 'string') {
          try {
            const bodyParsed = JSON.parse(responseBody);
            if (bodyParsed.error && typeof bodyParsed.error === 'object') {
              actualError = {
                ...bodyParsed.error,
                statusCode,
                toString: () =>
                  bodyParsed.error.message || parsed.message || error.message,
              };
            }
          } catch {
            // Failed to parse responseBody
          }
        }
      }
    } catch {
      // Not JSON, use original error
    }
  }

  const errorMessage = getErrorMessage(actualError);

  // Log root error to console for quick view
  const root = getRootError(actualError) as ErrorWithOptionalMeta;

  // Determine the error code to return
  let errorCode: ChatErrorCode;

  const code = extractPaymentCode(actualError);
  if (code) {
    switch (code) {
      case PaymentErrorCode.HUB_INSUFFICIENT_FUNDS:
        errorCode = ChatErrorCode.INSUFFICIENT_FUNDS;
        break;
      case PaymentErrorCode.RAV_CONFLICT:
        errorCode = ChatErrorCode.RAV_CONFLICT;
        break;
      case PaymentErrorCode.PAYMENT_REQUIRED:
        errorCode = ChatErrorCode.PAYMENT_REQUIRED;
        break;
      default:
        errorCode = ChatErrorCode.PAYMENT_ERROR;
        break;
    }
  } else if (statusCode === 402) {
    errorCode = ChatErrorCode.PAYMENT_REQUIRED;
  } else if (shouldIgnoreErrorForDeveloper(errorMessage)) {
    errorCode = ChatErrorCode.IGNORED_ERROR;
  } else if (shouldIgnoreErrorForClient(errorMessage)) {
    errorCode = ChatErrorCode.IGNORED_ERROR;
  } else {
    errorCode = ChatErrorCode.NETWORK_ERROR;
  }

  // Always process the error (log and send to Sentry) unless it should be ignored for developer
  if (!shouldIgnoreErrorForDeveloper(errorMessage)) {
    console.error(root ?? actualError);
    // Capture root error with Sentry for better grouping
    Sentry.captureException(root ?? actualError);
  }

  return errorCode;
};
