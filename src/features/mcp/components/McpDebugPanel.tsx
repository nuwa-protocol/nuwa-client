import { useState } from 'react';
import { getMcpClient, closeMcpClient, McpTransportType } from '../services/factory';
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
      const client = await getMcpClient(url, transport === '' ? undefined : (transport as McpTransportType));
      setConnected(true);
      pushLog({ type: 'info', message: 'Connected.' });

      const list = await client.tools();
      const names = Object.keys(list);
      setTools(names);
      setToolsMap(list as any);
      pushLog({ type: 'info', message: `Fetched tools: ${names.join(', ')}` });
    } catch (err) {
      pushLog({ type: 'error', message: String(err) });
    }
  };

  const handlePing = async () => {
    try {
      const client = await getMcpClient(url);
      await client.ping?.(); // some clients have ping method
      pushLog({ type: 'info', message: 'Ping OK' });
    } catch (err) {
      pushLog({ type: 'error', message: `Ping failed: ${String(err)}` });
    }
  };

  const handleDisconnect = async () => {
    await closeMcpClient(url);
    setConnected(false);
    pushLog({ type: 'info', message: 'Disconnected.' });
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
    if (!selectedTool) return;
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
          <ul className="border divide-y text-sm">
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