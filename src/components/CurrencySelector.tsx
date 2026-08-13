import React from 'react';
import { getCurrencyInfo, formatFiat } from '../utils/currency';
import { Globe, ChevronDown, ArrowRightLeft } from 'lucide-react';
import { AccentThemeDef } from '../utils/theme';

interface CurrencySelectorProps {
  selectedCurrency: string;
  onOpenConverter: () => void;
  rates: Record<string, number>;
  tonPriceUsd: number;
  themeDef?: AccentThemeDef;
  variant?: 'header' | 'card' | 'inline';
}

export const CurrencySelector: React.FC<CurrencySelectorProps> = ({
  selectedCurrency,
  onOpenConverter,
  rates,
  tonPriceUsd,
  themeDef,
  variant = 'header'
}) => {
  const info = getCurrencyInfo(selectedCurrency);
  const rate = rates[selectedCurrency] || info.fallbackRate || 1;

  if (variant === 'card') {
    return (
      <div
        onClick={onOpenConverter}
        className="cursor-pointer bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 p-3 rounded-2xl transition-all duration-200 flex items-center justify-between gap-3 shadow-md group"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center text-base shrink-0 group-hover:scale-105 transition-transform">
            {info.flag}
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>{info.name}</span>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded">
                {info.code} ({info.symbol})
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              1 USD = {formatFiat(rate, selectedCurrency)} • 1 TON ≈ {formatFiat(tonPriceUsd * rate, selectedCurrency)}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 text-xs font-semibold text-cyan-400 group-hover:translate-x-0.5 transition-transform shrink-0">
          <span>Convert</span>
          <ArrowRightLeft className="w-3.5 h-3.5" />
        </div>
      </div>
    );
  }

  // Header compact pill
  return (
    <button
      id="open-currency-converter-btn"
      onClick={onOpenConverter}
      title={`Current Currency: ${info.name} (${info.code}). Click to open Currency Converter & FX Rates.`}
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 hover:text-white border border-slate-700/70 transition-all shadow-sm group"
    >
      <span className="text-sm">{info.flag}</span>
      <span>{info.code}</span>
      <span className="text-[10px] text-slate-400 font-normal hidden sm:inline">
        ({info.symbol})
      </span>
      <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-white transition-colors" />
    </button>
  );
};
