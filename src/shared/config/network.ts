// Resolve network-specific endpoints based on the current hostname.
// Default behaviour: treat unknown hosts as testnet.

export type NuwaNetwork = 'main' | 'test';

const MAIN_HOSTS = new Set(['app.nuwa.dev']);
const TEST_HOSTS = new Set(['test-app.nuwa.dev']);

const detectHostname = (): string => {
  if (typeof window !== 'undefined' && window.location?.hostname) {
    return window.location.hostname.toLowerCase();
  }
  return '';
};

const normalizeNetwork = (value: string | undefined): NuwaNetwork | null => {
  const v = (value || '').toLowerCase();
  if (v === 'main' || v === 'mainnet') return 'main';
  if (v === 'test' || v === 'testnet') return 'test';
  return null;
};

export const resolveNetworkFromHost = (hostname: string): NuwaNetwork => {
  const host = hostname.toLowerCase();

  if (MAIN_HOSTS.has(host)) {
    return 'main';
  }
  if (TEST_HOSTS.has(host)) {
    return 'test';
  }

  return 'test';
};

const envOverride = normalizeNetwork(
  (import.meta.env.VITE_NUWA_NETWORK as string | undefined) ?? undefined
);

const hostname = detectHostname();

export const NETWORK: NuwaNetwork = envOverride ?? resolveNetworkFromHost(hostname);
export const IS_TESTNET = NETWORK === 'test';

// Network-aware endpoints
export const LLM_GATEWAY_HOST = IS_TESTNET
  ? 'https://test-llm.nuwa.dev'
  : 'https://llm.nuwa.dev';

export const CAPKIT_APP_URL = IS_TESTNET
  ? 'https://test-cap.nuwa.dev'
  : 'https://cap.nuwa.dev';

export const ROOCH_RPC_URL = IS_TESTNET
  ? 'https://test-seed.rooch.network'
  : 'https://main-seed.rooch.network';

export const CAPKIT_PACKAGE_ID = IS_TESTNET
  ? '0xeb1deb6f1190f86cd4e05a82cfa5775a8a5929da49fac3ab8f5bf23e9181e625'
  : '0x701c21bf1c8cd5af8c42983890d8ca55e7a820171b8e744c13f2d9998bf76cc3';

export const ID_DOMAIN = IS_TESTNET
  ? 'https://test-id.nuwa.dev'
  : 'https://id.nuwa.dev';
