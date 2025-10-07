// to fix: need to unify the MCP client

import Form from '@rjsf/shadcn';
import validator from '@rjsf/validator-ajv8';
import {
  ArrowLeft,
  BrushCleaning,
  Copy,
  Plug,
  RefreshCw,
  Search,
  Terminal,
  Unplug,
} from 'lucide-react';
import { useCallback, useEffect, useId, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { CapUIRenderer } from '@/shared/components/cap-ui-renderer';
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
  closeNuwaMCPClient,
  createNuwaMCPClient,
} from '@/shared/services/mcp-client';
import { createPaymentMcpClient } from '@/shared/services/payment-mcp-client';
import type { NuwaMCPClient } from '@/shared/types';

interface LogEntry {
  id: string;
  type: 'info' | 'error' | 'success' | 'warning' | 'result';
  message: string;
  timestamp: number;
  data?: any;
  copyable?: boolean;
}

interface McpProps {
  mcpServerUrl: string | null;
  mcpUIUrl: string | null;
}

type MCPType = 'Remote MCP' | 'Artifact MCP';

export function Mcp({ mcpServerUrl, mcpUIUrl }: McpProps) {
  const navigate = useNavigate();
  const serverUrlId = useId();
  const mcpTypeId = useId();
  const [url, setUrl] = useState('');
  const [mcpType, setMcpType] = useState<MCPType>('Remote MCP');
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [client, setClient] = useState<NuwaMCPClient | null>(null);
  const [tools, setTools] = useState<Record<string, any>>({});
  const [toolParams, setToolParams] = useState<Record<string, any>>({});
  const [toolSearch, setToolSearch] = useState<string>('');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isCallingTool, setIsCallingTool] = useState(false);
  const [showUIPreview, setShowUIPreview] = useState(false);
  const [penpalConnected, setPenpalConnected] = useState(false);
  // Hold the latest tool execution result for quick inspection
  const [lastToolResult, setLastToolResult] = useState<{
    tool: string;
    result: any;
    timestamp: number;
  } | null>(null);

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
    if (mcpServerUrl) {
      setMcpType('Remote MCP');
      setUrl(mcpServerUrl);
    }
    if (mcpUIUrl) {
      setMcpType('Artifact MCP');
      setUrl(mcpUIUrl);
    }
  }, [mcpServerUrl, mcpUIUrl]);

  const handleConnect = useCallback(async () => {
    if (connecting) return;

    setConnecting(true);
    try {
      pushLog({
        type: 'info',
        message: `Connecting to ${url} with Streamable HTTP transport`,
      });

      // Only handle Remote MCP connections in this function
      if (mcpType !== 'Remote MCP') {
        throw new Error(
          'handleConnect should only be used for Remote MCP connections',
        );
      }

      let newClient: any;
      if (mcpType === 'Remote MCP') {
        newClient = await createPaymentMcpClient(url);
      } else {
        newClient = await createNuwaMCPClient(url, 'postMessage');
      }
      setClient(newClient);

      pushLog({
        type: 'success',
        message: 'Successfully connected to Remote MCP server',
      });

      await handleToolsDiscovery(newClient);

      toast.success(`Successfully connected to ${url}`);
      setConnected(true);
    } catch (err) {
      pushLog({
        type: 'error',
        message: `Connection failed: ${String(err)}`,
      });

      toast.error(String(err));

      await closeNuwaMCPClient(url);
    } finally {
      setConnecting(false);
    }
  }, [connecting, url, pushLog, mcpType]);

  const handleToolsDiscovery = useCallback(
    async (mcpClient: NuwaMCPClient) => {
      try {
        // Fetch server capabilities
        const toolsList = await mcpClient.tools();
        setTools(toolsList);
        pushLog({
          type: 'info',
          message: `Discovered ${Object.keys(toolsList).length} tools`,
          data: { tools: Object.keys(toolsList) },
        });

        // Initialize tool parameters
        const initialParams: Record<string, any> = {};
        Object.entries(toolsList).forEach(([toolName, tool]) => {
          initialParams[toolName] = {};
        });

        setToolParams(initialParams);
      } catch (err) {
        pushLog({
          type: 'error',
          message: `Failed to discover tools: ${String(err)}`,
        });
        throw err;
      }
    },
    [pushLog],
  );

  const handlePenpalConnected = useCallback(() => {
    setPenpalConnected(true);
    pushLog({
      type: 'success',
      message: '🔗 Penpal connection established',
    });
  }, [pushLog]);

  const handleMCPConnected = useCallback(
    async (tools: Record<string, any>) => {
      pushLog({
        type: 'success',
        message: '🔌 MCP connection established via Artifact MCP',
      });

      setTools(tools);
      pushLog({
        type: 'info',
        message: `Discovered ${Object.keys(tools).length} tools`,
        data: { tools: Object.keys(tools) },
      });

      // Initialize tool parameters
      const initialParams: Record<string, any> = {};
      Object.entries(tools).forEach(([toolName, tool]) => {
        initialParams[toolName] = {};
      });

      setToolParams(initialParams);
      toast.success(`Successfully connected to ${url}`);
      setConnected(true);
    },
    [pushLog, url],
  );

  const handleMCPConnectionError = useCallback(
    (error: Error) => {
      pushLog({
        type: 'error',
        message: `🔌 MCP connection failed: ${error.message}`,
      });
      toast.error(`MCP connection failed: ${error.message}`);
      setConnected(false);
      setClient(null);
      setShowUIPreview(false);
    },
    [pushLog],
  );

  const handlePenpalConnectionError = useCallback(
    (error: Error) => {
      pushLog({
        type: 'error',
        message: `🔗 Penpal connection failed: ${error.message}`,
      });
      toast.error(`Penpal connection failed: ${error.message}`);
      setPenpalConnected(false);
    },
    [pushLog],
  );

  // Unified callback handlers via logging
  const handleSendPrompt = useCallback(
    (prompt: string) => {
      pushLog({
        type: 'info',
        message: `📝 Prompt sent: ${prompt.substring(0, 100)}${prompt.length > 100 ? '...' : ''}`,
        data: { prompt },
        copyable: true,
      });
    },
    [pushLog],
  );

  const handleAddSelection = useCallback(
    (label: string, message: string) => {
      pushLog({
        type: 'info',
        message: `📌 Selection added: ${label} - ${message.substring(0, 50)}${message.length > 50 ? '...' : ''}`,
        data: { label, message },
        copyable: true,
      });
    },
    [pushLog],
  );

  const handleSaveState = useCallback(
    (state: any) => {
      pushLog({
        type: 'info',
        message: `💾 State saved`,
        data: { state },
        copyable: true,
      });
    },
    [pushLog],
  );

  const handleGetState = useCallback(() => {
    pushLog({
      type: 'info',
      message: `🔄 State requested`,
    });
    return null; // Return whatever state is needed
  }, [pushLog]);

  const handleDisconnect = async () => {
    try {
      // Close MCP client if it exists
      if (client) {
        await client.close();
        setClient(null);
      }
      setConnected(false);
      setTools({});

      // Always reset UI state for Artifact MCP mode
      setPenpalConnected(false);
      setShowUIPreview(false);

      // Clear logs
      setLogs([]);
      // Clear last tool result
      setLastToolResult(null);

      pushLog({
        type: 'info',
        message: client
          ? 'Disconnected from Remote MCP server'
          : 'Closed Artifact MCP preview',
      });

      toast.success(
        client
          ? 'Successfully disconnected from Remote MCP server'
          : 'Artifact MCP preview closed',
      );

      // Wait for renderer to fully unmount
      await new Promise((resolve) => setTimeout(resolve, 500));

      pushLog({
        type: 'info',
        message: '🧹 Renderer cleanup completed',
      });
    } catch (err) {
      pushLog({
        type: 'error',
        message: `Disconnect error: ${String(err)}`,
      });
    }
  };

  const callTool = async (toolName: string) => {
    try {
      setIsCallingTool(true);
      pushLog({
        type: 'info',
        message: `🔧 Calling tool: ${toolName}`,
      });

      // Get parameters from RJSF form data and clean them
      const rawArgs = toolParams[toolName] || {};

      // Filter out empty/undefined values
      const args = Object.fromEntries(
        Object.entries(rawArgs).filter(
          ([_, value]) => value !== '' && value !== null && value !== undefined,
        ),
      );

      pushLog({
        type: 'info',
        message: `📤 Calling with arguments: ${JSON.stringify(args, null, 2)}`,
        data: { arguments: args },
        copyable: true,
      });

      const result = await tools[toolName].execute(args);

      pushLog({
        type: 'result',
        message: JSON.stringify(result, null, 2),
        data: { result },
        copyable: true,
      });

      // Save the last tool result for dedicated display panel
      setLastToolResult({ tool: toolName, result, timestamp: Date.now() });

      pushLog({
        type: 'success',
        message: `✅ Tool ${toolName} executed successfully`,
      });
    } catch (error) {
      const errorMessage = `❌ Tool call failed: ${error instanceof Error ? error.message : String(error)}`;
      pushLog({
        type: 'error',
        message: errorMessage,
        data: { error: error instanceof Error ? error.stack : error },
        copyable: true,
      });
    } finally {
      setIsCallingTool(false);
    }
  };

  const updateToolParams = (toolName: string, formData: any) => {
    setToolParams((prev) => ({
      ...prev,
      [toolName]: formData,
    }));
  };

  const copyLogEntry = async (logMessage: string) => {
    try {
      await navigator.clipboard.writeText(logMessage);
      toast.success('Log entry copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy log entry to clipboard');
    }
  };

  // Filter tools based on search
  const filteredTools = Object.entries(tools).filter(
    ([toolName, tool]) =>
      toolName.toLowerCase().includes(toolSearch.toLowerCase()) ||
      tool.description?.toLowerCase().includes(toolSearch.toLowerCase()),
  );

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

  const copyLastResult = async () => {
    if (!lastToolResult) return;
    try {
      const text = JSON.stringify(lastToolResult.result, null, 2);
      await navigator.clipboard.writeText(text);
      toast.success('Tool result copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy tool result to clipboard');
    }
  };

  const clearLastResult = () => setLastToolResult(null);

  return (
    <div
      className={`flex gap-6 ${
        // In Artifact MCP mode, lock the layout to the viewport height so only the left pane scrolls
        mcpType === 'Artifact MCP' ? 'h-screen' : 'max-w-3xl mx-auto'
      }`}
    >
      <div
        className={`flex-1 space-y-6 p-8 ${
          // Make the left pane the only scroll container in Artifact MCP mode
          mcpType === 'Artifact MCP' ? 'overflow-y-auto min-h-0 pr-2' : ''
        }`}
      >
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
            onClick={() => navigate('/cap-studio')}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Button>
        </div>

        {/* Connection Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Plug className="h-5 w-5 mr-2" />
              MCP Connection
            </CardTitle>
            <CardDescription className="text-sm">
              Connect to an MCP server to access tools and resources. Only
              Streamable HTTP transport is supported.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Connection Form */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor={mcpTypeId}
                  className="text-sm font-medium text-foreground"
                >
                  MCP Type
                </label>
                <Select
                  value={mcpType}
                  onValueChange={(value) => setMcpType(value as MCPType)}
                  disabled={connecting || connected}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select MCP Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Remote MCP">Remote MCP</SelectItem>
                    <SelectItem value="Artifact MCP">Artifact MCP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label
                  htmlFor={serverUrlId}
                  className="text-sm font-medium text-foreground"
                >
                  URL
                </label>
                <Input
                  id={serverUrlId}
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="http://example.com/mcp"
                  disabled={
                    connecting ||
                    connected ||
                    (mcpType === 'Artifact MCP' && showUIPreview)
                  }
                  className="h-10"
                />
              </div>
            </div>

            {/* Connection Status */}
            {(connected || connecting || penpalConnected) && (
              <div className="space-y-3">
                {connected && (
                  <div className="flex items-center space-x-3 text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 px-4 py-3 rounded-lg">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <div className="flex-1">
                      <span className="font-medium">
                        Connected to {url} via MCP
                      </span>
                      <div className="text-xs text-green-600 dark:text-green-500 mt-1">
                        {Object.keys(tools).length} tools available
                      </div>
                    </div>
                    <Plug className="h-4 w-4" />
                  </div>
                )}

                {penpalConnected && mcpType === 'Artifact MCP' && (
                  <div className="flex items-center space-x-3 text-sm text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 px-4 py-3 rounded-lg">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                    <span className="font-medium">
                      🔗 Penpal connection established
                    </span>
                  </div>
                )}

                {connecting && (
                  <div className="flex items-center space-x-3 text-sm text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 px-4 py-3 rounded-lg">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span className="font-medium">Connecting to {url}...</span>
                  </div>
                )}
              </div>
            )}

            {/* Connection Actions */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center space-x-2">
                {/* Launch UI Button - only show for Artifact MCP type and when not connected */}
                {mcpType === 'Artifact MCP' && !showUIPreview && (
                  <Button
                    onClick={() => {
                      setShowUIPreview(true);
                    }}
                    variant="outline"
                    size="default"
                    className="min-w-32"
                    disabled={!url.trim()}
                  >
                    Launch UI
                  </Button>
                )}

                {/* Connect/Disconnect buttons - only show for Remote MCP type */}
                {mcpType === 'Remote MCP' &&
                  (connected ? (
                    <Button
                      onClick={handleDisconnect}
                      variant="destructive"
                      size="default"
                      className="min-w-32"
                    >
                      <Unplug className="h-4 w-4 mr-2" />
                      Disconnect
                    </Button>
                  ) : (
                    <Button
                      onClick={handleConnect}
                      disabled={connecting || !url.trim()}
                      size="default"
                      className="min-w-32"
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
                  ))}

                {/* Disconnect button for Artifact MCP when connected */}
                {mcpType === 'Artifact MCP' && (connected || showUIPreview) && (
                  <Button
                    onClick={handleDisconnect}
                    variant="destructive"
                    size="default"
                    className="min-w-32"
                  >
                    <Unplug className="h-4 w-4 mr-2" />
                    Disconnect
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tools */}
        {connected && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>
                    Available Tools ({Object.keys(tools).length})
                  </CardTitle>
                  <CardDescription>
                    {filteredTools.length < Object.keys(tools).length
                      ? `Showing ${filteredTools.length} of ${Object.keys(tools).length} tools`
                      : Object.keys(tools).length === 0
                        ? 'No tools available'
                        : 'All tools shown'}
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search tools..."
                      value={toolSearch}
                      onChange={(e) => setToolSearch(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {filteredTools.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    {Object.keys(tools).length === 0
                      ? 'No tools available'
                      : 'No tools match your search'}
                  </p>
                ) : (
                  filteredTools.map(([toolName, tool]) => {
                    // Extract schema from nested structure - handle both old and new formats
                    let toolSchema = {};
                    let formSchema = {};
                    
                    // Try to get the actual schema object
                    const rawSchema = tool.inputSchema || tool.parameters || {};
                    
                    // Handle nested jsonSchema structure (new format from McpToolConverter)
                    if (rawSchema.jsonSchema) {
                      toolSchema = rawSchema.jsonSchema.properties || {};
                      formSchema = rawSchema.jsonSchema;
                    } else {
                      // Handle direct schema (old format)
                      toolSchema = rawSchema.properties || {};
                      formSchema = rawSchema;
                    }

                    const hasParams = Object.keys(toolSchema).length > 0;

                    return (
                      <Card key={toolName} className="border-2">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-base">
                                {toolName}
                              </CardTitle>
                              <CardDescription className="text-sm">
                                {tool.description || 'No description'}
                              </CardDescription>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => callTool(toolName)}
                              disabled={isCallingTool}
                            >
                              Call
                            </Button>
                          </div>
                        </CardHeader>
                        {hasParams && (
                          <CardContent className="pt-0">
                            <div className="space-y-3">
                              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                Parameters
                              </div>
                              <Form
                                schema={formSchema}
                                validator={validator}
                                formData={toolParams[toolName] || {}}
                                onChange={(e) =>
                                  updateToolParams(toolName, e.formData)
                                }
                                uiSchema={{
                                  ...Object.keys(toolSchema).reduce(
                                    (acc, paramName) => {
                                      const paramDef = (toolSchema as any)[paramName];
                                      acc[paramName] = {
                                        'ui:title': `${paramName} ${paramDef?.type ? `(${paramDef.type})` : ''}`,
                                        'ui:placeholder':
                                          paramDef?.description ||
                                          `Enter ${paramName}`,
                                      };
                                      return acc;
                                    },
                                    {} as Record<string, any>,
                                  ),
                                  'ui:submitButtonOptions': {
                                    norender: true,
                                  },
                                }}
                              />
                            </div>
                          </CardContent>
                        )}
                      </Card>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tool Execution Result */}
        {connected && lastToolResult && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center">
                    <Terminal className="h-4 w-4 mr-2" />
                    Tool Result
                  </CardTitle>
                  <CardDescription>
                    Last execution: {lastToolResult.tool} ·{' '}
                    {new Date(lastToolResult.timestamp).toLocaleTimeString()}
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm" onClick={copyLastResult}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={clearLastResult}>
                    <BrushCleaning className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Use a simple div so both axes can scroll without touching shared ScrollArea */}
              <div className="h-64 w-full rounded-md border bg-muted/30 p-4 overflow-auto">
                <pre className="text-xs font-mono whitespace-pre leading-snug">
                  {JSON.stringify(lastToolResult.result, null, 2)}
                </pre>
              </div>
            </CardContent>
          </Card>
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
                        case 'result':
                          return 'text-purple-600';
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
                        case 'result':
                          return '📋';
                        default:
                          return '•';
                      }
                    };

                    return (
                      <div
                        key={log.id}
                        className="flex items-start space-x-2 group"
                      >
                        <span className="text-muted-foreground text-xs mt-0.5 w-20 flex-shrink-0">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                        <span className="mt-0.5">{getLogIcon(log.type)}</span>
                        <div className="flex-1 min-w-0 flex items-start justify-between gap-2">
                          {/* Wrap long logs automatically across lines */}
                          <div className="flex-1 min-w-0">
                            <span
                              className={`${getLogColor(log.type)} ${
                                log.type === 'result' ? 'font-mono text-xs' : ''
                              } whitespace-pre-wrap break-words leading-snug`}
                            >
                              {log.message}
                            </span>
                          </div>
                          {log.copyable && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 ml-2 flex-shrink-0"
                              onClick={() => copyLogEntry(log.message)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* UI Preview - Right Side Panel */}
      {mcpType === 'Artifact MCP' && (
        <div className="w-1/2 h-screen sticky top-0 self-start">
          <Card className="h-full border-none shadow-none">
            <CardHeader>
              <CardTitle className="sr-only">UI Preview</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 w-full bg-gradient-to-br from-muted/20 to-background border border-border rounded-xl shadow-xl overflow-hidden p-0">
              {url && showUIPreview ? (
                <CapUIRenderer
                  srcUrl={url}
                  title="Artifact MCP Preview"
                  artifact={true}
                  onPenpalConnected={handlePenpalConnected}
                  onMCPConnected={handleMCPConnected}
                  onMCPConnectionError={handleMCPConnectionError}
                  onPenpalConnectionError={handlePenpalConnectionError}
                  onSendPrompt={handleSendPrompt}
                  onAddSelection={handleAddSelection}
                  onSaveState={handleSaveState}
                  onGetState={handleGetState}
                />
              ) : (
                <div className="text-muted-foreground text-center py-8 space-y-2">
                  {!url ? (
                    <p>Enter a URL to preview the Artifact MCP</p>
                  ) : (
                    <>
                      <p>Click "Launch UI" to preview the interface</p>
                      <p className="text-xs">
                        The UI will automatically connect when loaded
                      </p>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
