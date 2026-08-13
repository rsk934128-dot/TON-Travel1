import React, { useState } from 'react';
import { Booking, UserState } from '../types';
import {
  LOYALTY_TIERS,
  LoyaltyTierName,
  calculateLoyaltyTier,
  getBookingsLast12Months
} from '../utils/loyalty';
import {
  Award,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  ChevronRight,
  Info,
  Calendar,
  CheckCircle2,
  Lock,
  Zap,
  Star,
  PlusCircle,
  RotateCcw,
  Plane
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface FrequentTravelerLoyaltySectionProps {
  bookings: Booking[];
  userState: UserState;
  onSimulateBookingAddition?: () => void;
}

export const FrequentTravelerLoyaltySection: React.FC<FrequentTravelerLoyaltySectionProps> = ({
  bookings,
  userState
}) => {
  const [simulatedBonusStays, setSimulatedBonusStays] = useState(2); // default +2 for instant rich demo of Voyager tier!
  const [activeTab, setActiveTab] = useState<'current' | 'allTiers' | 'calculator'>('current');
  const [calcStayCostUsd, setCalcStayCostUsd] = useState(850);

  const loyaltyStatus = calculateLoyaltyTier(
    bookings,
    userState.isTelegramPremium,
    simulatedBonusStays
  );

  const realCompletedLast12Mo = getBookingsLast12Months(bookings).length;

  const handleAddSimulatedStay = () => {
    setSimulatedBonusStays((prev) => {
      const next = prev + 1;
      try {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.7 }
        });
      } catch (e) {}
      return next;
    });
  };

  const handleResetSimulatedStays = () => {
    setSimulatedBonusStays(0);
  };

  const tierKeys: LoyaltyTierName[] = ['Explorer', 'Voyager', 'Globetrotter', 'Jetsetter'];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-6">
      
      {/* Top Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-amber-700 flex items-center justify-center text-2xl shadow-lg shadow-amber-500/20 text-white">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-white">
                Frequent Traveler Loyalty Tier
              </h3>
              <span className="bg-amber-400/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-400/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3 fill-amber-300" />
                <span>Trailing 12 Months</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Completed bookings in the past 12 months unlock elevated TON cashback bonus boosters
            </p>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('current')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              activeTab === 'current'
                ? 'bg-[#0088cc] text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            My Tier
          </button>
          <button
            onClick={() => setActiveTab('allTiers')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              activeTab === 'allTiers'
                ? 'bg-[#0088cc] text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All 4 Tiers
          </button>
          <button
            onClick={() => setActiveTab('calculator')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              activeTab === 'calculator'
                ? 'bg-[#0088cc] text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Reward Estimator
          </button>
        </div>
      </div>

      {/* TAB 1: CURRENT TIER & PROGRESSION */}
      {activeTab === 'current' && (
        <div className="space-y-6">
          
          {/* Main Tier Highlight Card */}
          <div className={`relative overflow-hidden rounded-2xl p-5 sm:p-6 border ${loyaltyStatus.tier.borderColor} bg-gradient-to-br ${loyaltyStatus.tier.gradientBg} shadow-xl space-y-4`}>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-2xl bg-slate-950/80 border border-slate-700/80 flex items-center justify-center text-3xl shadow-inner">
                  {loyaltyStatus.tier.icon}
                </div>
                <div>
                  <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                    <span>Active Status</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                  <h4 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    {loyaltyStatus.tier.displayName}
                  </h4>
                  <div className="text-xs text-cyan-300 font-bold mt-0.5">
                    {loyaltyStatus.tier.tagline}
                  </div>
                </div>
              </div>

              {/* Total Cashback Pill */}
              <div className="bg-slate-950/90 backdrop-blur-md p-3 rounded-2xl border border-slate-700/80 text-right sm:text-right shrink-0">
                <div className="text-[10px] text-slate-400 font-semibold uppercase">Total Cashback Rate</div>
                <div className="text-2xl font-black text-amber-400 mt-0.5 flex items-baseline justify-end gap-1">
                  <span>{loyaltyStatus.totalCashbackPercentage}%</span>
                  <span className="text-xs font-bold text-cyan-300">TON</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Base {loyaltyStatus.baseCashbackPercentage}% + Bonus {loyaltyStatus.bonusPercentage.toFixed(1)}%
                </div>
              </div>
            </div>

            {/* 12-Month Stay Metrics & Progress */}
            <div className="pt-2 space-y-3 relative z-10 border-t border-slate-800/80">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-cyan-400" />
                  <span className="text-slate-300 font-semibold">
                    Completed in Last 12 Months: <strong className="text-white">{loyaltyStatus.completedLast12Months} stay(s)</strong>
                  </span>
                  {simulatedBonusStays > 0 && (
                    <span className="bg-cyan-500/20 text-cyan-300 text-[10px] px-2 py-0.5 rounded-full font-bold">
                      +{simulatedBonusStays} simulated
                    </span>
                  )}
                </div>

                {loyaltyStatus.nextTier ? (
                  <span className="text-slate-300 text-[11px]">
                    <strong className="text-amber-400">{loyaltyStatus.bookingsToNextTier} more stay(s)</strong> to unlock {loyaltyStatus.nextTier.displayName} (+{loyaltyStatus.nextTier.bonusPercentage}%)
                  </span>
                ) : (
                  <span className="text-emerald-400 font-extrabold text-[11px] flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Maximum VIP Tier Reached</span>
                  </span>
                )}
              </div>

              {/* Multi-step Visual Progress Bar */}
              <div className="space-y-1.5">
                <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 via-amber-400 to-purple-500 rounded-full transition-all duration-500 shadow-lg"
                    style={{
                      width: loyaltyStatus.nextTier
                        ? `${Math.max(12, ((loyaltyStatus.completedLast12Months) / (LOYALTY_TIERS.Jetsetter.minBookings)) * 100)}%`
                        : '100%'
                    }}
                  />
                </div>

                {/* Tier Milestone Step Markers */}
                <div className="grid grid-cols-4 text-[10px] text-center pt-1 font-bold">
                  <div className={loyaltyStatus.completedLast12Months >= 0 ? 'text-amber-300' : 'text-slate-600'}>
                    Explorer (0)
                  </div>
                  <div className={loyaltyStatus.completedLast12Months >= 2 ? 'text-cyan-300' : 'text-slate-600'}>
                    Voyager (2)
                  </div>
                  <div className={loyaltyStatus.completedLast12Months >= 5 ? 'text-amber-400' : 'text-slate-600'}>
                    Globetrotter (5)
                  </div>
                  <div className={loyaltyStatus.completedLast12Months >= 9 ? 'text-purple-300' : 'text-slate-600'}>
                    Jetsetter (9+)
                  </div>
                </div>
              </div>
            </div>

            {/* Active Tier Perks Checklist */}
            <div className="pt-2 relative z-10">
              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span>Your Active Tier Perks</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {loyaltyStatus.tier.perks.map((perk, i) => (
                  <div key={i} className="flex items-center gap-2 bg-slate-950/60 p-2 rounded-xl border border-slate-800 text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{perk}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Interactive Simulation Action Box */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div>
              <div className="font-bold text-white flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-cyan-400" />
                <span>Test Loyalty Tier Progression Simulator</span>
              </div>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Simulate completing bookings to test tier promotions (Voyager → Globetrotter → Diamond Jetsetter)
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleAddSimulatedStay}
                className="bg-gradient-to-r from-[#0088cc] to-cyan-600 hover:from-[#0077b3] hover:to-cyan-500 text-white font-bold px-3 py-1.5 rounded-xl shadow-md flex items-center gap-1.5 transition-all"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Add Stay (+1)</span>
              </button>

              {simulatedBonusStays > 0 && (
                <button
                  onClick={handleResetSimulatedStays}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-2.5 py-1.5 rounded-xl border border-slate-700 flex items-center gap-1 transition-all"
                  title="Reset to real booking history"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: ALL 4 TIERS MATRIX */}
      {activeTab === 'allTiers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tierKeys.map((key) => {
            const config = LOYALTY_TIERS[key];
            const isCurrent = loyaltyStatus.tier.name === key;

            return (
              <div
                key={key}
                className={`p-4 rounded-2xl border transition-all space-y-3 relative overflow-hidden ${
                  isCurrent
                    ? `${config.borderColor} bg-gradient-to-br ${config.gradientBg} ring-2 ring-cyan-400/50 shadow-lg`
                    : 'bg-slate-950 border-slate-800 opacity-90'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{config.icon}</span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-extrabold text-sm text-white">{config.displayName}</h4>
                        {isCurrent && (
                          <span className="bg-emerald-500/20 text-emerald-300 text-[9px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/40">
                            YOUR TIER
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {config.minBookings === 0
                          ? '0–1 stays / 12 mo'
                          : config.maxBookings
                          ? `${config.minBookings}–${config.maxBookings} stays / 12 mo`
                          : `${config.minBookings}+ stays / 12 mo`}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-black text-amber-400">
                      +{config.bonusPercentage}% BONUS
                    </div>
                    <div className="text-[10px] text-cyan-300">
                      Up to {(8 + config.bonusPercentage).toFixed(1)}% Back
                    </div>
                  </div>
                </div>

                <ul className="space-y-1.5 text-xs text-slate-300 pt-1 border-t border-slate-800/80">
                  {config.perks.map((p, idx) => (
                    <li key={idx} className="flex items-start gap-1.5 text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 3: REWARD ESTIMATOR / CALCULATOR */}
      {activeTab === 'calculator' && (
        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="font-bold text-sm text-white">Loyalty Bonus Cashback Estimator</h4>
              <p className="text-xs text-slate-400">
                See how much more TON you earn per trip as your Frequent Traveler tier climbs
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Stay Total:</span>
              <span className="text-base font-black text-white">${calcStayCostUsd} USD</span>
            </div>
          </div>

          {/* Preset Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {[350, 650, 850, 1400, 2500].map((amt) => (
              <button
                key={amt}
                onClick={() => setCalcStayCostUsd(amt)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                  calcStayCostUsd === amt
                    ? 'bg-[#0088cc] text-white shadow-md'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                ${amt}
              </button>
            ))}
          </div>

          {/* Comparison Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            {tierKeys.map((key) => {
              const config = LOYALTY_TIERS[key];
              const totalRate = userState.isTelegramPremium ? 8 + config.bonusPercentage : 5 + config.bonusPercentage;
              const cashbackUsd = (calcStayCostUsd * totalRate) / 100;
              const cashbackTon = cashbackUsd / userState.tonPriceUsd;
              const isCurrent = loyaltyStatus.tier.name === key;

              return (
                <div
                  key={key}
                  className={`p-3.5 rounded-xl border text-center space-y-1.5 transition-all ${
                    isCurrent
                      ? `${config.borderColor} bg-slate-900 ring-1 ring-cyan-400/40`
                      : 'bg-slate-900/60 border-slate-800'
                  }`}
                >
                  <div className="text-xs font-bold text-slate-300 flex items-center justify-center gap-1">
                    <span>{config.icon}</span>
                    <span>{config.name}</span>
                  </div>

                  <div className="text-[10px] text-cyan-300 font-semibold">
                    {totalRate.toFixed(1)}% Cashback
                  </div>

                  <div className="pt-1">
                    <div className="text-base font-black text-emerald-400">
                      +{cashbackTon.toFixed(2)} TON
                    </div>
                    <div className="text-[10px] text-slate-400">
                      ≈ ${cashbackUsd.toFixed(2)} USD
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};
