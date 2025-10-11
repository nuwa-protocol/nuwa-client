import { createUnifiedMcpClient } from '@/shared/services/unified-mcp-client';
import type { Cap } from '@/shared/types';

interface RemoteMCPInstance {
  clients: Map<string, any>;
  tools: Record<string, any>;
  initialized: boolean;
}

class RemoteMCPManager {
  private static instance: RemoteMCPManager;
  private currentInstance: RemoteMCPInstance | null = null;
  private currentCapId: string | null = null;

  private constructor() {}

  static getInstance(): RemoteMCPManager {
    if (!RemoteMCPManager.instance) {
      RemoteMCPManager.instance = new RemoteMCPManager();
    }
    return RemoteMCPManager.instance;
  }

  async initializeForCap(cap: Cap): Promise<Record<string, any>> {
    // If already initialized for this cap, return existing tools
    if (
      this.currentInstance &&
      this.currentCapId === cap.id &&
      this.currentInstance.initialized
    ) {
      return this.currentInstance.tools;
    }

    // Clean up existing instance if switching caps
    if (this.currentInstance && this.currentCapId !== cap.id) {
      await this.cleanup();
    }

    // Initialize new MCP instance for the cap
    const clients = new Map<string, any>();
    const mcpServers = cap.core.mcpServers || {};

    // Initialize all MCP clients using unified client
    for (const [serverName, server] of Object.entries(mcpServers)) {
      try {
        // Use unified MCP client which automatically detects server type
        const client = await createUnifiedMcpClient(server);
        clients.set(serverName, client);
      } catch (error) {
        throw new Error(
          `Failed to connect to MCP server ${serverName} at ${server}: ${error}`,
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
          // Preserve the original tool structure, especially the type property
          const enhancedTool = Object.assign(toolDefinition as object, {
            _serverName: serverName,
            _originalName: toolName,
          });
          allTools[prefixedToolName] = enhancedTool;
        }
      } catch (error) {
        console.warn(
          `Failed to get tools from MCP server ${serverName}:`,
          error,
        );
      }
    }

    this.currentInstance = {
      clients,
      tools: allTools,
      initialized: true,
    };
    this.currentCapId = cap.id;
    
    return allTools;
  }

  async cleanup(): Promise<void> {
    if (this.currentInstance?.initialized) {
      try {
        for (const [
          serverName,
          client,
        ] of this.currentInstance.clients.entries()) {
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

    this.currentInstance = null;
    this.currentCapId = null;
  }

  getCurrentTools(): Record<string, any> {
    return this.currentInstance?.tools || {};
  }

  isInitialized(): boolean {
    return this.currentInstance?.initialized || false;
  }
}

export { RemoteMCPManager };
