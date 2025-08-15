import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ConnectButton } from '@/features/auth/components/connect-button';
import { useAuth } from '@/features/auth/hooks';
import { Logo } from '@/shared/components/logo';
import { Card, CardContent, CardHeader } from '@/shared/components/ui/card';
import { useLanguage } from '@/shared/hooks/use-language';

export default function LoginPage() {
  const navigate = useNavigate();
  const { isConnected } = useAuth();
  const { t } = useLanguage();

  // if already logged in, redirect to home
  useEffect(() => {
    if (isConnected) {
      navigate('/');
    }
  }, [isConnected, navigate]);

  // if already logged in, do not show login form
  if (isConnected) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-fuchsia-100 p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-pink-200/30 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-fuchsia-200/30 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-purple-100/20 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <Card className="shadow-xl border border-white/50 bg-white/90 backdrop-blur-md">
          <CardHeader className="text-center space-y-6 pb-8">
            {/* Logo */}
            <div className="flex justify-center">
              <Logo autoTheme={false} />
            </div>

            {/* Title with icon */}
          </CardHeader>

          <CardContent className="pb-8">
            <ConnectButton />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
