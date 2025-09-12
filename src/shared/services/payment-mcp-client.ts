import { createMcpClient, PaymentChannelMcpClient, type CreateMcpClientOptions } from '@nuwa-ai/payment-kit';
import { IdentityKitWeb } from '@nuwa-ai/identity-kit-web';
import type { NuwaMCPClient, PromptDefinition, PromptMessagesResult, ResourceDefinition, ResourceTemplateDefinition } from '../types/mcp-client';
import { MCPError } from '../types/mcp-client';

/**
 * Adapter that wraps PaymentChannelMcpClient to provide NuwaMCPClient interface
 * This enables seamless integration with existing MCP client usage patterns
 * while adding payment capabilities.
 */
export class PaymentMcpClientAdapter implements NuwaMCPClient {
  
  constructor(private paymentClient: PaymentChannelMcpClient) {
  }

  get raw() {
    return this.paymentClient;
  }

  async tools(): Promise<Record<string, any>> {
    try {
      return await this.paymentClient.tools();
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
      const result = await this.paymentClient.listPrompts();
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

  async getPrompt(name: string, args?: Record<string, unknown>): Promise<PromptMessagesResult> {
    try {
      const content = await this.paymentClient.loadPrompt(name, args);
      
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

  async resources(): Promise<Record<string, ResourceDefinition | ResourceTemplateDefinition>> {
    try {
      const [resources, templates] = await Promise.all([
        this.paymentClient.listResources(),
        this.paymentClient.listResourceTemplates(),
      ]);

      const resourcesMap: Record<string, ResourceDefinition | ResourceTemplateDefinition> = {};

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
      const result = await this.paymentClient.readResource(uri);
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
      const result = await this.paymentClient.readResource({ uri: uriTemplate, ...args });
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
    // PaymentChannelMcpClient doesn't have a close method, but we can clean up if needed
    // For now, this is a no-op
  }

  // Additional payment-specific methods that can be accessed via the adapter
  getPaymentClient(): PaymentChannelMcpClient {
    return this.paymentClient;
  }
}

/**
 * Creates a PaymentMcpClientAdapter with DID authentication
 * This is the main entry point for creating payment-enabled MCP clients
 */
export async function createPaymentMcpClient(
  url: string,
  options: Partial<CreateMcpClientOptions> = {},
): Promise<PaymentMcpClientAdapter> {
  // Initialize identity kit for DID authentication
  const sdk = await IdentityKitWeb.init({ storage: 'local' });

  const paymentClient = await createMcpClient({
    baseUrl: url,
    env: sdk.getIdentityEnv(),
    //TODO: maxAmount should be configurable
    maxAmount: BigInt(0), // Default max amount, can be overridden
    debug: true,
    ...options,
  });

  return new PaymentMcpClientAdapter(paymentClient);
}
