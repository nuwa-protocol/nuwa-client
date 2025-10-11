import { NUWA_CLIENT_TIMEOUT, type StreamAIRequest } from '@nuwa-ai/ui-kit';
import { connect, WindowMessenger } from 'penpal';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { CapUIRendererProps } from '@/shared/components/cap-ui-renderer';
import { useTheme } from '@/shared/components/theme-provider';
import {
  closeUnifiedMcpClient,
  createUnifiedMcpClient,
} from '@/shared/services/unified-mcp-client';
import { type URLValidationResult, validateURL } from '@/shared/utils';

export type ChildMethods = {
  pushStreamChunk(
    streamId: string,
    chunk: { type: 'content' | 'error'; content?: any; error?: any },
  ): void;
  completeStream(streamId: string): void;
  errorStream(streamId: string, error: any): void;
  updateTheme(theme: 'light' | 'dark'): void;
};

export const useCapUIRender = ({
  srcUrl,
  onSendPrompt,
  onAddSelection,
  onSaveState,
  onGetState,
  onStreamRequest,
  onAbortStream,
  title,
  onPenpalConnected,
  onMCPConnected,
  onPenpalConnectionError,
  onMCPConnectionError,
}: CapUIRendererProps) => {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // Use refs to always have the latest callbacks
  const onSendPromptRef = useRef(onSendPrompt);
  const onAddSelectionRef = useRef(onAddSelection);
  const onSaveStateRef = useRef(onSaveState);
  const onGetStateRef = useRef(onGetState);
  const onStreamRequestRef = useRef(onStreamRequest);
  const onAbortStreamRef = useRef(onAbortStream);
  // Update refs when props change
  useEffect(() => {
    onSendPromptRef.current = onSendPrompt;
    onAddSelectionRef.current = onAddSelection;
    onSaveStateRef.current = onSaveState;
    onGetStateRef.current = onGetState;
    onStreamRequestRef.current = onStreamRequest;
    onAbortStreamRef.current = onAbortStream;
  }, [
    onSendPrompt,
    onAddSelection,
    onSaveState,
    onGetState,
    onStreamRequest,
    onAbortStream,
  ]);

  // Keep a ref to child's exposed methods
  const childMethodsRef = useRef<ChildMethods | null>(null);
  // Keep a ref to the current penpal connection so we can explicitly destroy it
  const connectionRef = useRef<ReturnType<typeof connect<ChildMethods>> | null>(null);

  const [height, setHeight] = useState<number>(100); // Default height
  const [validationResult, setValidationResult] =
    useState<URLValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const validateURLBeforeRender = useCallback(async () => {
    if (!srcUrl) {
      setValidationResult({
        isValid: false,
        error: 'No URL provided for HTML resource',
        canBeEmbedded: false,
      });
      return;
    }

    setIsValidating(true);
    setValidationResult(null);

    try {
      const result = await validateURL(srcUrl, {
        timeout: 10000,
      });

      setValidationResult(result);

      if (!result.isValid) {
        console.error(`URL validation failed for ${srcUrl}:`, result.error);
      } else if (!result.canBeEmbedded && result.error) {
        console.error(`URL embedding may fail for ${srcUrl}:`, result.error);
      }
    } catch (error) {
      const validationError = {
        isValid: false,
        error: `URL validation error: ${error instanceof Error ? error.message : String(error)}`,
        canBeEmbedded: false,
      };
      setValidationResult(validationError);
      console.error(`URL validation error for ${srcUrl}:`, error);
    } finally {
      setIsValidating(false);
    }
  }, [srcUrl]);

  useEffect(() => {
    validateURLBeforeRender();
  }, [validateURLBeforeRender]);

  const nuwaClientMethods = {
    sendPrompt: (prompt: string) => {
      onSendPromptRef.current?.(prompt);
    },

    addSelection: (label: string, message: string) => {
      onAddSelectionRef.current?.(label, message);
    },

    saveState: (state: any) => {
      onSaveStateRef.current?.(state);
    },

    getState: () => {
      return onGetStateRef.current?.();
    },

    // Streaming entrypoints called by child
    handleStreamRequest: async (request: StreamAIRequest, streamId: string) => {
      if (!childMethodsRef.current) {
        console.error('Child stream method not found');
        return;
      }
      onStreamRequestRef.current?.(request, streamId, childMethodsRef.current);
    },

    abortStream: async (streamId: string) => {
      onAbortStreamRef.current?.(streamId);
    },
  };

  // Current theme for initial sync on connect and subsequent updates
  const { resolvedTheme } = useTheme();

  const connectToPenpal = useCallback(async () => {
    try {
      if (!iframeRef.current?.contentWindow) {
        throw new Error('Iframe content not accessible');
      }

      const messenger = new WindowMessenger({
        remoteWindow: iframeRef.current.contentWindow,
        allowedOrigins: ['*'],
      });

      // Tear down any previous connection before creating a new one
      try {
        connectionRef.current?.destroy?.();
      } catch {}
      connectionRef.current = null;
      childMethodsRef.current = null;

      const connection = connect<ChildMethods>({
        messenger,
        methods: {
          ...nuwaClientMethods,
          setHeight,
        },
        timeout: NUWA_CLIENT_TIMEOUT,
      });
      connectionRef.current = connection;
      const child = await connection.promise;
      childMethodsRef.current = child;
      // Push the current theme to the child immediately after connect
      try {
        const themeToSend = resolvedTheme as 'light' | 'dark';
        child.updateTheme(themeToSend);
      } catch (e) {
        console.warn('Penpal updateTheme on connect failed:', e);
      }
      onPenpalConnected?.();
    } catch (error) {
      const err =
        error instanceof Error
          ? error
          : new Error(`Failed to connect to ${title ?? srcUrl} over Penpal`);
      onPenpalConnectionError?.(err);
    }
  }, [title, srcUrl, onPenpalConnected, onPenpalConnectionError, resolvedTheme]);

  const connectToMCP = useCallback(async () => {
    try {
      if (!iframeRef.current?.contentWindow) {
        throw new Error('Iframe not ready');
      }

      const mcpClient = await createUnifiedMcpClient(srcUrl, 'postMessage', {
        targetWindow: iframeRef.current?.contentWindow,
      });

      const tools = await mcpClient.tools();

      onMCPConnected?.(tools);
    } catch (error) {
      const err =
        error instanceof Error
          ? error
          : new Error(`Failed to connect to ${title ?? srcUrl} over MCP`);
      onMCPConnectionError?.(err);
      await closeUnifiedMcpClient(srcUrl);
    }
  }, [title, srcUrl]);

  // Update the theme when the theme changes
  useEffect(() => {
    try {
      childMethodsRef.current?.updateTheme(resolvedTheme);
    } catch (e) {
      // Swallow penpal destroyed-connection errors during theme updates
      // This can happen if the iframe reloaded/unmounted between renders
      console.warn('Penpal updateTheme failed; connection likely destroyed');
    }
    // Only depend on the theme to avoid firing during connection churn
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedTheme]);

  // Cleanup on unmount: destroy the connection and clear MCP client
  useEffect(() => {
    return () => {
      try {
        connectionRef.current?.destroy?.();
      } catch {}
      connectionRef.current = null;
      childMethodsRef.current = null;
      // Best-effort close of MCP client for this srcUrl
      closeUnifiedMcpClient(srcUrl).catch(() => {});
    };
  }, [srcUrl]);

  return {
    iframeRef,
    connectToPenpal,
    connectToMCP,
    height,
    validationResult,
    isValidating,
    childMethods: childMethodsRef.current,
  };
};
