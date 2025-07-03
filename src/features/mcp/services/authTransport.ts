import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { IdentityKitWeb } from "@nuwa-ai/identity-kit-web";
import { DIDAuth } from "@nuwa-ai/identity-kit";

/**
 * Utility: build a DIDAuth header signer – returns a function that signs arbitrary payloads.
 */
export async function createDidAuthSigner(baseUrl: string) {
  const sdk = await IdentityKitWeb.init({ storage: "local" });
  return async (body: unknown): Promise<string> => {
    const payload = {
      operation: "mcp-json-rpc",
      params: { body, url: baseUrl },
    } as const;
    const sig = await sdk.sign(payload);
    console.log('sig', sig);
    return DIDAuth.v1.toAuthorizationHeader(sig);
  };
}

type Signer = (body: unknown) => Promise<string>;

/**
 * Transport with per-request DIDAuth header (HTTP streaming).
 */
export class SignedStreamableHTTPClientTransport extends StreamableHTTPClientTransport {
  private signer: Signer;
  constructor(url: URL, signer: Signer, initialHeader: string) {
    super(url, { requestInit: { headers: { Authorization: initialHeader } } } as any);
    this.signer = signer;
  }
  async send(message: any): Promise<void> {
    // Inject new header each request
    const auth = await this.signer(message);
    (this as any).requestInit = (this as any).requestInit || {};
    (this as any).requestInit.headers = {
      ...(this as any).requestInit.headers,
      Authorization: auth,
    };
    return super.send(message);
  }
}

/**
 * Transport with per-request DIDAuth header (SSE fallback).
 */
export class SignedSSEClientTransport extends SSEClientTransport {
  private signer: Signer;
  constructor(url: URL, signer: Signer, initialHeader: string) {
    super(url, { requestInit: { headers: { Authorization: initialHeader } } } as any);
    this.signer = signer;
  }
  async send(message: any): Promise<void> {
    const auth = await this.signer(message);
    (this as any).requestInit = (this as any).requestInit || {};
    (this as any).requestInit.headers = {
      ...(this as any).requestInit.headers,
      Authorization: auth,
    };
    return super.send(message);
  }
} 