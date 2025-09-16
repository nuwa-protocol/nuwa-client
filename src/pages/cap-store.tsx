import { CapStoreContent } from '@/features/cap-store/components/cap-store-content';
import { CapStoreHeader } from '@/features/cap-store/components/cap-store-header';
import { CapStoreModalProvider } from '@/features/cap-store/components/cap-store-modal-context';
import { CapStoreSidebar } from '@/features/cap-store/components/cap-store-sidebar';
import { useSEO } from '@/shared/hooks/use-seo';

export default function CapStorePage() {
  // SEO for Cap Store page
  useSEO({
    title: 'Cap Store - Discover AI Caps | Nuwa AI',
    description: 'Discover and download AI Caps on Nuwa AI. Browse through hundreds of AI capabilities, tools, and applications powered by crypto.',
    keywords: ['ai caps', 'nuwa ai', 'crypto ai', 'ai store', 'ai marketplace', 'artificial intelligence'],
    url: `${window.location.origin}/cap-store`,
    type: 'website',
  });

  return (
    <CapStoreModalProvider>
      <div className="flex h-screen w-full">
        <CapStoreSidebar />
        <div className="flex flex-1 flex-col">
          <CapStoreHeader />
          <main className="flex-1 overflow-y-auto">
            <CapStoreContent />
          </main>
        </div>
      </div>
    </CapStoreModalProvider>
  );
}
