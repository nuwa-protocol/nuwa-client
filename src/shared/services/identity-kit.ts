import {
  IdentityKitWeb,
  type UseIdentityKitOptions,
} from '@nuwa-ai/identity-kit-web';
import { cadopConfig } from '../config/cadop';
import { capKitConfig } from '../config/capkit';
import { ROOCH_RPC_URL } from '../config/network';
import { cleanupPaymentClientsOnLogout } from './payment-clients';

// Singleton promise to ensure single IdentityKitWeb instance
let identityKitPromise: Promise<IdentityKitWeb> | null = null;

function getIdentityKitInstance(): Promise<IdentityKitWeb> {
  if (!identityKitPromise) {
    identityKitPromise = IdentityKitWeb.init({
      ...cadopConfig,
      roochRpcUrl: ROOCH_RPC_URL,
    });
  }
  return identityKitPromise;
}

export const NuwaIdentityKit = (options: UseIdentityKitOptions = {}) => {
  const identityKit = getIdentityKitInstance();

  const isConnected = identityKit.then((identityKit) => identityKit);

  const getKeyManager = async () => {
    return await identityKit.then((identityKit) => identityKit.getKeyManager());
  };

  const getIdentityEnv = async () => {
    return await identityKit.then((identityKit) =>
      identityKit.getIdentityEnv(),
    );
  };

  const connect = async () => {
    await identityKit.then((identityKit) =>
      identityKit.connect({
        scopes: [`${capKitConfig.contractAddress}::*::*`],
      }),
    );
  };

  const logout = async () => {
    await identityKit.then(async (identityKit) => {
      try {
        // Cleanup payment clients on logout first to avoid race condition
        await cleanupPaymentClientsOnLogout();
        await identityKit.logout();
      } catch (error) {
        console.error('Error during logout:', error);
      }
    });
  };

  const handleCallback = async (search: string) => {
    await identityKit.then((identityKit) => identityKit.handleCallback(search));
  };

  const getDid = async () => {
    return await identityKit.then((identityKit) => identityKit.getDid());
  };

  return {
    isConnected,
    connect,
    logout,
    handleCallback,
    getDid,
    getKeyManager,
    getIdentityEnv,
  };
};
