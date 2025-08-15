import { useCallback, useEffect, useState } from 'react';
import { getPaymentHubClient } from '@/shared/services/payment-clients';

function formatBigIntWithDecimals(
  value: bigint,
  decimals: number,
  fractionDigits: number,
): string {
  const negative = value < 0n;
  const v = negative ? -value : value;
  const base = 10n ** BigInt(decimals);
  const integer = v / base;
  let fraction = (v % base).toString().padStart(decimals, '0');
  if (fractionDigits >= 0)
    fraction = fraction.slice(0, Math.min(decimals, fractionDigits));
  const fracPart = fractionDigits > 0 ? `.${fraction}` : '';
  return `${negative ? '-' : ''}${integer.toString()}${fracPart}`;
}

export function usePaymentHubRgas(defaultAssetId = '0x3::gas_coin::RGas') {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [amount, setAmount] = useState<string>('0');
  const [usd, setUsd] = useState<string>('0');

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const hub = await getPaymentHubClient(defaultAssetId);
      const res = await hub.getBalanceWithUsd({ assetId: defaultAssetId });
      setAmount(formatBigIntWithDecimals(res.balance, 8, 8));
      setUsd(formatBigIntWithDecimals(res.balancePicoUSD, 12, 2));
      setError(null);
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }, [defaultAssetId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { loading, error, amount, usd, refetch };
}
