import { useState } from 'react';
import { toast } from 'sonner';
import {
    CapUIRenderer,
    type ChildMethods,
} from '@/features/capui/components/capui-renderer';
import { Button } from '@/shared/components';

export default function TestPage() {
    const [childMethods, setChildMethods] = useState<ChildMethods | null>(null);
    const [inputValue, setInputValue] = useState('');
    const [messageReceived, setMessageReceived] = useState('');

    const handleConnected = (methods: ChildMethods) => {
        setChildMethods(methods);
    };

    const handleError = (error: Error) => {
        console.error('IFrame Renderer Error:', error);
    };

    const sendMessage = async () => {
        if (!childMethods) return;

        try {
            const response = await childMethods.sendMessage(
                inputValue || 'Hello from parent!',
            );
            toast.success(`Callback: ${response}`);
        } catch (error) {
            console.error('Failed to send message:', error);
        }
    };

    const handleUIMessage = (message: string) => {
        setMessageReceived(message);
    };

    return (
        <div className="h-full flex flex-col mt-6">
            <h1 className="text-2xl font-bold mb-4 ml-4">
                IFrame Renderer Communitcation Test
            </h1>
            <span className="ml-4 text-sm">
                Status: {childMethods ? '🟢 Connected' : '🔴 Disconnected'}
            </span>
            <div className="p-4 mb-10">
                <div className="flex gap-2 mb-4">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Enter message to send"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded"
                    />
                </div>
                <div className="mb-4 text-md">Message Received: {messageReceived}</div>
                <Button
                    type="button"
                    onClick={sendMessage}
                    disabled={!childMethods}
                    variant={'outline'}
                >
                    {childMethods ? 'Send Message to Iframe UI' : 'Connecting...'}
                </Button>
            </div>
            <div className="flex-1">
                <CapUIRenderer
                    srcUrl="https://cap-ui-sooty.vercel.app/test"
                    height={300}
                    title="Test"
                    onError={handleError}
                    onConnected={handleConnected}
                    onUIMessage={handleUIMessage}
                />
            </div>
        </div>
    );
}
