import { connect, WindowMessenger } from 'penpal';
import type React from 'react';
import { useCallback, useRef } from 'react';

export type IFrameRendererProps = {
    srcUrl: string;
    style?: React.CSSProperties;
    onError?: (error: Error) => void;
    onConnected?: (methods: ChildMethods) => void;
    connectionTimeout?: number;
    onUIMessage?: (message: string) => void;
    onUIToolCall?: (tool: string) => void;
    onUIPromptCall?: (prompt: string) => void;
};

export type ChildMethods = {
    sendMessage(msg: string): Promise<string>;
};


export const IFrameRenderer = ({
    srcUrl,
    style,
    onError,
    onConnected,
    connectionTimeout = 15000,
    onUIMessage,
    onUIToolCall,
    onUIPromptCall,
}: IFrameRendererProps) => {
    const iframeRef = useRef<HTMLIFrameElement | null>(null);

    const sendMessage = useCallback((message: string) => {
        if (onUIMessage) {
            onUIMessage(message);
        }
    }, [onUIMessage]);

    const sendToolCall = useCallback((tool: string) => {
        if (onUIToolCall) {
            onUIToolCall(tool);
        }
    }, [onUIToolCall]);

    const sendPromptCall = useCallback((prompt: string) => {
        if (onUIPromptCall) {
            onUIPromptCall(prompt);
        }
    }, [onUIPromptCall]);

    const connectToPenpal = useCallback(async () => {
        try {
            if (!iframeRef.current?.contentWindow) {
                throw new Error('Iframe contentWindow not available');
            }

            const messenger = new WindowMessenger({
                remoteWindow: iframeRef.current.contentWindow,
                allowedOrigins: ['srcUrl'],
            });

            const conn = connect<ChildMethods>({
                messenger,
                methods: {
                    sendMessage,
                    sendToolCall,
                    sendPromptCall,
                },
                timeout: connectionTimeout,
            });

            const childMethods = await conn.promise;

            onConnected?.(childMethods);
        } catch (error) {
            const err =
                error instanceof Error ? error : new Error('Unknown connection error');
            onError?.(err);
        }
    }, [onError, onConnected, connectionTimeout]);

    const sandbox = 'allow-scripts allow-same-origin';

    if (!srcUrl) {
        return (
            <p className="text-orange-500">No URL provided for HTML resource.</p>
        );
    }

    return (
        <iframe
            src={srcUrl}
            sandbox={sandbox}
            style={style}
            title="MCP HTML Resource (URL)"
            ref={iframeRef}
            onLoad={connectToPenpal}
            onError={(e) => onError?.(new Error('Iframe failed to load'))}
        />
    );
};

IFrameRenderer.displayName = 'IFrameRenderer';
