import { connect, WindowMessenger } from 'penpal';
import { useCallback, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Skeleton } from '@/shared/components';

export type CapUIRendererProps = {
    srcUrl: string;
    height: number;
    title?: string;
};

export const CapUIRenderer = ({
    srcUrl,
    height,
    title,
}: CapUIRendererProps) => {
    const CONNECTION_TIMEOUT = 15000;

    const iframeRef = useRef<HTMLIFrameElement | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const sendMessage = (message: string) => {
        toast.success(`Message received from Cap UI: ${message}`);
        console.log('Message received from Cap UI', message);
    };

    const sendPrompt = (prompt: string) => {
        // TODO: Handle receiving prompt from Cap UI
        console.log('Prompt received from Cap UI', prompt);
    };

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

            const conn = connect({
                messenger,
                methods: {
                    sendMessage,
                    sendPrompt,
                },
                timeout: CONNECTION_TIMEOUT,
            });

            console.log('Successfully connected to Cap UI', title ?? srcUrl);
        } catch (error) {
            const err =
                error instanceof Error ? error : new Error('Unknown connection error');
            setError(err);
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

    if (error) {
        console.error('Error loading Cap UI', error);
        return <p className="text-red-500">Error loading Cap UI</p>;
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
                title={title ?? 'Nuwa Cap UI'}
                ref={iframeRef}
                onLoad={connectToPenpal}
                onError={(e) => setError(new Error('UI failed to load'))}
            />
        </div>
    );
};

CapUIRenderer.displayName = 'CapUIRenderer';
