import { getHttpClient } from '@/shared/services/payment-clients';

/**
 * Create a fetch-compatible function backed by Payment Kit.
 * It automatically handles payment-channel headers and streaming settlement.
 */
export function createPaymentFetch(
  baseUrl: string,
  _options?: { maxAmount?: bigint },
) {
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
      !init?.signal && incomingSignal ? { ...init, signal: incomingSignal } : init;

    const methodFromInit = (finalInit?.method ?? 'POST').toUpperCase() as
      | 'GET'
      | 'POST'
      | 'PUT'
      | 'DELETE'
      | 'PATCH';

    const client = await getHttpClient();
    const handle = await client.requestWithPayment(
      methodFromInit,
      targetUrl.toString(),
      finalInit,
    );
    return handle.response;
  };
}
