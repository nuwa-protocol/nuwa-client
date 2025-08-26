import {
  IdentityKitWeb,
  type UseIdentityKitOptions,
} from '@nuwa-ai/identity-kit-web';
import { capKitConfig } from '../config/capkit';
import { cleanupPaymentClientsOnLogout } from './payment-clients';

export const NuwaIdentityKit = (options: UseIdentityKitOptions = {}) => {
  const identityKit = IdentityKitWeb.init({
    appName: 'Nuwa Assistant',
    storage: 'local',
    ...options,
  });

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
    connect,
    logout,
    handleCallback,
    getDid,
    getKeyManager,
    getIdentityEnv,
  };
};
