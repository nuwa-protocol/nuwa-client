import { DIDAuth } from '@nuwa-ai/identity-kit';
import { IdentityKitWeb } from '@nuwa-ai/identity-kit-web';

/**
 * Return a fetch implementation that automatically adds DIDAuth header.
 */
export const createAuthorizedFetch = () => {
  return async (
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> => {
    // We only sign client-side requests; if running on server, fall back.
    if (typeof window === 'undefined') {
      throw new Error('createAuthorizedFetch is only available on client side');
    }

    try {
      const sdk = await IdentityKitWeb.init({ storage: 'local' });

      // Build signing payload – follow GatewayDebug.ts convention
      const url = new URL(input.toString());
      const payload = {
        operation: 'llm-gateway-request',
        params: {
          method: (init?.method ?? 'POST').toUpperCase(),
          path: url.pathname,
        },
      } as const;

      const sigObj = await sdk.sign(payload);
      const authHeader = DIDAuth.v1.toAuthorizationHeader(sigObj);

      const mergedHeaders = new Headers(init?.headers ?? {});
      mergedHeaders.set('Authorization', authHeader);

      return fetch(input, { ...init, headers: mergedHeaders });
    } catch (err) {
      console.error('Failed to sign DIDAuth header:', {
        error: err,
        url: input.toString(),
        method: init?.method ?? 'POST'
      });
      throw new Error(`Failed to sign DIDAuth header: ${err instanceof Error ? err.message : String(err)}`);
    }
  };
};
