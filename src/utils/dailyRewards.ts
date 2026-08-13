export interface DailyRewardDay {
  day: number;
  baseTon: number;
  label: string;
  icon: string;
  isMilestone?: boolean;
}

export const DAILY_REWARD_SCHEDULE: DailyRewardDay[] = [
  { day: 1, baseTon: 0.05, label: 'Day 1', icon: '🌱' },
  { day: 2, baseTon: 0.08, label: 'Day 2', icon: '⚡' },
  { day: 3, baseTon: 0.12, label: 'Day 3', icon: '🔥' },
  { day: 4, baseTon: 0.18, label: 'Day 4', icon: '🚀' },
  { day: 5, baseTon: 0.25, label: 'Day 5', icon: '🌟' },
  { day: 6, baseTon: 0.35, label: 'Day 6', icon: '👑' },
  { day: 7, baseTon: 0.50, label: 'Day 7', icon: '💎', isMilestone: true },
];

export const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours
export const STREAK_GRACE_MS = 48 * 60 * 60 * 1000; // 48 hours to preserve streak

export interface DailyRewardsState {
  lastClaimedTimestamp: number | null;
  currentStreakDay: number; // 1 to 7
  totalTonCollected: number;
  totalClaimsCount: number;
  history: Array<{
    timestamp: number;
    day: number;
    amountTon: number;
    isPremiumBonus: boolean;
  }>;
}

const STORAGE_KEY = 'telegram_travel_daily_rewards_v1';

export function loadDailyRewardsState(): DailyRewardsState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load daily rewards state', e);
  }

  // Default state: never claimed, or ready to claim Day 1
  return {
    lastClaimedTimestamp: null,
    currentStreakDay: 1,
    totalTonCollected: 0,
    totalClaimsCount: 0,
    history: []
  };
}

export function saveDailyRewardsState(state: DailyRewardsState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save daily rewards state', e);
  }
}

export interface CooldownStatus {
  canClaim: boolean;
  msRemaining: number;
  hours: number;
  minutes: number;
  seconds: number;
  formattedTimer: string;
  progressPercent: number; // 0 to 100% of 24h elapsed
}

export function getCooldownStatus(lastClaimedTimestamp: number | null, now: number = Date.now()): CooldownStatus {
  if (!lastClaimedTimestamp) {
    return {
      canClaim: true,
      msRemaining: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      formattedTimer: '00:00:00',
      progressPercent: 100
    };
  }

  const elapsed = now - lastClaimedTimestamp;

  if (elapsed >= COOLDOWN_MS) {
    return {
      canClaim: true,
      msRemaining: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      formattedTimer: '00:00:00',
      progressPercent: 100
    };
  }

  const msRemaining = COOLDOWN_MS - elapsed;
  const totalSecs = Math.floor(msRemaining / 1000);
  const hours = Math.floor(totalSecs / 3600);
  const minutes = Math.floor((totalSecs % 3600) / 60);
  const seconds = totalSecs % 60;

  const formattedTimer = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const progressPercent = Math.min(100, Math.max(0, (elapsed / COOLDOWN_MS) * 100));

  return {
    canClaim: false,
    msRemaining,
    hours,
    minutes,
    seconds,
    formattedTimer,
    progressPercent
  };
}

export function calculateRewardForDay(dayNumber: number, isTelegramPremium: boolean): {
  baseTon: number;
  premiumBonusTon: number;
  totalTon: number;
} {
  const index = Math.max(0, Math.min(DAILY_REWARD_SCHEDULE.length - 1, dayNumber - 1));
  const baseTon = DAILY_REWARD_SCHEDULE[index].baseTon;
  const premiumMultiplier = isTelegramPremium ? 0.25 : 0; // +25% extra for Telegram Premium members
  const premiumBonusTon = Number((baseTon * premiumMultiplier).toFixed(3));
  const totalTon = Number((baseTon + premiumBonusTon).toFixed(3));

  return {
    baseTon,
    premiumBonusTon,
    totalTon
  };
}
