import { Outlet } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthGuard } from '@/features/auth/components';
import { MobileWarning } from '../shared/components/mobile-warning';
import { ThemeProvider } from '../shared/components/theme-provider';
import { StructuredData, generateWebSiteSchema, generateOrganizationSchema } from '../shared/components/structured-data';

export default function RootLayout() {
  return (
    <ThemeProvider>
      {/* Global Structured Data */}
      <StructuredData data={generateWebSiteSchema()} id="website-schema" />
      <StructuredData data={generateOrganizationSchema()} id="organization-schema" />
      
      <AuthGuard>
        <Toaster position="top-center" expand={true} richColors />
        <MobileWarning />
        <Outlet />
      </AuthGuard>
    </ThemeProvider>
  );
}
