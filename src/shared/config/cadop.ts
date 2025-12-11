import { ID_DOMAIN } from './network';

// Use network-resolved domain, localStorage override is removed to prevent
// stale cache from breaking network switching
export const cadopConfig = {
  appName: 'Nuwa Assistant',
  cadopDomain: ID_DOMAIN,
  storage: 'local' as const,
  autoConnect: false,
};
