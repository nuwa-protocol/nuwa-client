import {
  type UseIdentityKitOptions,
  useIdentityKit,
} from '@nuwa-ai/identity-kit-web';
import { cadopConfig } from '../config/cadop';

export const useAuth = (options: UseIdentityKitOptions = {}) => {
  const { state, sdk } = useIdentityKit({
    ...cadopConfig,
    ...options,
  });

  return {
    did: state.agentDid,
    isConnecting: state.isConnecting,
    isConnected: state.isConnected,
    isError: state.error,
    isInitializing: sdk === null,
  };
};
