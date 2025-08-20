import {
  IdentityKitWeb,
  type UseIdentityKitOptions,
} from '@nuwa-ai/identity-kit-web';
import { CapContractAddress } from '../constants/cap';

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
    await identityKit.then((identityKit) => identityKit.connect({
      scopes: [`${CapContractAddress}::*::*`]
    }));
  };

  const logout = async () => {
    await identityKit.then((identityKit) => identityKit.logout());
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
