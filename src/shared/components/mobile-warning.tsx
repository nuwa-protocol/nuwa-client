import { Smartphone } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';

export function MobileWarning() {
  const [isMobile, setIsMobile] = useState(false);
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);

      // Check if user has already dismissed the warning in this session
      const hasSeenWarning = sessionStorage.getItem('mobile-warning-dismissed') === 'true';
      
      if (mobile && !hasSeenWarning && !showDialog) {
        setShowDialog(true);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, [showDialog]);

  const handleContinue = () => {
    sessionStorage.setItem('mobile-warning-dismissed', 'true');
    setShowDialog(false);
  };

  if (!isMobile) return null;

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/20">
            <Smartphone className="h-6 w-6 text-orange-600 dark:text-orange-400" />
          </div>
          <DialogTitle className="text-xl font-semibold">
            Desktop Experience Recommended
          </DialogTitle>
          <DialogDescription className="text-center">
            This application is optimized for desktop use. For the best
            experience, please access it from a desktop or laptop computer.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 mt-4">
          <Button
            onClick={handleContinue}
            className="w-full"
            variant="primary"
          >
            Continue Anyway
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
