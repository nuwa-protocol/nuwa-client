import { ArrowLeft } from 'lucide-react';
import { Button } from '@/shared/components/ui';
import { useCapStoreModal } from './cap-store-modal-context';

export function CapStoreHeader() {
  const { selectedCap, setSelectedCap, activeSection } = useCapStoreModal();
  const onBack = () => {
    setSelectedCap(null);
  };

  return (
    <div className="flex items-center gap-4 p-4 border-b border-muted-foreground/20">
      {selectedCap ? (
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      ) : (
        <h2 className="text-lg font-medium pb-2">{activeSection.label}</h2>
      )}
    </div>
  );
}
