import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { DIDAuth } from '@nuwa-ai/identity-kit';
import { IdentityKitWeb } from '@nuwa-ai/identity-kit-web';
import { experimental_createMCPClient as createMCPClient } from 'ai';
import {
  MCPError,
  type McpTransportType,
  type NuwaMCPClient,
  type PromptDefinition,
  PromptMessagesResultSchema,
  PromptSchema,
  type ResourceDefinition,
  ResourceSchema,
  type ResourceTemplateDefinition,
  ResourceTemplateSchema,
} from '../types/mcp-client';
import { createDidAuthSigner, SignedSSEClientTransport } from './mcp-transport';

// Note: Client caching is now handled by GlobalMCPManager at a higher level
// This allows for better lifecycle management and Cap-based organization

/**
 * Creates a Nuwa-specific wrapper around the AI SDK's MCPClient
 * that provides typed access to prompts and resources.
 *
 * @param url The MCP server URL
 * @param transportType Optional transport type, auto-detected if not specified
 * @returns A Promise resolving to a NuwaMCPClient instance
 */
export async function createNuwaMCPClient(
  url: string,
  transportType?: McpTransportType,
): Promise<NuwaMCPClient> {
  // Create a new client instance (caching is handled by GlobalMCPManager)
  return (async () => {
    // 1. Prepare DIDAuth header (one-time per connection)
    const signer = await createDidAuthSigner(url);
    const initialHeader = await signer({});

    const buildTransport = async (): Promise<any> => {
      if (transportType === 'httpStream') {
        return new StreamableHTTPClientTransport(new URL(url), {
          requestInit: { headers: { Authorization: initialHeader } },
        } as any);
      }
      if (transportType === 'sse') {
        return new SignedSSEClientTransport(
          new URL(url),
          signer,
          initialHeader,
        );
      }
      // auto-detect
      try {
        await fetch(url, {
          method: 'HEAD',
          headers: { Authorization: initialHeader },
        });
        return new StreamableHTTPClientTransport(new URL(url), {
          requestInit: { headers: { Authorization: initialHeader } },
        } as any);
      } catch {
        return new SignedSSEClientTransport(
          new URL(url),
          signer,
          initialHeader,
        );
      }
    };

    const finalTransport = await buildTransport();

    // 3. Create the base client instance
    const rawClient = await createMCPClient({ transport: finalTransport });

    // Disable capability whitelist so we can use experimental methods like prompts/list
    if (typeof (rawClient as any).assertCapability === 'function') {
      (rawClient as any).assertCapability = () => {
        /* no-op */
      };
    }

    // 4. Create the enhanced client
    const client: NuwaMCPClient = {
      raw: rawClient,

      // Prompts API
      async prompts() {
        const passThroughSchema = { parse: (v: any) => v } as const;
        try {
          // Use rawClient as-is since it's already properly typed from getMcpClient
          const result = await (rawClient as any).request({
            request: { method: 'prompts/list', params: {} },
            resultSchema: passThroughSchema,
          });

          // Validate and transform the response
          const promptsMap: Record<string, PromptDefinition> = {};
          if (Array.isArray(result?.prompts)) {
            for (const promptData of result.prompts) {
              try {
                const prompt = PromptSchema.parse(promptData);
                promptsMap[prompt.name] = prompt;
              } catch (err) {
                console.warn(
                  `Failed to parse prompt: ${JSON.stringify(promptData)}`,
                  err,
                );
              }
            }
          }
          return promptsMap;
        } catch (err: any) {
          throw new MCPError({
            message: `Failed to list prompts: ${err.message}`,
            code: err.code,
            detail: err.detail || err.stack,
          });
        }
      },

      async prompt(name: string) {
        const allPrompts = await client.prompts();
        return allPrompts[name];
      },

      async getPrompt(name: string, args?: Record<string, unknown>) {
        const passThroughSchema = { parse: (v: any) => v } as const;
        try {
          const result = await (rawClient as any).request({
            request: {
              method: 'prompts/get',
              params: {
                name,
                arguments: args || {},
              },
            },
            resultSchema: passThroughSchema,
          });

          // Validate the response
          return PromptMessagesResultSchema.parse(result);
        } catch (err: any) {
          throw new MCPError({
            message: `Failed to get prompt "${name}": ${err.message}`,
            code: err.code,
            detail: err.detail || err.stack,
          });
        }
      },

      // Tools API
      async tools() {
        try {
          if (rawClient && typeof rawClient.tools === 'function') {
            return await rawClient.tools();
          }
          return {};
        } catch (err: any) {
          throw new MCPError({
            message: `Failed to list tools: ${err.message}`,
            code: err.code,
            detail: err.detail || err.stack,
          });
        }
      },

      // Resources API
      async resources() {
        const passThroughSchema = { parse: (v: any) => v } as const;
        try {
          const result = await (rawClient as any).request({
            request: { method: 'resources/list', params: {} },
            resultSchema: passThroughSchema,
          });

          // Transform the response into a map
          const resourcesMap: Record<
            string,
            ResourceDefinition | ResourceTemplateDefinition
          > = {};

          if (Array.isArray(result?.resources)) {
            for (const resourceData of result.resources) {
              try {
                // Determine if it's a static resource or template
                if (typeof resourceData === 'string') {
                  // Simple string URI
                  resourcesMap[resourceData] = { uri: resourceData };
                } else if (resourceData?.uri) {
                  // Static resource with metadata
                  const resource = ResourceSchema.parse(resourceData);
                  resourcesMap[resource.uri] = resource;
                } else if (resourceData?.uriTemplate) {
                  // Resource template
                  const template = ResourceTemplateSchema.parse(resourceData);
                  resourcesMap[template.uriTemplate] = template;
                }
              } catch (err) {
                console.warn(
                  `Failed to parse resource: ${JSON.stringify(resourceData)}`,
                  err,
                );
              }
            }
          }

          return resourcesMap;
        } catch (err: any) {
          throw new MCPError({
            message: `Failed to list resources: ${err.message}`,
            code: err.code,
            detail: err.detail || err.stack,
          });
        }
      },

      async readResource<T = unknown>(uri: string): Promise<T> {
        const passThroughSchema = { parse: (v: any) => v } as const;
        try {
          const result = await (rawClient as any).request({
            request: { method: 'resources/read', params: { uri } },
            resultSchema: passThroughSchema,
          });
          return result as T;
        } catch (err: any) {
          throw new MCPError({
            message: `Failed to read resource "${uri}": ${err.message}`,
            code: err.code,
            detail: err.detail || err.stack,
          });
        }
      },

      async readResourceTemplate<T = unknown>(
        uriTemplate: string,
        args: Record<string, unknown>,
      ): Promise<T> {
        const passThroughSchema = { parse: (v: any) => v } as const;
        try {
          const result = await (rawClient as any).request({
            request: {
              method: 'resources/read',
              params: {
                uri: uriTemplate,
                arguments: args,
              },
            },
            resultSchema: passThroughSchema,
          });
          return result as T;
        } catch (err: any) {
          throw new MCPError({
            message: `Failed to read resource template "${uriTemplate}": ${err.message}`,
            code: err.code,
            detail: err.detail || err.stack,
          });
        }
      },

      // Utility methods
      async close() {
        await rawClient.close();
        // Note: Cache cleanup is handled by GlobalMCPManager
      },
    };

    // Add execute() methods to prompts for easier access
    await enhancePromptsWithExecute(client);

    return client;
  })();
}

/**
 * Close and remove a cached client instance.
 * Note: This function is deprecated. Client lifecycle is now managed by GlobalMCPManager.
 * Use GlobalMCPManager.cleanup() instead.
 */
export async function closeNuwaMCPClient(url: string): Promise<void> {
  console.warn('closeNuwaMCPClient is deprecated. Use GlobalMCPManager.cleanup() instead.');
  // No-op since caching is handled by GlobalMCPManager
}

/**
 * Enhances the client by adding execute() methods to each prompt
 * for more convenient access.
 */
async function enhancePromptsWithExecute(client: NuwaMCPClient): Promise<void> {
  try {
    const promptsMap = await client.prompts();
    const prompts = client.prompts as any;

    // Create a proxy object for prompts() that allows accessing prompts by name
    Object.defineProperty(client, 'prompts', {
      value: async () => {
        const freshMap = await prompts();

        // Add execute() methods to each prompt
        for (const [name, prompt] of Object.entries(freshMap)) {
          if (!freshMap[name].execute) {
            freshMap[name].execute = async (args?: Record<string, unknown>) => {
              return client.getPrompt(name, args);
            };
          }
        }

        return freshMap;
      },
      writable: true,
      configurable: true,
    });

    // Pre-populate the prompts object with known prompts for direct access
    const promptsObj = client.prompts as any;
    for (const [name, prompt] of Object.entries(promptsMap)) {
      promptsObj[name] = {
        ...prompt,
        execute: async (args?: Record<string, unknown>) => {
          return client.getPrompt(name, args);
        },
      };
    }
  } catch (err) {
    // If enhancing fails, we still have the basic client functionality
    console.warn('Failed to enhance prompts with execute() methods', err);
  }
}

/**
 * Creates a DID authentication header for the MCP request
 */
export async function createDidAuthHeader(url: string): Promise<string> {
  const sdk = await IdentityKitWeb.init({ storage: 'local' });
  const payload = {
    operation: 'mcp-json-rpc',
    params: { url },
  } as const;
  const sigObj = await sdk.sign(payload);
  return DIDAuth.v1.toAuthorizationHeader(sigObj);
}

/**
 * Resolves the appropriate transport based on the URL and explicit type
 */
export async function resolveTransport(
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
  if (explicitType === 'httpStream') {
    return createHttpTransport();
  }
  if (explicitType === 'sse') {
    return createSseTransport();
  }

  // Auto-detect: try HTTP streaming then fallback to SSE
  // First try HTTP streaming
  try {
    // Quick HEAD probe – skip CORS preflight for same-origin
    const _headResp = await fetch(url, {
      method: 'HEAD',
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
    console.debug('Failed to probe HTTP streaming, falling back to SSE');
  }

  // Fallback SSE transport (works for HTTP streaming servers too, but less efficient).
  return createSseTransport();
}
