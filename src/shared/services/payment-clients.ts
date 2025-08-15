import { IdentityKitWeb } from '@nuwa-ai/identity-kit-web';
import { createHttpClient, RoochPaymentChannelContract, PaymentHubClient } from '@nuwa-ai/payment-kit';
import type { PaymentChannelHttpClient } from '@nuwa-ai/payment-kit';
import { LLM_GATEWAY_BASE_URL } from '@/shared/config/llm-gateway';

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
      return createHttpClient({ baseUrl: LLM_GATEWAY_BASE_URL, env });
    })();
  }
  return httpClientPromise;
}

export async function getPaymentHubClient(defaultAssetId?: string): Promise<PaymentHubClient> {
  if (!hubClientPromise) {
    hubClientPromise = (async () => {
      const { env, signer } = await getIdentityEnvAndSigner();
      const chain = (env as any).chainConfig || undefined;
      const contract = new RoochPaymentChannelContract({
        rpcUrl: chain?.rpcUrl,
        network: chain?.network,
        debug: !!chain?.debug,
      });
      return new PaymentHubClient({ contract, signer, defaultAssetId: defaultAssetId || '0x3::gas_coin::RGas' });
    })();
  }
  return hubClientPromise;
}


