import React, { useState, useEffect } from 'react';
import { UserState } from '../types';
import {
  DAILY_REWARD_SCHEDULE,
  DailyRewardsState,
  loadDailyRewardsState,
  saveDailyRewardsState,
  getCooldownStatus,
  calculateRewardForDay,
  COOLDOWN_MS,
  STREAK_GRACE_MS
} from '../utils/dailyRewards';
import {
  Gift,
  Flame,
  Clock,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  Zap,
  RotateCcw,
  FastForward,
  Award,
  History,
  TrendingUp
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface DailyRewardsCardProps {
  userState: UserState;
  onRewardClaimed: (amountTon: number) => void;
  compact?: boolean;
}

export const DailyRewardsCard: React.FC<DailyRewardsCardProps> = ({
  userState,
  onRewardClaimed,
  compact = false
}) => {
  const [rewardsState, setRewardsState] = useState<DailyRewardsState>(() => loadDailyRewardsState());
  const [now, setNow] = useState<number>(Date.now());
  const [justClaimedAmount, setJustClaimedAmount] = useState<number | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  // Update timer every second for accurate countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const cooldown = getCooldownStatus(rewardsState.lastClaimedTimestamp, now);

  // Determine current reward day (if streak broke, reset display)
  let activeStreakDay = rewardsState.currentStreakDay;
  if (
    rewardsState.lastClaimedTimestamp &&
    now - rewardsState.lastClaimedTimestamp > STREAK_GRACE_MS
  ) {
    activeStreakDay = 1;
  }

  const currentDayReward = calculateRewardForDay(activeStreakDay, userState.isTelegramPremium);

  // Collect Bonus Handler
  const handleCollectBonus = () => {
    if (!cooldown.canClaim) return;

    const currentTimestamp = Date.now();
    let nextStreakDay = 1;

    if (rewardsState.lastClaimedTimestamp) {
      const elapsed = currentTimestamp - rewardsState.lastClaimedTimestamp;
      if (elapsed <= STREAK_GRACE_MS) {
        // Streak preserved, advance by 1
        nextStreakDay = rewardsState.currentStreakDay >= 7 ? 1 : rewardsState.currentStreakDay + 1;
      } else {
        // Broken streak
        nextStreakDay = 2; // claimed day 1, next is day 2
      }
    } else {
      nextStreakDay = 2;
    }

    const reward = calculateRewardForDay(activeStreakDay, userState.isTelegramPremium);
    const amountTon = reward.totalTon;

    const newHistoryItem = {
      timestamp: currentTimestamp,
      day: activeStreakDay,
      amountTon,
      isPremiumBonus: userState.isTelegramPremium
    };

    const updatedState: DailyRewardsState = {
      lastClaimedTimestamp: currentTimestamp,
      currentStreakDay: nextStreakDay,
      totalTonCollected: Number((rewardsState.totalTonCollected + amountTon).toFixed(3)),
      totalClaimsCount: rewardsState.totalClaimsCount + 1,
      history: [newHistoryItem, ...rewardsState.history.slice(0, 9)]
    };

    setRewardsState(updatedState);
    saveDailyRewardsState(updatedState);
    onRewardClaimed(amountTon);
    setJustClaimedAmount(amountTon);

    // Confetti celebration
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#0088cc', '#38bdf8', '#fbbf24', '#a855f7']
      });
    } catch (e) {
      console.warn(e);
    }

    setTimeout(() => {
      setJustClaimedAmount(null);
    }, 4000);
  };

  // Test simulation: Fast Forward 24 Hours
  const handleSimulateFastForward = () => {
    if (!rewardsState.lastClaimedTimestamp) return;
    const fakePastTime = Date.now() - COOLDOWN_MS - 1000;
    const simulatedState = {
      ...rewardsState,
      lastClaimedTimestamp: fakePastTime
    };
    setRewardsState(simulatedState);
    saveDailyRewardsState(simulatedState);
  };

  // Test simulation: Reset All Daily Rewards
  const handleResetRewards = () => {
    const freshState: DailyRewardsState = {
      lastClaimedTimestamp: null,
      currentStreakDay: 1,
      totalTonCollected: 0,
      totalClaimsCount: 0,
      history: []
    };
    setRewardsState(freshState);
    saveDailyRewardsState(freshState);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5 relative overflow-hidden">
      
      {/* Decorative ambient background glow */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between gap-3 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 flex items-center justify-center text-2xl shadow-lg shadow-amber-500/20 text-white shrink-0">
            <Gift className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-white">Daily Rewards</h3>
              <span className="bg-amber-400/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-400/30 flex items-center gap-1">
                <Flame className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span>Day {activeStreakDay} Streak</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Check in every 24 hours to collect bonus TON rewards directly to your wallet
            </p>
          </div>
        </div>

        {/* Claim status badge */}
        <div className="hidden sm:flex flex-col items-end">
          {cooldown.canClaim ? (
            <span className="bg-emerald-500/20 text-emerald-300 text-xs font-black px-3 py-1 rounded-full border border-emerald-500/40 flex items-center gap-1 animate-pulse">
              <Sparkles className="w-3 h-3" />
              <span>Ready to Collect</span>
            </span>
          ) : (
            <span className="bg-slate-800 text-slate-300 text-xs font-mono font-bold px-3 py-1 rounded-full border border-slate-700 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>{cooldown.formattedTimer}</span>
            </span>
          )}
        </div>
      </div>

      {/* 7-Day Interactive Streak Roadmap */}
      <div className="space-y-2 relative z-10">
        <div className="flex items-center justify-between text-xs text-slate-400 font-semibold px-1">
          <span>7-Day Progression Track</span>
          <span className="text-cyan-300">
            Total Earned: <strong className="text-amber-400 font-black">+{rewardsState.totalTonCollected.toFixed(2)} TON</strong>
          </span>
        </div>

        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {DAILY_REWARD_SCHEDULE.map((item) => {
            const isCompleted = item.day < activeStreakDay || (item.day === activeStreakDay && !cooldown.canClaim);
            const isCurrent = item.day === activeStreakDay;
            const isMilestone = item.isMilestone;
            const rewardPreview = calculateRewardForDay(item.day, userState.isTelegramPremium);

            return (
              <div
                key={item.day}
                className={`relative rounded-2xl p-2 sm:p-2.5 text-center flex flex-col items-center justify-between border transition-all duration-300 ${
                  isCurrent && cooldown.canClaim
                    ? 'bg-gradient-to-b from-amber-500/30 to-amber-950/60 border-amber-400/80 ring-2 ring-amber-400/40 shadow-lg shadow-amber-500/20 scale-[1.03]'
                    : isCurrent && !cooldown.canClaim
                    ? 'bg-gradient-to-b from-cyan-950/50 to-slate-900 border-cyan-500/50'
                    : isCompleted
                    ? 'bg-slate-950/80 border-emerald-500/40 text-slate-400'
                    : 'bg-slate-950/60 border-slate-800 text-slate-500'
                }`}
              >
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  D{item.day}
                </div>

                <div className="my-1 text-xl sm:text-2xl">
                  {isCompleted ? (
                    <div className="w-7 h-7 mx-auto rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-sm border border-emerald-500/40">
                      ✓
                    </div>
                  ) : (
                    <span>{item.icon}</span>
                  )}
                </div>

                <div className="text-[10px] sm:text-[11px] font-black leading-tight text-amber-300">
                  +{rewardPreview.totalTon}
                </div>

                {isMilestone && (
                  <span className="absolute -top-1.5 -right-1 bg-gradient-to-r from-purple-500 to-pink-500 text-[8px] text-white font-extrabold px-1 rounded-full shadow-sm">
                    JACKPOT
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 24-Hour Cooldown Progress Bar & Timer */}
      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3 relative z-10">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span className="font-semibold">
              24-Hour Cycle Status:
            </span>
          </div>

          <div className="text-right">
            {cooldown.canClaim ? (
              <span className="text-emerald-400 font-extrabold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Ready to Claim</span>
              </span>
            ) : (
              <div className="flex items-center gap-1.5 font-mono text-cyan-300 font-black">
                <span>Next Bonus in:</span>
                <span className="bg-cyan-950/80 px-2 py-0.5 rounded-lg border border-cyan-800 text-cyan-200">
                  {cooldown.formattedTimer}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div className="space-y-1">
          <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-500 shadow-lg ${
                cooldown.canClaim
                  ? 'bg-gradient-to-r from-emerald-400 via-cyan-400 to-amber-400 animate-pulse'
                  : 'bg-gradient-to-r from-cyan-600 to-[#0088cc]'
              }`}
              style={{
                width: `${cooldown.progressPercent}%`
              }}
            />
          </div>

          <div className="flex justify-between items-center text-[10px] text-slate-500 font-semibold px-0.5">
            <span>0h (Claimed)</span>
            <span>{cooldown.progressPercent.toFixed(0)}% Elapsed</span>
            <span>24h (Ready)</span>
          </div>
        </div>
      </div>

      {/* Main Collect Action Button */}
      <div className="space-y-2 relative z-10">
        <button
          id="collect-daily-bonus-btn"
          onClick={handleCollectBonus}
          disabled={!cooldown.canClaim}
          className={`w-full py-4 px-6 rounded-2xl font-black text-sm sm:text-base flex items-center justify-center gap-3 transition-all duration-300 shadow-xl ${
            cooldown.canClaim
              ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-white cursor-pointer hover:shadow-amber-500/30 hover:scale-[1.01] active:scale-[0.99] ring-2 ring-amber-400/50 animate-bounce'
              : 'bg-slate-800/80 text-slate-400 border border-slate-700/60 cursor-not-allowed'
          }`}
        >
          {cooldown.canClaim ? (
            <>
              <Gift className="w-5 h-5 text-white animate-pulse" />
              <span>Collect Daily Bonus (+{currentDayReward.totalTon} TON)</span>
              <Sparkles className="w-4 h-4 text-amber-200 fill-amber-200" />
            </>
          ) : (
            <>
              <Clock className="w-5 h-5 text-cyan-400" />
              <span>Bonus Locked — Next in {cooldown.formattedTimer}</span>
            </>
          )}
        </button>

        {/* Telegram Premium Booster Tag */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
          <div className="flex items-center gap-1">
            <span>💡</span>
            {userState.isTelegramPremium ? (
              <span className="text-purple-300 font-semibold">
                👑 <strong>+25% Telegram Premium Daily Booster</strong> applied!
              </span>
            ) : (
              <span>
                Standard daily rate. Upgrade to Premium for +25% bonus TON!
              </span>
            )}
          </div>

          <button
            onClick={() => setShowHistory(!showHistory)}
            className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 transition-colors"
          >
            <History className="w-3 h-3" />
            <span>{showHistory ? 'Hide History' : 'Claims Log'}</span>
          </button>
        </div>
      </div>

      {/* Instant Reward Banner Flash on Claim */}
      {justClaimedAmount !== null && (
        <div className="bg-emerald-950/90 border border-emerald-500/60 p-3 rounded-2xl text-center space-y-1 animate-in fade-in duration-300">
          <div className="text-sm font-extrabold text-emerald-300 flex items-center justify-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300" />
            <span>Success! Collected +{justClaimedAmount} TON Daily Bonus</span>
          </div>
          <p className="text-xs text-slate-300">
            Deposited instantly to your non-custodial TON Space balance ({userState.tonBalance.toFixed(2)} TON).
          </p>
        </div>
      )}

      {/* Claims History Log Drawer */}
      {showHistory && (
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2.5 text-xs animate-in fade-in">
          <div className="flex items-center justify-between font-bold text-slate-300">
            <span>Recent Daily Reward Claims</span>
            <span className="text-[10px] text-slate-500">{rewardsState.totalClaimsCount} total claim(s)</span>
          </div>

          {rewardsState.history.length === 0 ? (
            <p className="text-slate-500 text-center py-2 text-[11px]">No claims recorded yet. Hit Collect Daily Bonus above!</p>
          ) : (
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {rewardsState.history.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <span className="text-amber-400 font-bold">Day {item.day}</span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(item.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="font-mono font-bold text-emerald-400">
                    +{item.amountTon} TON
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Testing / Simulator Controls */}
      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
        <span>⏱️ Dev Testing Controls:</span>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSimulateFastForward}
            className="hover:text-cyan-300 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800 flex items-center gap-1 transition-colors"
            title="Fast forward 24 hours to test collection immediately"
          >
            <FastForward className="w-3 h-3 text-cyan-400" />
            <span>Fast-Forward 24h</span>
          </button>
          <button
            onClick={handleResetRewards}
            className="hover:text-amber-300 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800 flex items-center gap-1 transition-colors"
            title="Reset daily rewards to Day 1"
          >
            <RotateCcw className="w-3 h-3 text-amber-400" />
            <span>Reset</span>
          </button>
        </div>
      </div>

    </div>
  );
};
