import { Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Toaster } from 'sonner';
import { AuthGuard } from '@/features/auth/components';
import { useWalletBalanceManager } from '@/features/wallet/hooks/use-wallet-balance-manager';
import { useRehydration } from '@/shared/hooks';
import { useAutoLoadingDetection } from '@/shared/hooks/use-auto-loading-detection';
import { MobileWarning } from '../shared/components/mobile-warning';
import { ThemeProvider } from '../shared/components/theme-provider';
import { StructuredData, generateWebSiteSchema, generateOrganizationSchema } from '../shared/components/structured-data';

export default function RootLayout() {
  // Initialize wallet balance manager
  useWalletBalanceManager();

  // Check if the app is loaded, remove the HTML loading
  useAutoLoadingDetection();

  // Check if the app is rehydrated
  const isRehydrated = useRehydration();
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  if (!isRehydrated || isMobile === null) return null;

  return (
    <ThemeProvider>
      {isMobile ? (
        // Render only the blocking page on mobile
        <>
        <MobileWarning />
        <StructuredData data={generateWebSiteSchema()} id="website-schema" />
        <StructuredData data={generateOrganizationSchema()} id="organization-schema" />
        </>
      ) : (
        <AuthGuard>
          <Toaster position="top-center" expand={true} richColors />
          <Outlet />
        </AuthGuard>
      )}
    </ThemeProvider>
  );
}
