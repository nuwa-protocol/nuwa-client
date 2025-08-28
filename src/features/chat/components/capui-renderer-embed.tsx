import { AlertCircle } from 'lucide-react';
import { connect, WindowMessenger } from 'penpal';
import { useCallback, useRef, useState } from 'react';
import { Skeleton } from '@/shared/components';

const ErrorDisplay = () => {
    return (
        <div className="flex items-center justify-center">
            <span className="text-muted-foreground text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Failed to load Cap UI
            </span>
        </div>
    );
};

const isValidUrl = (url: string): boolean => {
    try {
        const parsedUrl = new URL(url);
        return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
    } catch {
        return false;
    }
};

export type CapUIRendererProps = {
    srcUrl: string;
    title?: string;
};

export const CapUIRenderer = ({
    srcUrl,
    title,
}: CapUIRendererProps) => {
    const CONNECTION_TIMEOUT = 3000;

    const iframeRef = useRef<HTMLIFrameElement | null>(null);
    const [error, setError] = useState<Error | null>(null);
    const [height, setHeight] = useState<number>(100); // Default height
    const [isConnected, setIsConnected] = useState(false);

    const sendMessage = (message: string) => {
        console.log(`Message received from UI "${title}": ${message}`);
    };

    const sendPrompt = (prompt: string) => {
        // TODO: Handle receiving prompt from Cap UI
        console.log('Prompt received from Cap UI', prompt);
    };

    const connectToPenpal = useCallback(async () => {
        try {
            if (!iframeRef.current?.contentWindow) {
                throw new Error('Iframe content not accessible');
            }

            const messenger = new WindowMessenger({
                remoteWindow: iframeRef.current.contentWindow,
                allowedOrigins: ['*'],
            });

            await connect({
                messenger,
                methods: {
                    sendMessage,
                    sendPrompt,
                    setUIHeight: (newHeight: number) => {
                        setHeight(newHeight);
                    },
                },
                timeout: CONNECTION_TIMEOUT,
            }).promise;

            // Wait for connection to be established
            setIsConnected(true);

            console.log('Successfully connected to Cap UI', title ?? srcUrl);
        } catch (error) {
            const err =
                error instanceof Error
                    ? error
                    : new Error('Failed to establish connection with Cap UI');
            console.error('Cap UI Connection Error:', {
                error: err.message,
                url: srcUrl,
            });
            setError(err);
        }
    }, [title, srcUrl]);

    const sandbox = 'allow-scripts';

    if (!srcUrl) {
        const err = new Error('No URL provided for HTML resource');
        return <ErrorDisplay />;
    }

    if (!isValidUrl(srcUrl)) {
        const err = new Error(`Invalid URL format: ${srcUrl}`);
        return <ErrorDisplay />;
    }

    if (error) {
        return <ErrorDisplay />;
    }

    return (
        <div className="relative">
            {!isConnected && (
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
                style={
                    !isConnected || error
                        ? {
                            width: 0,
                            height: 0,
                            position: 'absolute',
                            border: 0,
                        }
                        : {
                            width: '100%',
                            height,
                        }
                }
                sandbox={sandbox}
                title={title ?? 'Nuwa Cap UI'}
                ref={iframeRef}
                onLoad={connectToPenpal}
            />
        </div>
    );
};

CapUIRenderer.displayName = 'CapUIRenderer';
