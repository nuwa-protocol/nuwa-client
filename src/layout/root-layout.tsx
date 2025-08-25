import { Outlet } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthGuard } from '@/features/auth/components';
import { MobileWarning } from '../shared/components/mobile-warning';
import { ThemeProvider } from '../shared/components/theme-provider';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthGuard>
        <Toaster position="top-center" expand={true} richColors />
        <MobileWarning />
        <Outlet />
      </AuthGuard>
    </ThemeProvider>
  );
}
