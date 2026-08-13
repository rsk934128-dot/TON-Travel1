import React, { useState } from 'react';
import {
  Currency,
  SUPPORTED_CURRENCIES,
  getCurrencyInfo,
  formatFiat,
  convertUsdToFiat,
  convertTonToFiat
} from '../utils/currency';
import {
  X,
  Search,
  RefreshCw,
  ArrowRightLeft,
  DollarSign,
  Zap,
  Check,
  TrendingUp,
  Globe,
  Sparkles,
  Info
} from 'lucide-react';
import { AccentThemeDef } from '../utils/theme';

interface CurrencyConverterModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCurrency: string;
  onSelectCurrency: (currencyCode: string) => void;
  rates: Record<string, number>;
  tonPriceUsd: number;
  lastUpdated: number;
  ratesSource: string;
  onRefreshRates: () => Promise<void>;
  isRefreshing: boolean;
  themeDef: AccentThemeDef;
}

export const CurrencyConverterModal: React.FC<CurrencyConverterModalProps> = ({
  isOpen,
  onClose,
  selectedCurrency,
  onSelectCurrency,
  rates,
  tonPriceUsd,
  lastUpdated,
  ratesSource,
  onRefreshRates,
  isRefreshing,
  themeDef
}) => {
  if (!isOpen) return null;

  const currentCurrencyInfo = getCurrencyInfo(selectedCurrency);

  // Converter state
  const [activeInputMode, setActiveInputMode] = useState<'USD' | 'TON' | 'FIAT'>('USD');
  const [usdAmount, setUsdAmount] = useState<number>(250);
  const [tonAmount, setTonAmount] = useState<number>(() => Number((250 / tonPriceUsd).toFixed(2)));
  const [fiatAmount, setFiatAmount] = useState<number>(() =>
    Number(convertUsdToFiat(250, selectedCurrency, rates).toFixed(currentCurrencyInfo.decimals))
  );

  const [searchQuery, setSearchQuery] = useState('');

  // Handle USD input change
  const handleUsdChange = (val: string) => {
    const num = parseFloat(val) || 0;
    setUsdAmount(num);
    setTonAmount(Number((num / tonPriceUsd).toFixed(3)));
    setFiatAmount(Number(convertUsdToFiat(num, selectedCurrency, rates).toFixed(currentCurrencyInfo.decimals)));
  };

  // Handle TON input change
  const handleTonChange = (val: string) => {
    const num = parseFloat(val) || 0;
    setTonAmount(num);
    const calculatedUsd = num * tonPriceUsd;
    setUsdAmount(Number(calculatedUsd.toFixed(2)));
    setFiatAmount(Number(convertUsdToFiat(calculatedUsd, selectedCurrency, rates).toFixed(currentCurrencyInfo.decimals)));
  };

  // Handle Fiat input change
  const handleFiatChange = (val: string) => {
    const num = parseFloat(val) || 0;
    setFiatAmount(num);
    const rate = rates[selectedCurrency] || currentCurrencyInfo.fallbackRate || 1;
    const calculatedUsd = rate > 0 ? num / rate : 0;
    setUsdAmount(Number(calculatedUsd.toFixed(2)));
    setTonAmount(Number((calculatedUsd / tonPriceUsd).toFixed(3)));
  };

  // Handle Currency change
  const handleCurrencySelect = (code: string) => {
    onSelectCurrency(code);
    const newInfo = getCurrencyInfo(code);
    const newFiat = convertUsdToFiat(usdAmount, code, rates);
    setFiatAmount(Number(newFiat.toFixed(newInfo.decimals)));
  };

  const filteredCurrencies = SUPPORTED_CURRENCIES.filter(
    (c) =>
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Quick popular presets
  const popularPresets = [50, 150, 300, 750, 1500];

  const currentRate = rates[selectedCurrency] || currentCurrencyInfo.fallbackRate || 1;
  const tonInFiat = tonPriceUsd * currentRate;

  // Format time ago
  const formatTimeAgo = (timestamp: number) => {
    const diff = Math.max(0, Date.now() - timestamp);
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    return `${hours}h ago`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        id="currency-converter-modal"
        className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg shadow-inner"
              style={{ backgroundColor: `${themeDef.primaryHex}25`, color: themeDef.secondaryHex }}
            >
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>Real-Time Currency Converter</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Live FX
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                View instant hotel booking estimates & TON cashback in your local fiat currency.
              </p>
            </div>
          </div>
          <button
            id="close-currency-converter-btn"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800/60 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Rate Summary Card */}
          <div className="bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{currentCurrencyInfo.flag}</span>
                <div>
                  <div className="text-xs font-bold text-slate-300">
                    {currentCurrencyInfo.name} ({currentCurrencyInfo.code})
                  </div>
                  <div className="text-sm font-extrabold text-white">
                    1 USD = {formatFiat(currentRate, selectedCurrency)}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="text-right">
                  <div className="text-[10px] text-slate-400">1 TON Equivalent</div>
                  <div className="text-xs font-bold text-cyan-300">
                    ≈ {formatFiat(tonInFiat, selectedCurrency)}
                  </div>
                </div>
                <button
                  id="refresh-fx-rates-btn"
                  onClick={onRefreshRates}
                  disabled={isRefreshing}
                  title="Refresh Live FX Rates"
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
                </button>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
                <span>Source: {ratesSource}</span>
              </span>
              <span>Updated: {formatTimeAgo(lastUpdated)}</span>
            </div>
          </div>

          {/* Interactive 3-Way Converter Inputs */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <ArrowRightLeft className="w-3.5 h-3.5 text-cyan-400" />
              <span>Interactive Cost Calculator</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* USD Input */}
              <div
                className={`p-3 rounded-2xl border transition-all ${
                  activeInputMode === 'USD'
                    ? 'bg-slate-950 border-cyan-500/60 shadow-md shadow-cyan-500/10'
                    : 'bg-slate-950/60 border-slate-800'
                }`}
                onClick={() => setActiveInputMode('USD')}
              >
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 mb-1">
                  <span>US Dollar (USD)</span>
                  <span className="text-xs">🇺🇸 $</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-slate-400 text-sm font-bold">$</span>
                  <input
                    id="converter-usd-input"
                    type="number"
                    value={usdAmount || ''}
                    onChange={(e) => handleUsdChange(e.target.value)}
                    onFocus={() => setActiveInputMode('USD')}
                    className="w-full bg-transparent text-white font-black text-base focus:outline-none"
                    placeholder="0.00"
                    min="0"
                  />
                </div>
              </div>

              {/* TON Input */}
              <div
                className={`p-3 rounded-2xl border transition-all ${
                  activeInputMode === 'TON'
                    ? 'bg-slate-950 border-cyan-500/60 shadow-md shadow-cyan-500/10'
                    : 'bg-slate-950/60 border-slate-800'
                }`}
                onClick={() => setActiveInputMode('TON')}
              >
                <div className="flex items-center justify-between text-[11px] font-semibold text-cyan-400 mb-1">
                  <span>TON Crypto</span>
                  <span className="text-xs">💎 TON</span>
                </div>
                <div className="flex items-center gap-1">
                  <input
                    id="converter-ton-input"
                    type="number"
                    value={tonAmount || ''}
                    onChange={(e) => handleTonChange(e.target.value)}
                    onFocus={() => setActiveInputMode('TON')}
                    className="w-full bg-transparent text-cyan-300 font-black text-base focus:outline-none"
                    placeholder="0.00"
                    min="0"
                  />
                  <span className="text-cyan-400 text-xs font-bold shrink-0">TON</span>
                </div>
              </div>

              {/* Fiat Input */}
              <div
                className={`p-3 rounded-2xl border transition-all ${
                  activeInputMode === 'FIAT'
                    ? 'bg-slate-950 border-cyan-500/60 shadow-md shadow-cyan-500/10'
                    : 'bg-slate-950/60 border-slate-800'
                }`}
                onClick={() => setActiveInputMode('FIAT')}
              >
                <div className="flex items-center justify-between text-[11px] font-semibold text-amber-300 mb-1">
                  <span className="truncate">{currentCurrencyInfo.name}</span>
                  <span className="text-xs shrink-0">{currentCurrencyInfo.flag}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-amber-400 text-sm font-bold">{currentCurrencyInfo.symbol}</span>
                  <input
                    id="converter-fiat-input"
                    type="number"
                    value={fiatAmount || ''}
                    onChange={(e) => handleFiatChange(e.target.value)}
                    onFocus={() => setActiveInputMode('FIAT')}
                    className="w-full bg-transparent text-amber-300 font-black text-base focus:outline-none"
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[11px] text-slate-400 font-medium mr-1">Quick Stays:</span>
              {popularPresets.map((amt) => (
                <button
                  key={amt}
                  onClick={() => handleUsdChange(amt.toString())}
                  className={`text-xs px-2.5 py-1 rounded-lg border font-semibold transition-all ${
                    usdAmount === amt
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                      : 'bg-slate-800 text-slate-300 border-slate-700/60 hover:bg-slate-700'
                  }`}
                >
                  ${amt}
                </button>
              ))}
            </div>
          </div>

          {/* TON Cashback in Local Fiat Preview */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-cyan-950/30 via-slate-950 to-purple-950/30 border border-cyan-500/20 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-300 font-bold text-sm">
                🎁
              </div>
              <div>
                <div className="text-xs font-bold text-slate-200">
                  Estimated 8% Telegram Premium TON Cashback
                </div>
                <div className="text-[11px] text-slate-400">
                  On a {formatFiat(convertUsdToFiat(usdAmount, selectedCurrency, rates), selectedCurrency)} stay
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-sm font-black text-cyan-300">
                +{( (usdAmount * 0.08) / tonPriceUsd ).toFixed(2)} TON
              </div>
              <div className="text-[11px] font-bold text-amber-400">
                ≈ {formatFiat(convertUsdToFiat(usdAmount * 0.08, selectedCurrency, rates), selectedCurrency)}
              </div>
            </div>
          </div>

          {/* Select Local Currency Section */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-cyan-400" />
                <span>Select Your Local Fiat Currency</span>
              </label>
              <span className="text-[11px] text-slate-400">
                {SUPPORTED_CURRENCIES.length} Available
              </span>
            </div>

            {/* Currency Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="search-currency-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search currency code or name (e.g. BDT, EUR, Pound, Rupee...)"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Currency Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-1">
              {filteredCurrencies.map((cur) => {
                const isSelected = cur.code === selectedCurrency;
                const liveRate = rates[cur.code] || cur.fallbackRate;

                return (
                  <button
                    key={cur.code}
                    id={`select-currency-${cur.code.toLowerCase()}`}
                    onClick={() => handleCurrencySelect(cur.code)}
                    className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'bg-[#0088cc]/20 border-[#0088cc] shadow-md shadow-[#0088cc]/20 text-white'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-lg shrink-0">{cur.flag}</span>
                      <div className="min-w-0">
                        <div className="text-xs font-bold flex items-center gap-1 truncate">
                          <span>{cur.code}</span>
                          <span className="text-[10px] text-slate-400">({cur.symbol})</span>
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">{cur.name}</div>
                        <div className="text-[9px] text-cyan-400/80 font-mono mt-0.5">
                          1$ = {liveRate < 10 ? liveRate.toFixed(2) : Math.round(liveRate)}
                        </div>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-[#0088cc] text-white flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-400">
            Active Currency: <strong className="text-white">{currentCurrencyInfo.name} ({currentCurrencyInfo.code})</strong>
          </div>
          <button
            id="apply-currency-btn"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-lg"
            style={{
              backgroundColor: themeDef.primaryHex
            }}
          >
            Apply & Save
          </button>
        </div>
      </div>
    </div>
  );
};
