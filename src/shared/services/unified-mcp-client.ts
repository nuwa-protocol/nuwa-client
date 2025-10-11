import { IdentityKitWeb } from '@nuwa-ai/identity-kit-web';
import { createMcpClient, UniversalMcpClient, McpServerType } from '@nuwa-ai/payment-kit';
import { PostMessageMCPTransport } from '@nuwa-ai/ui-kit';
import type {
  NuwaMCPClient,
  PromptDefinition,
  PromptMessagesResult,
  ResourceDefinition,
  ResourceTemplateDefinition,
} from '../types/mcp-client';
import { MCPError } from '../types/mcp-client';

/**
 * Adapter that wraps UniversalMcpClient to provide NuwaMCPClient interface
 * This enables seamless integration with existing MCP client usage patterns
 * while supporting both payment-enabled and standard MCP servers.
 */
export class UnifiedMcpClientAdapter implements NuwaMCPClient {
  constructor(private universalClient: UniversalMcpClient) {}

  get raw() {
    return this.universalClient;
  }

  async tools(): Promise<Record<string, any>> {
    try {
      return await this.universalClient.tools();
    } catch (err: any) {
      throw new MCPError({
        message: `Failed to list tools: ${err.message}`,
        code: err.code,
        detail: err.detail || err.stack,
      });
    }
  }

  async prompts(): Promise<Record<string, PromptDefinition>> {
    try {
      const result = await this.universalClient.listPrompts();
      const promptsMap: Record<string, PromptDefinition> = {};

      if (result && Array.isArray(result.prompts)) {
        for (const prompt of result.prompts) {
          if (prompt && prompt.name) {
            promptsMap[prompt.name] = {
              name: prompt.name,
              description: prompt.description,
              arguments: prompt.arguments || [],
            };
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
  }

  async prompt(name: string): Promise<PromptDefinition | undefined> {
    const allPrompts = await this.prompts();
    return allPrompts[name];
  }

  async getPrompt(
    name: string,
    args?: Record<string, unknown>,
  ): Promise<PromptMessagesResult> {
    try {
      const content = await this.universalClient.loadPrompt(name, args);

      // Convert string content to PromptMessagesResult format
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: content,
            },
          },
        ],
      };
    } catch (err: any) {
      throw new MCPError({
        message: `Failed to get prompt "${name}": ${err.message}`,
        code: err.code,
        detail: err.detail || err.stack,
      });
    }
  }

  async resources(): Promise<
    Record<string, ResourceDefinition | ResourceTemplateDefinition>
  > {
    try {
      const [resources, templates] = await Promise.all([
        this.universalClient.listResources(),
        this.universalClient.listResourceTemplates(),
      ]);

      const resourcesMap: Record<
        string,
        ResourceDefinition | ResourceTemplateDefinition
      > = {};

      // Add static resources
      if (Array.isArray(resources)) {
        for (const resource of resources) {
          if (resource && resource.uri) {
            resourcesMap[resource.uri] = {
              uri: resource.uri,
              name: resource.name,
              mimeType: resource.mimeType,
            };
          }
        }
      }

      // Add resource templates
      if (Array.isArray(templates)) {
        for (const template of templates) {
          if (template && template.uriTemplate) {
            resourcesMap[template.uriTemplate] = {
              uriTemplate: template.uriTemplate,
              name: template.name,
              mimeType: template.mimeType,
              arguments: template.arguments || [],
            };
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
  }

  async readResource<T = unknown>(uri: string): Promise<T> {
    try {
      const result = await this.universalClient.readResource(uri);
      return result as T;
    } catch (err: any) {
      throw new MCPError({
        message: `Failed to read resource "${uri}": ${err.message}`,
        code: err.code,
        detail: err.detail || err.stack,
      });
    }
  }

  async readResourceTemplate<T = unknown>(
    uriTemplate: string,
    args: Record<string, unknown>,
  ): Promise<T> {
    try {
      const result = await this.universalClient.readResource({
        uri: uriTemplate,
        ...args,
      });
      return result as T;
    } catch (err: any) {
      throw new MCPError({
        message: `Failed to read resource template "${uriTemplate}": ${err.message}`,
        code: err.code,
        detail: err.detail || err.stack,
      });
    }
  }

  async close(): Promise<void> {
    await this.universalClient.close();
  }

  // Additional methods that provide access to Universal client capabilities
  getUniversalClient(): UniversalMcpClient {
    return this.universalClient;
  }

  // Convenience methods for checking server capabilities
  getServerType(): McpServerType {
    return this.universalClient.getServerType();
  }

  supportsPayment(): boolean {
    return this.universalClient.supportsPayment();
  }

  supportsAuth(): boolean {
    return this.universalClient.supportsAuth();
  }
}

// Lightweight URL-based client cache to prevent immediate reconnection storms
// For application-level client management, use RemoteMCPManager instead
const clientCache = new Map<string, UnifiedMcpClientAdapter>();

/**
 * Creates a unified MCP client that supports both HTTP and PostMessage transports
 * This is the main entry point for creating MCP clients in nuwa-client
 * 
 * Note: This function creates a new client instance each time. For application-level
 * client management (e.g., Cap-based MCP servers), use RemoteMCPManager instead.
 * This lightweight caching is only for preventing immediate reconnections in error scenarios.
 */
export async function createUnifiedMcpClient(
  url: string,
  transportType: 'httpStream' | 'postMessage' = 'httpStream',
  postMessageOptions?: {
    targetWindow: Window;
    targetOrigin?: string;
    allowedOrigins?: string[];
    debug?: boolean;
    timeout?: number;
  },
): Promise<UnifiedMcpClientAdapter> {
  // Lightweight caching to prevent immediate reconnections in error scenarios
  const cacheKey = url;
  
  // Return existing client if available and still connected
  const existingClient = clientCache.get(cacheKey);
  if (existingClient) {
    try {
      // Test if the client is still functional by checking server type
      existingClient.getServerType();
      return existingClient;
    } catch (error) {
      // Client is no longer functional, remove from cache
      clientCache.delete(cacheKey);
      try {
        await existingClient.close();
      } catch (closeError) {
        console.warn('Failed to close stale MCP client:', closeError);
      }
    }
  }

  // Initialize identity kit for DID authentication
  const sdk = await IdentityKitWeb.init({ storage: 'local' });

  let customTransport;
  
  if (transportType === 'postMessage') {
    if (!postMessageOptions) {
      throw new Error('PostMessage transport requires postMessageOptions');
    }
    
    // Create PostMessage transport using ui-kit
    customTransport = new PostMessageMCPTransport({
      targetWindow: postMessageOptions.targetWindow,
      targetOrigin: postMessageOptions.targetOrigin,
      allowedOrigins: postMessageOptions.allowedOrigins,
      debug: postMessageOptions.debug,
      timeout: postMessageOptions.timeout,
    });
  }

  // Create universal client with custom transport if provided
  const universalClient = await createMcpClient({
    baseUrl: url,
    env: sdk.getIdentityEnv(),
    maxAmount: BigInt(0), // Default max amount, can be overridden
    debug: true,
    // Pass custom transport if using PostMessage
    ...(customTransport && { customTransport }),
  });

  const clientAdapter = new UnifiedMcpClientAdapter(universalClient);
  
  // Cache the client for immediate reuse (prevents reconnection storms)
  clientCache.set(cacheKey, clientAdapter);
  
  return clientAdapter;
}

/**
 * Close and remove a cached client instance.
 * This function properly closes the client connection and removes it from cache
 * to prevent resource leaks.
 */
export async function closeUnifiedMcpClient(url: string): Promise<void> {
  const client = clientCache.get(url);
  if (client) {
    try {
      await client.close();
    } catch (error) {
      console.warn(`Failed to close MCP client for ${url}:`, error);
    } finally {
      // Always remove from cache, even if close failed
      clientCache.delete(url);
    }
  }
}

/**
 * Close all cached client instances.
 * Useful for application shutdown or cleanup.
 */
export async function closeAllUnifiedMcpClients(): Promise<void> {
  const closePromises: Promise<void>[] = [];
  
  for (const [cacheKey, client] of clientCache.entries()) {
    closePromises.push(
      client.close().catch((error) => {
        console.warn(`Failed to close MCP client ${cacheKey}:`, error);
      })
    );
  }
  
  // Wait for all clients to close
  await Promise.allSettled(closePromises);
  
  // Clear the cache
  clientCache.clear();
}

/**
 * Get the number of cached clients (for debugging/monitoring)
 */
export function getCachedClientCount(): number {
  return clientCache.size;
}
