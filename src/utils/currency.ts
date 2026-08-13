export interface Currency {
  code: string;
  name: string;
  symbol: string;
  flag: string;
  decimals: number;
  fallbackRate: number; // 1 USD = X Currency
}

export const SUPPORTED_CURRENCIES: Currency[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸', decimals: 2, fallbackRate: 1.0 },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺', decimals: 2, fallbackRate: 0.92 },
  { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧', decimals: 2, fallbackRate: 0.79 },
  { code: 'BDT', name: 'Bangladeshi Taka', symbol: '৳', flag: '🇧🇩', decimals: 2, fallbackRate: 121.50 },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', flag: '🇦🇪', decimals: 2, fallbackRate: 3.6725 },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳', decimals: 2, fallbackRate: 86.85 },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵', decimals: 0, fallbackRate: 154.50 },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', flag: '🇸🇬', decimals: 2, fallbackRate: 1.34 },
  { code: 'THB', name: 'Thai Baht', symbol: '฿', flag: '🇹🇭', decimals: 2, fallbackRate: 35.80 },
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp', flag: '🇮🇩', decimals: 0, fallbackRate: 16250 },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$', flag: '🇨🇦', decimals: 2, fallbackRate: 1.39 },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'AU$', flag: '🇦🇺', decimals: 2, fallbackRate: 1.54 },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', flag: '🇨🇭', decimals: 2, fallbackRate: 0.88 },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳', decimals: 2, fallbackRate: 7.24 },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩', flag: '🇰🇷', decimals: 0, fallbackRate: 1390 },
  { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼', flag: '🇸🇦', decimals: 2, fallbackRate: 3.75 },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺', flag: '🇹🇷', decimals: 2, fallbackRate: 34.20 },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', flag: '🇧🇷', decimals: 2, fallbackRate: 5.75 },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', flag: '🇲🇾', decimals: 2, fallbackRate: 4.45 },
  { code: 'PHP', name: 'Philippine Peso', symbol: '₱', flag: '🇵🇭', decimals: 2, fallbackRate: 58.20 },
  { code: 'VND', name: 'Vietnamese Dong', symbol: '₫', flag: '🇻🇳', decimals: 0, fallbackRate: 25400 },
  { code: 'KZT', name: 'Kazakhstani Tenge', symbol: '₸', flag: '🇰🇿', decimals: 2, fallbackRate: 495.0 },
  { code: 'UAH', name: 'Ukrainian Hryvnia', symbol: '₴', flag: '🇺🇦', decimals: 2, fallbackRate: 41.50 },
  { code: 'RUB', name: 'Russian Ruble', symbol: '₽', flag: '🇷🇺', decimals: 2, fallbackRate: 96.50 }
];

export const DEFAULT_CURRENCY_CODE = 'USD';
const STORAGE_KEY_CURRENCY = 'ton_travel_selected_currency';
const STORAGE_KEY_RATES = 'ton_travel_fx_rates_cache';

export const DEFAULT_FX_RATES: Record<string, number> = {
  USD: 1.0,
  EUR: 0.92,
  GBP: 0.79,
  BDT: 121.50,
  AED: 3.6725,
  INR: 86.85,
  JPY: 154.50,
  SGD: 1.34,
  THB: 35.80,
  IDR: 16250,
  CAD: 1.39,
  AUD: 1.54,
  CHF: 0.88,
  CNY: 7.24,
  KRW: 1390,
  SAR: 3.75,
  TRY: 34.20,
  BRL: 5.75,
  MYR: 4.45,
  PHP: 58.20,
  VND: 25400,
  KZT: 495.0,
  UAH: 41.50,
  RUB: 96.50
};

export interface FxRatesCache {
  rates: Record<string, number>;
  lastUpdated: number; // timestamp ms
  source: string;
}

export function getCurrencyInfo(code: string): Currency {
  const found = SUPPORTED_CURRENCIES.find((c) => c.code.toUpperCase() === code.toUpperCase());
  if (found) return found;
  return (
    SUPPORTED_CURRENCIES.find((c) => c.code === 'USD') || {
      code: 'USD',
      name: 'US Dollar',
      symbol: '$',
      flag: '🇺🇸',
      decimals: 2,
      fallbackRate: 1.0
    }
  );
}

export function loadSavedCurrency(): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_CURRENCY);
    if (saved && SUPPORTED_CURRENCIES.some((c) => c.code === saved)) {
      return saved;
    }
  } catch (e) {
    // Ignore storage issues
  }
  return DEFAULT_CURRENCY_CODE;
}

export function saveSelectedCurrency(code: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_CURRENCY, code);
  } catch (e) {
    // Ignore storage issues
  }
}

export const saveCurrency = saveSelectedCurrency;

export function getFallbackRates(): Record<string, number> {
  const rates: Record<string, number> = {};
  SUPPORTED_CURRENCIES.forEach((c) => {
    rates[c.code] = c.fallbackRate;
  });
  return rates;
}

export function loadCachedRates(): FxRatesCache {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_RATES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.rates === 'object' && parsed.rates.USD === 1) {
        return parsed;
      }
    }
  } catch (e) {
    // Ignore cache parse error
  }
  return {
    rates: getFallbackRates(),
    lastUpdated: Date.now() - 3600 * 1000,
    source: 'Built-in FX Baseline'
  };
}

export async function fetchLiveFxRates(): Promise<FxRatesCache> {
  // 1. Try public FX API
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    const res = await fetch('https://open.er-api.com/v6/latest/USD', {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && data.rates && typeof data.rates === 'object') {
        const rates: Record<string, number> = { ...getFallbackRates(), ...data.rates };
        const result: FxRatesCache = {
          rates,
          lastUpdated: (data.time_last_update_unix ? data.time_last_update_unix * 1000 : Date.now()),
          source: 'Open Exchange Rates (Live FX)'
        };
        try {
          localStorage.setItem(STORAGE_KEY_RATES, JSON.stringify(result));
        } catch (e) {
          // ignore storage error
        }
        return result;
      }
    }
  } catch (err) {
    console.warn('Public FX API direct fetch failed, trying backend proxy:', err);
  }

  // 2. Try server route fallback
  try {
    const res = await fetch('/api/fx-rates');
    if (res.ok) {
      const data = await res.json();
      if (data && data.rates) {
        const result: FxRatesCache = {
          rates: { ...getFallbackRates(), ...data.rates },
          lastUpdated: data.lastUpdated || Date.now(),
          source: data.source || 'Server FX Service'
        };
        try {
          localStorage.setItem(STORAGE_KEY_RATES, JSON.stringify(result));
        } catch (e) {}
        return result;
      }
    }
  } catch (err) {
    console.warn('Server FX proxy also unreachable:', err);
  }

  // 3. Fallback to cached or baseline
  return loadCachedRates();
}

export async function fetchFxRates(): Promise<Record<string, number>> {
  const cached = await fetchLiveFxRates();
  return cached.rates;
}

/**
 * Converts USD to selected Fiat currency using given rates table
 */
export function convertUsdToFiat(amountUsd: number, currencyCode: string, rates: Record<string, number>): number {
  if (!amountUsd || isNaN(amountUsd)) return 0;
  if (currencyCode === 'USD') return amountUsd;
  const rate = rates[currencyCode] || getCurrencyInfo(currencyCode).fallbackRate || 1;
  return amountUsd * rate;
}

/**
 * Converts TON to selected Fiat currency using TON USD price and rates table
 */
export function convertTonToFiat(
  amountTon: number,
  tonPriceUsd: number,
  currencyCode: string,
  rates: Record<string, number>
): number {
  if (!amountTon || isNaN(amountTon)) return 0;
  const amountUsd = amountTon * tonPriceUsd;
  return convertUsdToFiat(amountUsd, currencyCode, rates);
}

/**
 * Formats a fiat value nicely with localized symbol, separators, and decimal rules
 */
export function formatFiat(amount: number, currencyCode: string): string {
  const info = getCurrencyInfo(currencyCode);
  const decimals = info.decimals;

  const formattedNumber = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(amount);

  if (info.symbol === '৳') {
    return `৳${formattedNumber} ${info.code}`;
  } else if (info.symbol === 'Rp' || info.symbol === 'RM' || info.symbol === 'CA$' || info.symbol === 'AU$') {
    return `${info.symbol} ${formattedNumber}`;
  } else if (info.symbol === 'د.إ' || info.symbol === '﷼') {
    return `${formattedNumber} ${info.symbol}`;
  }

  return `${info.symbol}${formattedNumber}`;
}

/**
 * Converts and formats USD amount into selected fiat representation
 */
export function formatFiatEstimate(amountUsd: number, currencyCode: string, rates: Record<string, number>): string {
  const converted = convertUsdToFiat(amountUsd, currencyCode, rates);
  return formatFiat(converted, currencyCode);
}
