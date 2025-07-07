export interface CapLLMRequirements {
  modelFamily: string[];
  minContextWindow: number;
  specificModelUri?: string;
  requiredFeatures?: string[];
}

export interface CapMetadata {
  did: string; 
  name: string;
  description: string;
  author: {
    did: string;
    name?: string;
    contact?: string;
  };
  artifacts: boolean,
  createdAt: number;
  triggers: Array<{
    type: "regex" | "keyword" | "intent";
    value: string;
  }>;
  memoryScope?: string;
  permissions: {
    require: string[];
  };
  llmRequirements: CapLLMRequirements;
  signature?: string;
};

export interface CapTool {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: {
      type: "object";
      properties: Record<string, any>;
      required?: string[];
    };
  };
};

export interface CapToolBinding {
  type: "mcp_service" | "local_function" | "api_endpoint";
  service_uri?: string;
  mcp_action?: string;
  endpoint_url?: string;
  method?: "GET" | "POST" | "PUT" | "DELETE";
  headers?: Record<string, string>;
};

export interface Cap {
  metadata: CapMetadata;
  schema?: string; 
  prompt?: string; 
  tools?: CapTool[];
  tool_bindings?: Record<string, CapToolBinding>;
};

// Cap interface for remote caps
export interface RemoteCap {
  id: string;
  name: string;
  tag: string;
  description: string;
  downloads: number;
  version: string;
  author?: string;
  createdAt?: number;
  updatedAt?: number;
  dependencies?: string[];
  size?: number;
  cap?: Cap;
}

// Installed Cap interface (minimal data for locally installed caps)
export interface InstalledCap {
  id: string;
  name: string;
  tag: string;
  description: string;
  version: string;
  installDate: number;
  isEnabled?: boolean;
  settings?: Record<string, any>;
  cap?: Cap;
}

// Combined cap data: remote + local state
export interface CapDisplayData {
  remote: RemoteCap;
  local?: InstalledCap;
  isInstalled: boolean;
  isEnabled: boolean;
  hasUpdate: boolean;
  installedVersion?: string;
}
