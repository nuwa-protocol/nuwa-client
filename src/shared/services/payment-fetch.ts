import { getHttpClient } from '@/shared/services/payment-clients';

/**
 * Create a fetch-compatible function backed by Payment Kit.
 * It automatically handles payment-channel headers and streaming settlement.
 */
export function createPaymentFetch(baseUrl: string, _options?: { maxAmount?: bigint }) {
  return async function paymentFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const targetUrl = new URL(typeof input === 'string' ? input : (input as any).url ?? input.toString());
    const methodFromInit = (init?.method ?? 'POST').toUpperCase() as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

    const client = await getHttpClient();
    const handle = await client.requestWithPayment(methodFromInit, targetUrl.toString(), init);
    return handle.response;
  };
}


