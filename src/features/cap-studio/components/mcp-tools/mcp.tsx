import {
  Activity,
  ArrowLeft,
  BrushCleaning,
  Copy,
  Plug,
  RefreshCw,
  Settings,
  Terminal,
  Unplug,
  Zap,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  ScrollArea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui';
import {
  createNuwaMCPClient,
} from '@/shared/services/mcp-client';
import { createPaymentMcpClient } from '@/shared/services/payment-mcp-client';
import type { McpTransportType, NuwaMCPClient } from '@/shared/types';
import type { LocalCap } from '../../types';
import { DashboardGrid } from '../layout/dashboard-layout';
import { McpDebugPanel } from './debug-panel';

interface LogEntry {
  id: string;
  type: 'info' | 'error' | 'success' | 'warning';
  message: string;
  timestamp: number;
  data?: any;
}

interface ConnectionConfig {
  url: string;
  transport: McpTransportType | '';
  name?: string;
}

interface McpProps {
  cap?: LocalCap | null;
  serverName?: string | null;
}

export function Mcp({ cap, serverName }: McpProps) {
  const navigate = useNavigate();
  const [url, setUrl] = useState('http://localhost:8080/mcp');
  const [transport, setTransport] = useState<McpTransportType | ''>('');
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [client, setClient] = useState<NuwaMCPClient | null>(null);
  const [tools, setTools] = useState<string[]>([]);
  const [toolsMap, setToolsMap] = useState<Record<string, any>>({});
  const [prompts, setPrompts] = useState<string[]>([]);
  const [promptsMap, setPromptsMap] = useState<Record<string, any>>({});
  const [resources, setResources] = useState<string[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [serverInfo, setServerInfo] = useState<any>(null);

  const pushLog = useCallback((entry: Omit<LogEntry, 'id' | 'timestamp'>) => {
    setLogs((prev) =>
      [
        {
          ...entry,
          id: `log_${Date.now()}_${Math.random()}`,
          timestamp: Date.now(),
        },
        ...prev,
      ].slice(0, 100),
    ); // Keep last 100 logs
  }, []);

  // Auto-populate connection details when server is specified via URL parameter
  useEffect(() => {
    if (cap && serverName && cap.capData.core.mcpServers[serverName]) {
      const serverConfig = cap.capData.core.mcpServers[serverName];
      setUrl(serverConfig.url);
      setTransport(serverConfig.transport);
    }
  }, [cap, serverName, pushLog]);

  const handleConnect = useCallback(async () => {
    if (connecting) return;

    setConnecting(true);
    try {
      pushLog({
        type: 'info',
        message: `Connecting to ${url} with transport: ${transport || 'httpStream'}`,
      });

      let newClient;
      if (transport === 'httpStream') {
        newClient = await createPaymentMcpClient(url);
      } else {
        newClient = await createNuwaMCPClient(url, transport || undefined);
      }

      setClient(newClient);
      setConnected(true);

      pushLog({
        type: 'success',
        message: 'Successfully connected to MCP server',
      });

      // Fetch server capabilities
      await fetchServerCapabilities(newClient);

      toast.success(`Successfully connected to ${url}`);
    } catch (err) {
      pushLog({
        type: 'error',
        message: `Connection failed: ${String(err)}`,
      });

      toast.error(String(err));

      // Note: In cap-studio, clients are created directly and don't need explicit cleanup
      // since they're not cached at this level
    } finally {
      setConnecting(false);
    }
  }, [connecting, url, transport, pushLog]);

  const fetchServerCapabilities = async (mcpClient: NuwaMCPClient) => {
    // Fetch tools
    try {
      const toolsList = await mcpClient.tools();
      const toolNames = Object.keys(toolsList);
      setTools(toolNames);
      setToolsMap(toolsList);
      pushLog({
        type: 'info',
        message: `Discovered ${toolNames.length} tools: ${toolNames.join(', ')}`,
        data: { tools: toolNames },
      });
    } catch (err) {
      pushLog({
        type: 'warning',
        message: `No tools available: ${String(err)}`,
      });
    }

    // Fetch prompts
    try {
      const promptsList = await mcpClient.prompts();
      const promptNames = Object.keys(promptsList);
      setPrompts(promptNames);
      setPromptsMap(promptsList);
      pushLog({
        type: 'info',
        message: `Discovered ${promptNames.length} prompts: ${promptNames.join(', ')}`,
        data: { prompts: promptNames },
      });
    } catch (err) {
      pushLog({
        type: 'warning',
        message: `No prompts available: ${String(err)}`,
      });
    }

    // Fetch resources
    try {
      const resourcesList = await mcpClient.resources();
      const resourceNames = Object.keys(resourcesList);
      setResources(resourceNames);
      pushLog({
        type: 'info',
        message: `Discovered ${resourceNames.length} resources: ${resourceNames.join(', ')}`,
        data: { resources: resourceNames },
      });
    } catch (err) {
      pushLog({
        type: 'warning',
        message: `No resources available: ${String(err)}`,
      });
    }

    // Set server info
    setServerInfo({
      url,
      transport: transport || 'httpStream',
      toolCount: tools.length,
      promptCount: prompts.length,
      resourceCount: resources.length,
      connectedAt: Date.now(),
    });
  };

  const handleDisconnect = async () => {
    if (!client) return;

    try {
      await client.close();
      setClient(null);
      setConnected(false);
      setTools([]);
      setToolsMap({});
      setPrompts([]);
      setPromptsMap({});
      setResources([]);
      setServerInfo(null);

      pushLog({
        type: 'info',
        message: 'Disconnected from MCP server',
      });

      toast.success('Successfully disconnected from MCP server');
    } catch (err) {
      pushLog({
        type: 'error',
        message: `Disconnect error: ${String(err)}`,
      });
    }
  };

  const handlePing = async () => {
    if (!client) {
      pushLog({ type: 'error', message: 'Not connected to any server' });
      return;
    }

    try {
      // Try ping on raw client if available
      if (client.raw && typeof client.raw.ping === 'function') {
        await client.raw.ping();
        pushLog({ type: 'success', message: 'Server ping successful' });
      } else {
        // Fallback: try a simple prompts() call as a health check
        await client.prompts();
        pushLog({
          type: 'success',
          message: 'Server health check successful',
        });
      }

      toast.success('MCP server ping successful');
    } catch (err) {
      pushLog({ type: 'error', message: `Server ping failed: ${String(err)}` });

      toast.error(String(err));
    }
  };

  const loadConnection = (config: ConnectionConfig) => {
    setUrl(config.url);
    setTransport(
      config.transport && ['httpStream', 'sse'].includes(config.transport)
        ? config.transport
        : '',
    );
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const copyLogs = async () => {
    const logText = logs
      .map(
        (log) =>
          `[${new Date(log.timestamp).toLocaleTimeString()}] ${log.type.toUpperCase()}: ${log.message}`,
      )
      .join('\n');

    try {
      await navigator.clipboard.writeText(logText);
      toast.success('Debug logs copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy logs to clipboard');
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">MCP Tools</h3>
          <p className="text-sm text-muted-foreground">
            Test and debug Model Context Protocol connections and tools
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </Button>
      </div>

      <DashboardGrid cols={3}>
        {/* Connection Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center">
              <Plug className="h-4 w-4 mr-2" />
              Connection
            </CardTitle>
            <CardDescription>
              Connect to an MCP server to access tools and resources
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Manual Connection */}
            <div className="space-y-3">
              <div className="space-y-2">
                <div className="text-sm font-medium">Server URL</div>
                <Input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="http://localhost:8080/mcp"
                  disabled={connecting || connected}
                />
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">Transport</div>
                <Select
                  value={transport}
                  onValueChange={(value: string) => {
                    const allowed = ['httpStream', 'sse'];
                    if (allowed.includes(value)) {
                      setTransport(value as McpTransportType);
                    } else {
                      setTransport('');
                    }
                  }}
                  disabled={connecting || connected}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select transport" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="httpStream">HTTP Stream</SelectItem>
                    <SelectItem value="sse">Server-Sent Events</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Connection Actions */}
            <div className="flex items-center space-x-2 pt-2">
              {connected ? (
                <>
                  <Button
                    onClick={handleDisconnect}
                    variant="destructive"
                    className="flex-1"
                  >
                    <Unplug className="h-4 w-4 mr-2" />
                    Disconnect
                  </Button>
                  <Button onClick={handlePing} variant="outline">
                    <Zap className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <Button
                  onClick={handleConnect}
                  disabled={connecting || !url.trim()}
                  className="flex-1"
                >
                  {connecting ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Plug className="h-4 w-4 mr-2" />
                      Connect
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Server Info */}
        {/* Server Status & Stats */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center">
              <Activity className="h-4 w-4 mr-2" />
              Server Status
            </CardTitle>
            <CardDescription>
              Information about the connected MCP server
            </CardDescription>
          </CardHeader>
          <CardContent>
            {serverInfo ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-6 text-sm">
                  <div>
                    <span className="text-muted-foreground">URL:</span>
                    <p className="font-mono text-xs break-all mt-1">
                      {serverInfo.url}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Transport:</span>
                    <p className="capitalize mt-1">{serverInfo.transport}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-6 pt-4 border-t">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {tools.length}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Tools
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {prompts.length}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Prompts
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {resources.length}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Resources
                    </div>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground pt-4 border-t">
                  Connected: {new Date(serverInfo.connectedAt).toLocaleString()}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Settings className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-base font-medium">No Server Connected</p>
                <p className="text-sm mt-1">
                  Connect to a server to view status information
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </DashboardGrid>

      {/* Debug Interface */}
      {connected && client && (
        <McpDebugPanel
          client={client}
          tools={tools}
          toolsMap={toolsMap}
          prompts={prompts}
          promptsMap={promptsMap}
          resources={resources}
          onLog={pushLog}
        />
      )}

      {/* Debug Logs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center">
                <Terminal className="h-4 w-4 mr-2" />
                Debug Logs
              </CardTitle>
              <CardDescription>
                Real-time logging of MCP operations
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" onClick={copyLogs}>
                <Copy className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={clearLogs}>
                <BrushCleaning className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64 w-full rounded-md border bg-muted/30 p-4">
            {logs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Terminal className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No debug logs yet</p>
                <p className="text-xs">Connect to a server to see logs</p>
              </div>
            ) : (
              <div className="space-y-1 font-mono text-sm">
                {logs.map((log) => {
                  const getLogColor = (type: string) => {
                    switch (type) {
                      case 'error':
                        return 'text-red-600';
                      case 'warning':
                        return 'text-yellow-600';
                      case 'success':
                        return 'text-green-600';
                      case 'info':
                        return 'text-blue-600';
                      default:
                        return 'text-foreground';
                    }
                  };

                  const getLogIcon = (type: string) => {
                    switch (type) {
                      case 'error':
                        return '❌';
                      case 'warning':
                        return '⚠️';
                      case 'success':
                        return '✅';
                      case 'info':
                        return 'ℹ️';
                      default:
                        return '•';
                    }
                  };

                  return (
                    <div key={log.id} className="flex items-start space-x-2">
                      <span className="text-muted-foreground text-xs mt-0.5 w-20 flex-shrink-0">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                      <span className="mt-0.5">{getLogIcon(log.type)}</span>
                      <span
                        className={`${getLogColor(log.type)} flex-1 break-words`}
                      >
                        {log.message}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
