import { createContext, type ReactNode, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChatStateStore } from '@/features/chat/stores';
import { SettingsStateStore } from '@/features/settings/stores';
import { WalletStore } from '@/features/wallet/stores';
import { useAuth } from '@/shared/hooks/use-auth';

type AuthGuardValue = ReturnType<typeof useAuth>;

const AuthGuardContext = createContext<AuthGuardValue | null>(null);

export function AuthGuard({ children }: { children: ReactNode }) {
  const { did, isConnecting, isConnected, isError, isInitializing } = useAuth();

  const navigate = useNavigate();
  const hasRehydrated = useRef(false);

  // Keep legacy DID store in sync so existing code relying on it continues to work.
  useEffect(() => {
    // Avoid redirect until SDK initialization completes
    if (isInitializing) {
      return;
    }

    if (!isConnecting && !isConnected) {
      navigate('/login');
      hasRehydrated.current = false; // Reset rehydration flag when user logs out
    }
  }, [isInitializing, isConnecting, isConnected, navigate]);

  // Trigger store rehydration when user becomes connected
  useEffect(() => {
    if (isConnected && !hasRehydrated.current) {
      hasRehydrated.current = true;

      // Force rehydration of all stores
      ChatStateStore.persist.rehydrate();
      SettingsStateStore.persist.rehydrate();
      WalletStore.persist.rehydrate();
    }
  }, [isConnected]);

  return (
    <AuthGuardContext.Provider
      value={{
        did,
        isConnecting,
        isConnected,
        isError,
        isInitializing,
      }}
    >
      {children}
    </AuthGuardContext.Provider>
  );
}
