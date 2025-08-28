import type { Message, UIMessage } from 'ai';

export function convertToUIMessage(message: Message): UIMessage {
  if (!message.parts) {
    return {
      id: message.id,
      role: message.role,
      content: message.content,
      parts: [],
    };
  }
  return {
    id: message.id,
    role: message.role,
    content: message.content,
    parts: message.parts,
  };
}

import { Sentry } from '@/shared/services/sentry';
import { PaymentErrorCode } from '@nuwa-ai/payment-kit';

// Configuration: Error patterns to ignore (case-insensitive matching) for the client user
const IGNORED_ERROR_PATTERNS = ['json parsing', 'payeedid'];

// Configuration: Error patterns to ignore (case-insensitive matching) for the developer
const IGNORED_ERROR_PATTERNS_DEVELOPER = ['aborterror'];

// Configuration: Standard error message returned to client
const CLIENT_ERROR_MESSAGE =
  'Please check your network connection and try again.';

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
  return (
    typeof obj === 'object' &&
    obj !== null &&
    Object.prototype.hasOwnProperty.call(obj, key)
  );
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

export const processErrorMessage = (error: unknown): string => {
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

  const code = extractPaymentCode(actualError);
  if (code) {
    switch (code) {
      case PaymentErrorCode.HUB_INSUFFICIENT_FUNDS:
        return 'Insufficient funds, please top up your balance';
      case PaymentErrorCode.RAV_CONFLICT:
        return 'Payment conflict, please try again';
      case PaymentErrorCode.PAYMENT_REQUIRED:
        return 'Payment required, please retry or top up';
      default:
        return 'Payment error, please try again';
    }
  }

  // Check for 402 status code
  if (statusCode === 402) {
    return 'Payment required, please retry or top up';
  }

  const errorMessage = getErrorMessage(actualError);

  // Log root error to console for quick view
  const root = getRootError(actualError) as ErrorWithOptionalMeta;
  //console.error('Chat Stream (root)', root);

  // Check if error should be ignored for developer, if true, not sending errors to sentry
  if (shouldIgnoreErrorForDeveloper(errorMessage)) {
    return 'IGNORED_ERROR';
  }

  // Capture root error with Sentry for better grouping
  Sentry.captureException(root ?? actualError);

  // Check if error should be ignored, errors are still sent to sentry
  if (shouldIgnoreErrorForClient(errorMessage)) {
    return 'IGNORED_ERROR';
  }

  // Always return the same message to client
  return CLIENT_ERROR_MESSAGE;
};
