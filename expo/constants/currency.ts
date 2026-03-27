export const INR_SYMBOL = '₹';
export const USDT_SYMBOL = '$';

export function formatINR(amount: number, compact?: boolean): string {
  if (compact) {
    if (amount >= 10000000) return `${INR_SYMBOL}${(amount / 10000000).toFixed(1)}Cr`;
    if (amount >= 100000) return `${INR_SYMBOL}${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000) return `${INR_SYMBOL}${(amount / 1000).toFixed(1)}K`;
  }
  return `${INR_SYMBOL}${amount.toLocaleString()}`;
}

export function formatINRValue(amount: number, decimals: number = 2): string {
  return `${INR_SYMBOL}${amount.toFixed(decimals)}`;
}

export function formatUSDT(volume: number, compact?: boolean): string {
  if (compact) {
    if (volume >= 1000000) return `${USDT_SYMBOL}${(volume / 1000000).toFixed(1)}M`;
    if (volume >= 1000) return `${USDT_SYMBOL}${(volume / 1000).toFixed(1)}K`;
  }
  return `${USDT_SYMBOL}${volume.toLocaleString()}`;
}

export function formatUSDTRaw(volume: number): string {
  return `${volume.toLocaleString()} USDT`;
}

export function formatCompact(num: number): string {
  if (num >= 10000000) return `${INR_SYMBOL}${(num / 10000000).toFixed(1)}Cr`;
  if (num >= 100000) return `${INR_SYMBOL}${(num / 100000).toFixed(1)}L`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toLocaleString();
}
