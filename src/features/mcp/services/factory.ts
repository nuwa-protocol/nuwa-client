import { experimental_createMCPClient as createMCPClient } from "ai";
import { IdentityKitWeb } from "@nuwa-ai/identity-kit-web";
import { DIDAuth } from "@nuwa-ai/identity-kit";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

/**
 * Cached MCP client instances keyed by server URL.
 * We cache a *Promise* to avoid duplicate connections when multiple
 * callers race to create a client for the same URL.
 */
const CACHE = new Map<string, Promise<any>>();

// Supported transport identifiers
export type McpTransportType = "httpStream" | "sse";

/**
 * Return an MCP client connected to the given URL.
 *
 * If `transportType` is omitted, the factory will try HTTP streaming first and
 * fall back to SSE automatically.
 */
export async function getMcpClient(
  url: string,
  transportType?: McpTransportType,
): Promise<any> {
  if (CACHE.has(url)) {
    return CACHE.get(url)!;
  }

  const promise = (async () => {
    // 1. Prepare DIDAuth header (one-time per connection)
    const authHeader = await createDidAuthHeader(url);

    // 2. Resolve transport
    const finalTransport = await resolveTransport(url, authHeader, transportType);

    // 3. Create the client instance
    return createMCPClient({ transport: finalTransport });
  })();

  CACHE.set(url, promise);
  return promise;
}

/**
 * Close and remove a cached client instance.
 */
export async function closeMcpClient(url: string): Promise<void> {
  const clientPromise = CACHE.get(url);
  if (!clientPromise) return;
  try {
    const client = await clientPromise;
    await client.close();
  } catch (err) {
    // ignore
  }
  CACHE.delete(url);
}

async function createDidAuthHeader(url: string): Promise<string> {
  const sdk = await IdentityKitWeb.init({ storage: "local" });
  const payload = {
    operation: "mcp-json-rpc",
    params: { url },
  } as const;
  const sigObj = await sdk.sign(payload);
  return DIDAuth.v1.toAuthorizationHeader(sigObj);
}

async function resolveTransport(
  url: string,
  authHeader: string,
  explicitType?: McpTransportType,
): Promise<any> {
  const createHttpTransport = async () => {
    return new StreamableHTTPClientTransport(new URL(url), {
      requestInit: { headers: { Authorization: authHeader } },
    } as any);
  };

  const createSseTransport = async () => {
    return new SSEClientTransport(new URL(url), {
      requestInit: { headers: { Authorization: authHeader } },
    } as any);
  };

  // Explicit type requested by caller
  if (explicitType === "httpStream") {
    return createHttpTransport();
  }
  if (explicitType === "sse") {
    return createSseTransport();
  }

  // Auto-detect: try HTTP streaming then fallback to SSE
  // First try HTTP streaming
  try {
    // Quick HEAD probe – skip CORS preflight for same-origin
    const _headResp = await fetch(url, {
      method: "HEAD",
      headers: {
        Authorization: authHeader,
      },
    });
    // Even if the server responds 4xx to HEAD, it may still support
    // streaming GET requests (FastMCP behaves this way). Any successful
    // fetch response indicates the endpoint is reachable, so we assume
    // HTTP streaming is available unless the request itself fails.
    return createHttpTransport();
  } catch (_) {
    // Ignore probe errors – we'll fall back to SSE
    console.debug("Failed to probe HTTP streaming, falling back to SSE");
  }

  // Fallback SSE transport (works for HTTP streaming servers too, but less efficient).
  return createSseTransport();
} 