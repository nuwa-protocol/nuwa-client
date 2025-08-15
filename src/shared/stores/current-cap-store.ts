import { create } from 'zustand';
import { defaultCap } from '@/shared/constants/cap';
import { GlobalMCPManager } from '@/shared/services/global-mcp-manager';
import type { Cap } from '@/shared/types';

interface CurrentCapState {
  currentCap: Cap;
  isCurrentCapMCPInitialized: boolean;
  isCurrentCapMCPError: boolean;
  errorMessage: string | null;
  setCurrentCap: (cap: Cap) => void;
}

export const CurrentCapStore = create<CurrentCapState>()((set) => ({
  currentCap: defaultCap,
  isCurrentCapMCPInitialized: true,
  isCurrentCapMCPError: false,
  errorMessage: null,

  setCurrentCap: (cap: Cap) => {
    set({
      currentCap: cap,
      isCurrentCapMCPInitialized: false,
      isCurrentCapMCPError: false,
      errorMessage: null,
    });

    // Initialize MCP for the new cap or cleanup if cap has no MCP servers
    const mcpManager = GlobalMCPManager.getInstance();
    const mcpServers = cap.core.mcpServers || {};
    const hasMCPServers = Object.keys(mcpServers).length > 0;

    if (hasMCPServers) {
      mcpManager
        .initializeForCap(cap)
        .then(() => {
          console.log('Cap MCP Initialized Successfully');
        })
        .catch((error) => {
          const errorMessage =
            error instanceof Error
              ? error.message
              : 'MCP Server Initialization Failed, Please Check Configuration or Network Connection';

          set({
            isCurrentCapMCPError: true,
            errorMessage: errorMessage,
          });
          console.error(
            'Failed to initialize MCP for cap:@',
            cap.idName,
            error,
          );
        })
        .finally(() => {
          set({ isCurrentCapMCPInitialized: true });
        });
    } else {
      set({ isCurrentCapMCPInitialized: true });
      mcpManager
        .cleanup()
        .then(() => {
          console.log('Previous MCP servers cleaned up successfully');
        })
        .catch((error) => {
          console.warn('Failed to cleanup previous MCP servers:', error);
        });
    }
  },
}));
