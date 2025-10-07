import {
  createMcpClient,
  UniversalMcpClient,
  type CreateMcpClientOptions,
} from '@nuwa-ai/payment-kit';
import { IdentityKitWeb } from '@nuwa-ai/identity-kit-web';
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
export class PaymentMcpClientAdapter implements NuwaMCPClient {
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
  getServerType() {
    return this.universalClient.getServerType();
  }

  supportsPayment() {
    return this.universalClient.supportsPayment();
  }

  supportsAuth() {
    return this.universalClient.supportsAuth();
  }
}

/**
 * Creates a PaymentMcpClientAdapter with DID authentication
 * This is the main entry point for creating universal MCP clients
 * that support both payment-enabled and standard MCP servers
 */
export async function createPaymentMcpClient(
  url: string,
  options: Partial<CreateMcpClientOptions> = {},
): Promise<PaymentMcpClientAdapter> {
  // Initialize identity kit for DID authentication
  const sdk = await IdentityKitWeb.init({ storage: 'local' });

  const universalClient = await createMcpClient({
    baseUrl: url,
    env: sdk.getIdentityEnv(),
    //TODO: maxAmount should be configurable
    maxAmount: BigInt(0), // Default max amount, can be overridden
    debug: true,
    ...options,
  });

  return new PaymentMcpClientAdapter(universalClient);
}
