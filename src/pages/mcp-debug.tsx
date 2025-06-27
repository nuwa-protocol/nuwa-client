import McpDebugPanel from '@/features/mcp/components/McpDebugPanel';

export default function McpDebugPage() {
  if (!import.meta.env.DEV) {
    return null; // safeguard: should never be rendered in prod
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">MCP Debug Panel</h1>
      <McpDebugPanel />
    </div>
  );
} 