import { createNuwaMCPClient } from '@/shared/services/mcp-client';
import type { Cap } from '@/shared/types/cap';

interface MCPInstance {
  clients: Map<string, any>;
  tools: Record<string, any>;
  initialized: boolean;
}

class GlobalMCPManager {
  private static instance: GlobalMCPManager;
  private currentMCPInstance: MCPInstance | null = null;
  private currentCapId: string | null = null;

  private constructor() {}

  static getInstance(): GlobalMCPManager {
    if (!GlobalMCPManager.instance) {
      GlobalMCPManager.instance = new GlobalMCPManager();
    }
    return GlobalMCPManager.instance;
  }

  async initializeForCap(cap: Cap): Promise<Record<string, any>> {
    // If already initialized for this cap, return existing tools
    if (
      this.currentMCPInstance &&
      this.currentCapId === cap.id &&
      this.currentMCPInstance.initialized
    ) {
      return this.currentMCPInstance.tools;
    }

    // Clean up existing instance if switching caps
    if (this.currentMCPInstance && this.currentCapId !== cap.id) {
      await this.cleanup();
    }

    // Initialize new MCP instance for the cap
    const clients = new Map<string, any>();
    const mcpServers = cap.core.mcpServers || {};

    // Initialize all MCP clients
    for (const [serverName, serverConfig] of Object.entries(mcpServers)) {
      try {
        const client = await createNuwaMCPClient(serverConfig.url);
        clients.set(serverName, client);
      } catch (error) {
        throw new Error(
          `Failed to connect to MCP server ${serverName} at ${serverConfig.url}: ${error}`,
        );
      }
    }

    // Get all tools from initialized clients
    const allTools: Record<string, any> = {};
    for (const [serverName, client] of clients.entries()) {
      try {
        const serverTools = await client.tools();
        for (const [toolName, toolDefinition] of Object.entries(serverTools)) {
          const prefixedToolName = `${serverName}_${toolName}`;
          allTools[prefixedToolName] = {
            ...(toolDefinition as Record<string, any>),
            _serverName: serverName,
            _originalName: toolName,
          };
        }
      } catch (error) {
        console.warn(
          `Failed to get tools from MCP server ${serverName}:`,
          error,
        );
      }
    }

    this.currentMCPInstance = {
      clients,
      tools: allTools,
      initialized: true,
    };
    this.currentCapId = cap.id;

    return allTools;
  }

  async cleanup(): Promise<void> {
    if (this.currentMCPInstance?.initialized) {
      try {
        for (const [
          serverName,
          client,
        ] of this.currentMCPInstance.clients.entries()) {
          try {
            await client.close();
          } catch (error) {
            throw new Error(
              `Failed to close MCP client ${serverName}: ${error}`,
            );
          }
        }
      } catch (error) {
        throw new Error(`Error closing MCP connections: ${error}`);
      }
    }

    this.currentMCPInstance = null;
    this.currentCapId = null;
  }

  getCurrentTools(): Record<string, any> {
    return this.currentMCPInstance?.tools || {};
  }

  isInitialized(): boolean {
    return this.currentMCPInstance?.initialized || false;
  }
}

export { GlobalMCPManager };
