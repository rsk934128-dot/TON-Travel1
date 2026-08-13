import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  SlidersHorizontal,
  RefreshCw,
  Zap,
  TrendingUp,
  MapPin,
  Star,
  CheckCircle2,
  Lightbulb,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Sliders,
  Wallet,
  Gem
} from 'lucide-react';
import {
  Booking,
  Hotel,
  SmartSuggestion,
  SmartSuggestionsResult,
  UserTravelPreferences
} from '../types';
import {
  AVAILABLE_STYLES,
  AVAILABLE_BUDGETS,
  AVAILABLE_PACES,
  AVAILABLE_PERKS,
  loadUserPreferences,
  saveUserPreferences,
  fetchSmartSuggestions
} from '../utils/smartSuggestions';
import { formatFiatEstimate } from '../utils/currency';
import { AccentThemeDef } from '../utils/theme';

interface SmartTravelSuggestionsProps {
  bookings: Booking[];
  hotels: Hotel[];
  tonPriceUsd: number;
  isPremium: boolean;
  loyaltyBonusPercentage: number;
  loyaltyTierName: string;
  tonBalance: number;
  selectedCurrency?: string;
  rates?: Record<string, number>;
  theme: AccentThemeDef;
  onSelectHotel: (hotel: Hotel) => void;
}

export const SmartTravelSuggestions: React.FC<SmartTravelSuggestionsProps> = ({
  bookings,
  hotels,
  tonPriceUsd,
  isPremium,
  loyaltyBonusPercentage,
  loyaltyTierName,
  tonBalance,
  selectedCurrency = 'USD',
  rates = {},
  theme,
  onSelectHotel
}) => {
  const [preferences, setPreferences] = useState<UserTravelPreferences>(loadUserPreferences);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<SmartSuggestionsResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const baseRate = isPremium ? 8 : 5;
  const totalRate = baseRate + loyaltyBonusPercentage;

  const runGeminiAnalysis = async (customPrefs?: UserTravelPreferences) => {
    setIsLoading(true);
    setError(null);
    try {
      const prefsToUse = customPrefs || preferences;
      const result = await fetchSmartSuggestions({
        bookingHistory: bookings,
        preferences: prefsToUse,
        isPremium,
        loyaltyBonusPercentage,
        tonPriceUsd,
        tonBalance,
        availableHotels: hotels
      });
      setData(result);
    } catch (err: any) {
      console.error('Failed to run smart suggestions:', err);
      setError('Could not complete AI analysis. Showing cached travel matches.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    runGeminiAnalysis();
  }, [bookings.length, isPremium, loyaltyBonusPercentage, tonPriceUsd]);

  const handleToggleStyle = (style: string) => {
    const nextStyles = preferences.travelStyles.includes(style)
      ? preferences.travelStyles.filter(s => s !== style)
      : [...preferences.travelStyles, style];
    const updated = { ...preferences, travelStyles: nextStyles };
    setPreferences(updated);
    saveUserPreferences(updated);
  };

  const handleTogglePerk = (perk: string) => {
    const nextPerks = preferences.favoritePerks.includes(perk)
      ? preferences.favoritePerks.filter(p => p !== perk)
      : [...preferences.favoritePerks, perk];
    const updated = { ...preferences, favoritePerks: nextPerks };
    setPreferences(updated);
    saveUserPreferences(updated);
  };

  const handleSelectBudget = (budget: string) => {
    const updated = { ...preferences, budgetTier: budget };
    setPreferences(updated);
    saveUserPreferences(updated);
  };

  const handleSelectPace = (pace: string) => {
    const updated = { ...preferences, tripPace: pace };
    setPreferences(updated);
    saveUserPreferences(updated);
  };

  const handleSaveAndRerun = () => {
    setIsPreferencesOpen(false);
    runGeminiAnalysis(preferences);
  };

  // Find hotel object matching suggestion for 1-click booking
  const getHotelForSuggestion = (sug: SmartSuggestion): Hotel | undefined => {
    return hotels.find(
      h =>
        h.id === sug.hotelId ||
        h.name.toLowerCase().includes(sug.hotelName.toLowerCase()) ||
        sug.hotelName.toLowerCase().includes(h.name.toLowerCase())
    );
  };

  const showFiat = selectedCurrency !== 'USD';

  return (
    <div
      id="smart-travel-suggestions-section"
      className="mb-8 rounded-3xl bg-gradient-to-b from-slate-900/95 via-slate-900/90 to-slate-950/95 border border-slate-800 shadow-2xl overflow-hidden transition-all"
    >
      {/* Header Bar */}
      <div className="p-5 sm:p-6 border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 shrink-0 text-white">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
                  Smart Travel Suggestions
                </h2>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-cyan-400 fill-cyan-400" />
                  Gemini AI
                </span>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <Gem className="w-3 h-3 text-amber-400" />
                  {totalRate}% Max Cashback
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Analyzed {bookings.length > 0 ? `${bookings.length} past stays & DNA` : 'travel preferences'} to discover high-yield TON cashback gems.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setIsPreferencesOpen(!isPreferencesOpen)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                isPreferencesOpen
                  ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300 shadow-sm'
                  : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700/60 text-slate-200'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Personalize DNA</span>
              {isPreferencesOpen ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>

            <button
              onClick={() => runGeminiAnalysis()}
              disabled={isLoading}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-slate-200 hover:text-white transition-all flex items-center gap-1.5 disabled:opacity-50"
              title="Re-run Gemini AI Analysis"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Preferences Slide-Down Panel */}
        {isPreferencesOpen && (
          <div className="mt-5 pt-5 border-t border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <span>Customize Your AI Travel Persona & Preferences</span>
              </div>
              <span className="text-[11px] text-slate-400">Updates AI Recommendations Instantly</span>
            </div>

            {/* Travel Styles Chips */}
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                Preferred Travel Styles & Vibes (Select all that apply)
              </label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_STYLES.map(style => {
                  const active = preferences.travelStyles.includes(style);
                  return (
                    <button
                      key={style}
                      type="button"
                      onClick={() => handleToggleStyle(style)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                        active
                          ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200 shadow-sm'
                          : 'bg-slate-800/60 border-slate-700/50 text-slate-400 hover:text-slate-200 hover:border-slate-600'
                      }`}
                    >
                      {active ? '✓ ' : '+ '}
                      {style}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Budget Tier */}
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                  Target Nightly Budget Tier
                </label>
                <div className="flex flex-col gap-1.5">
                  {AVAILABLE_BUDGETS.map(budget => {
                    const active = preferences.budgetTier === budget;
                    return (
                      <button
                        key={budget}
                        type="button"
                        onClick={() => handleSelectBudget(budget)}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold text-left transition-all border flex items-center justify-between ${
                          active
                            ? 'bg-blue-500/20 border-blue-400 text-blue-200'
                            : 'bg-slate-800/60 border-slate-700/50 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <span>{budget}</span>
                        {active && <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Trip Pace */}
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                  Trip Pace & Atmosphere
                </label>
                <div className="flex flex-col gap-1.5">
                  {AVAILABLE_PACES.map(pace => {
                    const active = preferences.tripPace === pace;
                    return (
                      <button
                        key={pace}
                        type="button"
                        onClick={() => handleSelectPace(pace)}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold text-left transition-all border flex items-center justify-between ${
                          active
                            ? 'bg-blue-500/20 border-blue-400 text-blue-200'
                            : 'bg-slate-800/60 border-slate-700/50 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <span>{pace}</span>
                        {active && <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Favorite Perks */}
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                Must-Have Hotel Amenities & Perks
              </label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_PERKS.map(perk => {
                  const active = preferences.favoritePerks.includes(perk);
                  return (
                    <button
                      key={perk}
                      type="button"
                      onClick={() => handleTogglePerk(perk)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                        active
                          ? 'bg-amber-500/20 border-amber-400/80 text-amber-200 shadow-sm'
                          : 'bg-slate-800/60 border-slate-700/50 text-slate-400 hover:text-slate-200 hover:border-slate-600'
                      }`}
                    >
                      {active ? '★ ' : '+ '}
                      {perk}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Apply Button */}
            <div className="flex items-center justify-end pt-2">
              <button
                onClick={handleSaveAndRerun}
                disabled={isLoading}
                className="px-5 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/25 flex items-center gap-2 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>Save & Generate Smart Suggestions</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Body Content */}
      <div className="p-5 sm:p-6 space-y-6">
        {/* Loading State */}
        {isLoading && (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-cyan-500/20 border-t-cyan-400 animate-spin" />
              <Sparkles className="w-6 h-6 text-cyan-400 absolute inset-0 m-auto animate-pulse" />
            </div>
            <div>
              <p className="text-base font-bold text-white">Gemini AI is analyzing your Travel DNA...</p>
              <p className="text-xs text-slate-400 max-w-md mt-1">
                Evaluating {bookings.length} past booking parameters, calculating live TON cashback rates, and matching hidden gems worldwide.
              </p>
            </div>
          </div>
        )}

        {!isLoading && data && (
          <>
            {/* Travel DNA Summary & Cashback Optimization Advice */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Profile Assessment */}
              <div className="lg:col-span-2 p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wider mb-2">
                    <TrendingUp className="w-4 h-4" />
                    <span>Your Travel Persona & Booking DNA</span>
                  </div>
                  <p className="text-sm text-slate-200 leading-relaxed font-medium">
                    {data.travelProfileSummary}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1 text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Tier: <strong className="text-white">{loyaltyTierName}</strong> (+{loyaltyBonusPercentage}% TON)
                  </span>
                  <span className="flex items-center gap-1 text-slate-300">
                    <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                    Status: <strong className="text-white">{isPremium ? 'Telegram Premium (8%)' : 'Standard (5%)'}</strong>
                  </span>
                  <span className="flex items-center gap-1 text-slate-300">
                    <Wallet className="w-3.5 h-3.5 text-amber-400" />
                    Cashback Rate: <strong className="text-amber-300">{totalRate}% TON</strong>
                  </span>
                </div>
              </div>

              {/* AI Cashback Optimizer Tips */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-950/30 to-blue-950/30 border border-cyan-800/40 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-300 uppercase tracking-wider mb-2">
                    <Lightbulb className="w-4 h-4 text-amber-400" />
                    <span>TON Cashback Maximizer</span>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-300">
                    {data.cashbackOptimizationTips.slice(0, 3).map((tip, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-cyan-400 font-bold mt-0.5">•</span>
                        <span className="leading-snug">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Suggestions Grid */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-bold text-white">
                    Personalized 'Hidden Gem' Stays
                  </h3>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                    {data.suggestions.length} Matches
                  </span>
                </div>
                <span className="text-xs text-slate-400 hidden sm:inline">
                  Sorted by TON Cashback Yield & DNA Affinity
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                {data.suggestions.map((sug, index) => {
                  const matchedHotel = getHotelForSuggestion(sug);
                  const priceUsd = sug.pricePerNightUsd;
                  const nights = sug.nightsRecommendation || 3;
                  const totalStayUsd = priceUsd * nights;
                  const priceTon = priceUsd / tonPriceUsd;
                  
                  const fiatPrice = formatFiatEstimate(priceUsd, selectedCurrency, rates);
                  const fiatTotalStay = formatFiatEstimate(totalStayUsd, selectedCurrency, rates);
                  const fiatCashback = formatFiatEstimate(sug.estimatedCashbackUsd, selectedCurrency, rates);

                  const imageUrl =
                    matchedHotel?.images[0] ||
                    'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1200&q=80';

                  return (
                    <div
                      key={sug.hotelId || index}
                      className="group bg-slate-950/90 rounded-2xl border border-slate-800 hover:border-cyan-500/50 overflow-hidden shadow-xl transition-all duration-200 flex flex-col justify-between"
                    >
                      {/* Top Image + Badges */}
                      <div className="relative h-44 w-full overflow-hidden bg-slate-900">
                        <img
                          src={imageUrl}
                          alt={sug.hotelName}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-black/40" />

                        {/* Match Score Badge */}
                        <div className="absolute top-3 left-3 bg-slate-950/90 backdrop-blur-md border border-cyan-400/40 text-white text-xs font-black px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400" />
                          <span>{sug.matchScore}% Match</span>
                        </div>

                        {/* Tag Pill */}
                        {sug.tag && (
                          <div className="absolute top-3 right-3 bg-amber-500/90 backdrop-blur-md text-slate-950 font-black text-[11px] px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
                            <span>{sug.tag}</span>
                          </div>
                        )}

                        {/* Location and Vibe */}
                        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
                          <div className="flex items-center gap-1 text-xs font-semibold text-slate-200 truncate">
                            <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                            <span className="truncate">{sug.destination}</span>
                          </div>

                          <div className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-cyan-300 border border-cyan-400/20">
                            {sug.primaryVibe}
                          </div>
                        </div>
                      </div>

                      {/* Content Body */}
                      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                              {sug.hotelName}
                            </h4>
                            {matchedHotel && (
                              <div className="flex items-center gap-1 text-xs font-bold text-amber-400 shrink-0">
                                <Star className="w-3.5 h-3.5 fill-amber-400" />
                                <span>{matchedHotel.rating.toFixed(2)}</span>
                              </div>
                            )}
                          </div>

                          {/* Why Gemini Recommends This */}
                          <div className="mt-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 text-xs text-slate-300 space-y-1">
                            <div className="font-bold text-cyan-300 flex items-center gap-1 text-[11px] uppercase tracking-wider">
                              <Sparkles className="w-3 h-3" />
                              <span>Why Gemini Matched This Stay</span>
                            </div>
                            <p className="leading-relaxed">{sug.whyYoullLoveIt}</p>
                          </div>

                          {/* Insider Secret */}
                          {sug.insiderTip && (
                            <div className="mt-2 flex items-start gap-2 text-xs text-amber-200/90 bg-amber-950/20 border border-amber-500/20 rounded-xl p-2.5">
                              <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                              <p className="leading-tight">
                                <strong className="text-amber-300">Insider Perk: </strong>
                                {sug.insiderTip}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Pricing & Massive Cashback Box */}
                        <div className="pt-3 border-t border-slate-800 space-y-3">
                          <div className="flex items-end justify-between gap-2">
                            <div>
                              <div className="text-[11px] text-slate-400 font-medium">
                                Nightly rate ({nights} Nights stay)
                              </div>
                              <div className="flex items-baseline gap-1.5 flex-wrap">
                                <span className="text-lg font-black text-white">${priceUsd}</span>
                                {showFiat && (
                                  <span className="text-xs font-bold text-amber-300">
                                    (≈ {fiatPrice})
                                  </span>
                                )}
                                <span className="text-xs text-slate-400">/ night</span>
                              </div>
                            </div>

                            {/* TON Cashback Earnings Callout */}
                            <div className="text-right">
                              <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                                Max Estimated Cashback
                              </div>
                              <div className="text-base font-black text-emerald-400 flex items-center justify-end gap-1">
                                <span>+{sug.estimatedCashbackTon} TON</span>
                              </div>
                              <div className="text-[10px] text-slate-400">
                                ≈ ${sug.estimatedCashbackUsd.toFixed(2)} USD
                                {showFiat && ` (≈ ${fiatCashback})`}
                              </div>
                            </div>
                          </div>

                          {/* Action Button */}
                          <button
                            onClick={() => {
                              if (matchedHotel) {
                                onSelectHotel(matchedHotel);
                              } else if (hotels.length > 0) {
                                onSelectHotel(hotels[0]);
                              }
                            }}
                            className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-[#0088cc] to-blue-600 hover:from-[#0099e6] hover:to-blue-500 text-white shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition-all"
                          >
                            <span>Explore & Book with TON</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
