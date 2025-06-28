import { useState } from 'react';
import { createNuwaMCPClient, NuwaMCPClient } from '@/features/mcp';
import { McpTransportType } from '@/features/mcp';
import Form from '@rjsf/core';
import validator from '@rjsf/validator-ajv8';

interface LogEntry {
  type: 'info' | 'error';
  message: string;
}

// Simple UUID helper compatible with browser & Node
const generateUUID = (): string => {
  if (typeof globalThis !== 'undefined' && (globalThis as any).crypto?.randomUUID) {
    return (globalThis as any).crypto.randomUUID();
  }
  // Fallback: timestamp + random chars
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
};

export default function McpDebugPanel() {
  const [url, setUrl] = useState('http://localhost:8080/mcp');
  const [transport, setTransport] = useState<McpTransportType | ''>('');
  const [connected, setConnected] = useState(false);
  const [tools, setTools] = useState<string[]>([]);
  const [toolsMap, setToolsMap] = useState<Record<string, any>>({});
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [prompts, setPrompts] = useState<string[]>([]);
  const [promptsMap, setPromptsMap] = useState<Record<string, any>>({});
  const [resources, setResources] = useState<string[]>([]);
  const [client, setClient] = useState<NuwaMCPClient | null>(null);

  const pushLog = (entry: LogEntry) => setLogs((prev) => [...prev, entry]);

  const safeStringify = (obj: any): string => {
    try {
      return JSON.stringify(obj, null, 2);
    } catch (_) {
      return String(obj);
    }
  };

  const handleConnect = async () => {
    try {
      pushLog({ type: 'info', message: `Connecting to ${url} ...` });
      const newClient = await createNuwaMCPClient(url, transport === '' ? undefined : (transport as McpTransportType));
      setClient(newClient);
      setConnected(true);
      pushLog({ type: 'info', message: 'Connected.' });

      // Get tools from client
      try {
        const list = await newClient.tools();
        const names = Object.keys(list);
        setTools(names);
        setToolsMap(list);
        pushLog({ type: 'info', message: `Fetched tools: ${names.join(', ')}` });
      } catch (err) {
        pushLog({ type: 'info', message: `No tools available: ${String(err)}` });
      }

      // fetch prompts
      try {
        const ps = await newClient.prompts();
        setPrompts(Object.keys(ps));
        setPromptsMap(ps);
        pushLog({ type: 'info', message: `Fetched prompts: ${Object.keys(ps).join(', ')}` });
      } catch (err) {
        pushLog({ type: 'error', message: `Failed to fetch prompts: ${String(err)}` });
      }

      // fetch resources
      try {
        const rs = await newClient.resources();
        const resourceKeys = Object.keys(rs);
        setResources(resourceKeys);
        pushLog({ type: 'info', message: `Fetched resources: ${resourceKeys.join(', ')}` });
      } catch (err) {
        pushLog({ type: 'error', message: `Failed to fetch resources: ${String(err)}` });
      }
    } catch (err) {
      pushLog({ type: 'error', message: String(err) });
    }
  };

  const handlePing = async () => {
    if (!client) {
      pushLog({ type: 'error', message: 'Not connected' });
      return;
    }

    try {
      // Try ping on raw client if available
      if (client.raw && typeof client.raw.ping === 'function') {
        await client.raw.ping();
        pushLog({ type: 'info', message: 'Ping OK' });
      } else {
        // Fallback: try a simple prompts() call as a health check
        await client.prompts();
        pushLog({ type: 'info', message: 'Health check OK (via prompts call)' });
      }
    } catch (err) {
      pushLog({ type: 'error', message: `Ping failed: ${String(err)}` });
    }
  };

  const handleDisconnect = async () => {
    if (!client) return;
    
    try {
      await client.close();
      setClient(null);
      setConnected(false);
      pushLog({ type: 'info', message: 'Disconnected.' });
    } catch (err) {
      pushLog({ type: 'error', message: `Disconnect error: ${String(err)}` });
    }
  };

  const handleExecute = async (payload: any) => {
    // When called from <Form onSubmit>, payload is {formData, ...}
    // When called manually, payload is args object.
    let args: any;
    if (payload?.preventDefault) {
      payload.preventDefault();
      args = (payload as any).formData ?? {};
    } else if (payload?.formData !== undefined) {
      args = payload.formData;
    } else {
      args = payload ?? {};
    }
    if (!selectedTool || !client) return;
    const tool = toolsMap[selectedTool];
    if (!tool) return;
    try {
      pushLog({ type: 'info', message: `Executing ${selectedTool} with ${safeStringify(args)}` });
      const res = await tool.execute(args, { toolCallId: generateUUID(), messages: [] });
      pushLog({ type: 'info', message: `Result: ${safeStringify(res)}` });
    } catch (err) {
      pushLog({ type: 'error', message: `Execution error: ${String(err)}` });
    }
  };

  const handleExecutePrompt = async (promptName: string) => {
    if (!client) return;
    try {
      pushLog({ type: 'info', message: `Executing prompt ${promptName}` });
      // Use the execute method if available on the prompt
      const prompt = promptsMap[promptName];
      if (prompt && prompt.execute) {
        const result = await prompt.execute({});
        pushLog({ type: 'info', message: `Prompt result: ${safeStringify(result)}` });
      } else {
        // Fallback to direct getPrompt call
        const result = await client.getPrompt(promptName, {});
        pushLog({ type: 'info', message: `Prompt result: ${safeStringify(result)}` });
      }
    } catch (err) {
      pushLog({ type: 'error', message: `Prompt execution error: ${String(err)}` });
    }
  };

  const handleReadResource = async (resourceUri: string) => {
    if (!client) return;
    try {
      pushLog({ type: 'info', message: `Reading resource ${resourceUri}` });
      const result = await client.readResource(resourceUri);
      pushLog({ type: 'info', message: `Resource content: ${safeStringify(result)}` });
    } catch (err) {
      pushLog({ type: 'error', message: `Resource read error: ${String(err)}` });
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2">
        <input
          className="border px-2 py-1 w-full"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="MCP server URL"
        />
        <select
          className="border px-2 py-1"
          value={transport}
          onChange={(e) => setTransport(e.target.value as McpTransportType | '')}
        >
          <option value="">auto</option>
          <option value="httpStream">httpStream</option>
          <option value="sse">sse</option>
        </select>
        {connected ? (
          <button className="bg-red-500 text-white px-3 py-1" onClick={handleDisconnect}>
            Disconnect
          </button>
        ) : (
          <button className="bg-green-600 text-white px-3 py-1" onClick={handleConnect}>
            Connect
          </button>
        )}
        <button className="bg-blue-500 text-white px-3 py-1" onClick={handlePing} disabled={!connected}>
          Ping
        </button>
      </div>

      <div className="flex space-x-4">
        <div className="w-1/4">
          <h2 className="font-semibold mb-1">Tools</h2>
          <ul className="border divide-y text-sm max-h-40 overflow-auto">
            {tools.map((t) => (
              <li
                key={t}
                className={`px-2 py-1 cursor-pointer ${selectedTool === t ? 'bg-blue-100' : ''}`}
                onClick={() => setSelectedTool(t)}
              >
                {t}
              </li>
            ))}
          </ul>
        </div>
        <div className="w-1/4">
          <h2 className="font-semibold mb-1">Prompts</h2>
          <ul className="border divide-y text-sm max-h-40 overflow-auto">
            {prompts.map((p) => (
              <li key={p} className="px-2 py-1 flex justify-between items-center">
                <span>{p}</span>
                <button 
                  className="text-xs bg-blue-500 text-white px-1 rounded"
                  onClick={() => handleExecutePrompt(p)}
                >
                  Execute
                </button>
              </li>
            ))}
          </ul>

          <h2 className="font-semibold mb-1 mt-4">Resources</h2>
          <ul className="border divide-y text-sm max-h-40 overflow-auto">
            {resources.map((r) => (
              <li key={r} className="px-2 py-1 break-words flex justify-between items-center">
                <span className="truncate flex-1">{r}</span>
                <button 
                  className="text-xs bg-blue-500 text-white px-1 rounded ml-1 flex-shrink-0"
                  onClick={() => handleReadResource(r)}
                >
                  Read
                </button>
              </li>
            ))}
          </ul>
        </div>
        {selectedTool && (
          <div className="flex-1 space-y-2">
            <h3 className="font-medium">{selectedTool} parameters</h3>
            {(() => {
              const paramWrapper = toolsMap[selectedTool]?.parameters;
              const schema = paramWrapper?.jsonSchema ?? paramWrapper;
              if (!schema) return null;
              return (
                <Form
                  schema={schema}
                  formData={formData}
                  validator={validator}
                  onChange={(e) => setFormData(e.formData)}
                  onSubmit={handleExecute}
                >
                  <button type="submit" className="bg-indigo-600 text-white px-3 py-1">
                    Execute
                  </button>
                </Form>
              );
            })() || (
              <button className="bg-indigo-600 text-white px-3 py-1" onClick={() => handleExecute({})}>
                Execute (no params)
              </button>
            )}
          </div>
        )}
      </div>

      <div className="border p-2 h-60 overflow-auto bg-gray-100 text-sm">
        {logs.map((log, idx) => (
          <div key={idx} className={log.type === 'error' ? 'text-red-600' : ''}>
            [{log.type}] {log.message}
          </div>
        ))}
      </div>
    </div>
  );
} 