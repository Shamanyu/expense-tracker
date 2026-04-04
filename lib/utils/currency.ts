export const FX_RATES_TO_USD: Record<string, number> = {
  USD: 1, EUR: 1.08, GBP: 1.27, JPY: 0.0067, CAD: 0.74, AUD: 0.65,
  CHF: 1.13, CNY: 0.14, INR: 0.012, MXN: 0.058, BRL: 0.19, SGD: 0.75,
  HKD: 0.13, NOK: 0.094, SEK: 0.095, DKK: 0.145, NZD: 0.61, ZAR: 0.054,
  AED: 0.27, SAR: 0.27, THB: 0.028, IDR: 0.000064, MYR: 0.22, PHP: 0.018,
  PKR: 0.0036, BDT: 0.0091, EGP: 0.032, NGN: 0.00063, KES: 0.0077, TRY: 0.031,
}

export function convertToUSD(amount: number, fromCurrency: string): number {
  const rate = FX_RATES_TO_USD[fromCurrency]
  if (!rate) return amount // No conversion available
  return amount * rate
}

export function convertFromUSD(amountUSD: number, toCurrency: string): number {
  const rate = FX_RATES_TO_USD[toCurrency]
  if (!rate) return amountUSD
  return amountUSD / rate
}

export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): number {
  if (fromCurrency === toCurrency) return amount
  const usd = convertToUSD(amount, fromCurrency)
  return convertFromUSD(usd, toCurrency)
}

export function hasConversionRate(currency: string): boolean {
  return currency in FX_RATES_TO_USD
}

export function formatCurrency(
  amount: number,
  currency: string,
  opts?: { showSign?: boolean; approximate?: boolean }
): string {
  const abs = Math.abs(amount)
  const hasRate = hasConversionRate(currency)
  const prefix = opts?.approximate && !hasRate ? '~' : ''

  let formatted: string
  try {
    formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(abs)
  } catch {
    formatted = `${currency} ${abs.toFixed(2)}`
  }

  if (opts?.showSign && amount !== 0) {
    const sign = amount > 0 ? '+' : '-'
    return `${prefix}${sign}${formatted}`
  }

  if (amount < 0) {
    return `${prefix}-${formatted}`
  }

  return `${prefix}${formatted}`
}
