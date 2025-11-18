import { getHttpClient } from '@/shared/services/payment-clients';
import { mergeRequestBody } from '@/shared/utils/merge-extra-body';

/**
 * Create a fetch-compatible function backed by Payment Kit.
 * It automatically handles payment-channel headers and streaming settlement.
 */
export function createPaymentFetch(_options?: {
  maxAmount?: bigint;
  extraBody?: Record<string, unknown>;
}) {
  const extraBody = _options?.extraBody;
  return async function paymentFetch(
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> {
    const targetUrl = new URL(
      typeof input === 'string'
        ? input
        : ((input as any).url ?? input.toString()),
    );
    // If caller passed a Request object with an AbortSignal, forward it when init.signal is absent
    const incomingSignal =
      typeof input === 'object' && input !== null && 'signal' in (input as any)
        ? ((input as any).signal as AbortSignal | undefined)
        : undefined;
    const finalInit: RequestInit | undefined =
      !init?.signal && incomingSignal
        ? { ...init, signal: incomingSignal }
        : init;

    // Remove any Authorization header from upstream since DID Payment protocol
    // handles authentication through its own mechanism
    if (finalInit?.headers) {
      const headers = new Headers(finalInit.headers);
      headers.delete('Authorization');
      finalInit.headers = headers;
    }

    const methodFromInit = (finalInit?.method ?? 'POST').toUpperCase() as
      | 'GET'
      | 'POST'
      | 'PUT'
      | 'DELETE'
      | 'PATCH';

    const client = await getHttpClient();
    const requestInit = mergeRequestBody(finalInit, extraBody);

    const handle = await client.requestWithPayment(
      methodFromInit,
      targetUrl.toString(),
      requestInit,
    );

    return handle.response;
  };
}
