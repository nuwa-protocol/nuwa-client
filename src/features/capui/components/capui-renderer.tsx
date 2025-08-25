import { connect, debug, WindowMessenger } from 'penpal';
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
    onUIPrompt?: (prompt: string) => void;
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
    onUIPrompt,
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

    const sendPrompt = useCallback(
        (prompt: string) => {
            if (onUIPrompt) {
                onUIPrompt(prompt);
            }
        },
        [onUIPrompt],
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
                    sendPrompt,
                },
                timeout: connectionTimeout,
                log: debug('penpal parent'),
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
    }, []);

    const sandbox = 'allow-scripts';

    if (!srcUrl) {
        return (
            <p className="text-orange-500">No URL provided for HTML resource.</p>
        );
    }

    return (
        <div className="relative">
            {isLoading && (
                <Skeleton className="w-full rounded-3xl" style={{ height }} />
            )}
            <iframe
                src={srcUrl}
                allow="accelerometer 'none'; 
         ambient-light-sensor 'none'; 
         autoplay 'none'; 
         battery 'none'; 
         camera 'none'; 
         display-capture 'none'; 
         document-domain 'none'; 
         encrypted-media 'none'; 
         fullscreen 'none'; 
         gamepad 'none'; 
         geolocation 'none'; 
         gyroscope 'none'; 
         layout-animations 'none'; 
         legacy-image-formats 'none'; 
         magnetometer 'none'; 
         microphone 'none'; 
         midi 'none'; 
         oversized-images 'none'; 
         payment 'none'; 
         picture-in-picture 'none'; 
         publickey-credentials-get 'none'; 
         speaker-selection 'none'; 
         sync-xhr 'none'; 
         unoptimized-images 'none'; 
         unsized-media 'none'; 
         usb 'none'; 
         screen-wake-lock 'none'; 
         web-share 'none'; 
         xr-spatial-tracking 'none';"
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
