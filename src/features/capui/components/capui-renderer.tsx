import { connect, WindowMessenger } from 'penpal';
import { useCallback, useRef, useState } from 'react';
import { Skeleton } from '@/shared/components';

export type CapUIRendererProps = {
    srcUrl: string;
    height?: number;
    title: string;
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

export const CapUIRenderer = ({
    srcUrl,
    height = 300,
    title,
    onError,
    onConnected,
    connectionTimeout = 15000,
    onUIMessage,
    onUIToolCall,
    onUIPromptCall,
}: CapUIRendererProps) => {
    const iframeRef = useRef<HTMLIFrameElement | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const sendMessage = useCallback(
        (message: string) => {
            if (onUIMessage) {
                onUIMessage(message);
            }
        },
        [onUIMessage],
    );

    const sendToolCall = useCallback(
        (tool: string) => {
            if (onUIToolCall) {
                onUIToolCall(tool);
            }
        },
        [onUIToolCall],
    );

    const sendPromptCall = useCallback(
        (prompt: string) => {
            if (onUIPromptCall) {
                onUIPromptCall(prompt);
            }
        },
        [onUIPromptCall],
    );

    const connectToPenpal = useCallback(async () => {
        try {
            if (!iframeRef.current?.contentWindow) {
                throw new Error('Iframe contentWindow not available');
            }

            setIsLoading(false);

            const messenger = new WindowMessenger({
                remoteWindow: iframeRef.current.contentWindow,
                allowedOrigins: ['*'],
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
        } finally {
            setIsLoading(false);
        }
    }, [onError, onConnected, connectionTimeout]);

    const sandbox = 'allow-scripts allow-same-origin';

    if (!srcUrl) {
        return (
            <p className="text-orange-500">No URL provided for HTML resource.</p>
        );
    }

    return (
        <div className="relative">
            {isLoading && (
                <Skeleton
                    className="w-full rounded-3xl"
                    style={{ height }}
                />
            )}
            <iframe
                src={srcUrl}
                style={{
                    width: '100%',
                    height,
                    display: isLoading ? 'none' : 'block',
                }}
                sandbox={sandbox}
                title={title}
                ref={iframeRef}
                onLoad={connectToPenpal}
                onError={(e) => onError?.(new Error('Iframe failed to load'))}
            />
        </div>
    );
};

CapUIRenderer.displayName = 'CapUIRenderer';
