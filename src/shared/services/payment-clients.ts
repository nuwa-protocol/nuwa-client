import { IdentityKitWeb } from '@nuwa-ai/identity-kit-web';
import {
  createHttpClient,
  RoochPaymentChannelContract,
  PaymentHubClient,
  DebugLogger,
} from '@nuwa-ai/payment-kit';
import type { PaymentChannelHttpClient } from '@nuwa-ai/payment-kit';
import { LLM_GATEWAY } from '@/shared/config/llm-gateway';

DebugLogger.setGlobalLevel('debug');
const MAX_AMOUNT = BigInt(1000000000); //max amount per request, 10 rgas, 0.1 usd

let httpClientPromise: Promise<PaymentChannelHttpClient> | null = null;
let hubClientPromise: Promise<PaymentHubClient> | null = null;

async function getIdentityEnvAndSigner() {
  const sdk = await IdentityKitWeb.init({ storage: 'local' });
  const env = sdk.getIdentityEnv();
  const signer = env.keyManager;
  return { sdk, env, signer };
}

export async function getHttpClient(): Promise<PaymentChannelHttpClient> {
  if (!httpClientPromise) {
    httpClientPromise = (async () => {
      const { env } = await getIdentityEnvAndSigner();
      return createHttpClient({
        baseUrl: LLM_GATEWAY,
        env,
        maxAmount: MAX_AMOUNT,
        timeoutMs: 60000,
        timeoutMsStream: 60000,
        debug: true,
      });
    })();
  }
  return httpClientPromise;
}

export async function getPaymentHubClient(
  defaultAssetId?: string,
): Promise<PaymentHubClient> {
  if (!hubClientPromise) {
    hubClientPromise = (async () => {
      const { env, signer } = await getIdentityEnvAndSigner();
      const chain = (env as any).chainConfig || undefined;
      const contract = new RoochPaymentChannelContract({
        rpcUrl: chain?.rpcUrl,
        network: chain?.network,
        debug: true,
      });
      return new PaymentHubClient({
        contract,
        signer,
        defaultAssetId: defaultAssetId || '0x3::gas_coin::RGas',
      });
    })();
  }
  return hubClientPromise;
}

export async function cleanupPaymentClientsOnLogout(): Promise<void> {
  try {
    if (httpClientPromise) {
      const client = await httpClientPromise;
      try {
        await client.logoutCleanup({ clearMapping: true, reason: 'user-logout' });
      } catch (e) {
        DebugLogger.get('PaymentChannelHttpClient').debug('logoutCleanup failed', e);
      }
    }
  } finally {
    httpClientPromise = null;
    hubClientPromise = null;
  }
}
