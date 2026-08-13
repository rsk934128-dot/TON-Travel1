import { Booking } from '../types';

export type LoyaltyTierLevel = 1 | 2 | 3 | 4;
export type LoyaltyTierName = 'Explorer' | 'Voyager' | 'Globetrotter' | 'Jetsetter';

export interface LoyaltyTierConfig {
  name: LoyaltyTierName;
  displayName: string;
  tierLevel: LoyaltyTierLevel;
  minBookings: number;
  maxBookings: number | null;
  bonusPercentage: number;
  badgeColor: string;
  gradientBg: string;
  borderColor: string;
  textColor: string;
  icon: string;
  tagline: string;
  perks: string[];
}

export interface LoyaltyTierStatus {
  tier: LoyaltyTierConfig;
  completedLast12Months: number;
  baseCashbackPercentage: number;
  bonusPercentage: number;
  totalCashbackPercentage: number;
  nextTier: LoyaltyTierConfig | null;
  bookingsToNextTier: number;
  progressPercent: number;
}

export const LOYALTY_TIERS: Record<LoyaltyTierName, LoyaltyTierConfig> = {
  Explorer: {
    name: 'Explorer',
    displayName: 'Bronze Explorer',
    tierLevel: 1,
    minBookings: 0,
    maxBookings: 1,
    bonusPercentage: 0.0,
    badgeColor: 'bg-amber-900/60 text-amber-200 border-amber-700/50',
    gradientBg: 'from-amber-950/40 via-slate-900 to-slate-950',
    borderColor: 'border-amber-700/40',
    textColor: 'text-amber-300',
    icon: '🧭',
    tagline: 'Standard Trailing 12-Month Tier',
    perks: [
      'Standard 5% / Premium 8% TON Cashback',
      'Non-custodial Telegram TON Space direct payouts',
      'Google Drive automatic voucher syncing',
      'Digital QR Check-in passes'
    ]
  },
  Voyager: {
    name: 'Voyager',
    displayName: 'Silver Voyager',
    tierLevel: 2,
    minBookings: 2,
    maxBookings: 4,
    bonusPercentage: 1.5,
    badgeColor: 'bg-cyan-950/80 text-cyan-200 border-cyan-500/50',
    gradientBg: 'from-cyan-950/50 via-slate-900 to-indigo-950/40',
    borderColor: 'border-cyan-500/40',
    textColor: 'text-cyan-300',
    icon: '✈️',
    tagline: '+1.5% Bonus TON Cashback Booster',
    perks: [
      '+1.5% Bonus TON Cashback Booster on all stays',
      'Priority hotel booking confirmation queue',
      'Express hotel digital check-in routing',
      'Extended 24-hour price alert lock'
    ]
  },
  Globetrotter: {
    name: 'Globetrotter',
    displayName: 'Gold Globetrotter',
    tierLevel: 3,
    minBookings: 5,
    maxBookings: 8,
    bonusPercentage: 3.0,
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-400/60',
    gradientBg: 'from-amber-950/60 via-slate-900 to-purple-950/50',
    borderColor: 'border-amber-400/50',
    textColor: 'text-amber-400',
    icon: '🌍',
    tagline: '+3.0% Bonus TON Cashback Booster',
    perks: [
      '+3.0% Bonus TON Cashback Booster on all stays',
      'Complimentary early check-in & late checkout (subject to availability)',
      'Free room category upgrade priority',
      'Dedicated Telegram VIP concierge support'
    ]
  },
  Jetsetter: {
    name: 'Jetsetter',
    displayName: 'Diamond Jetsetter',
    tierLevel: 4,
    minBookings: 9,
    maxBookings: null,
    bonusPercentage: 5.0,
    badgeColor: 'bg-gradient-to-r from-purple-500/30 to-pink-500/30 text-purple-200 border-purple-400/60',
    gradientBg: 'from-purple-950/70 via-slate-900 to-pink-950/60',
    borderColor: 'border-purple-400/60',
    textColor: 'text-purple-300',
    icon: '💎',
    tagline: '+5.0% Maximum TON Cashback Booster (Up to 13% Back!)',
    perks: [
      '+5.0% Maximum Lifetime TON Booster (Up to 13% total with Telegram Premium)',
      'Zero network fee on all TON crypto withdrawals',
      'Guaranteed late checkout & luxury welcome amenity',
      'Direct 1-on-1 VIP travel concierge in Telegram'
    ]
  }
};

/**
 * Filter bookings completed or confirmed in the trailing 12 months (365 days).
 */
export function getBookingsLast12Months(bookings: Booking[]): Booking[] {
  const now = new Date();
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setFullYear(now.getFullYear() - 1);

  return bookings.filter((b) => {
    if (b.status === 'Cancelled') return false;
    
    // Parse bookingDate or checkIn
    const rawDate = b.bookingDate || b.checkIn;
    if (!rawDate) return true; // default include

    const parsed = new Date(rawDate);
    if (isNaN(parsed.getTime())) return true;

    return parsed >= twelveMonthsAgo;
  });
}

/**
 * Calculate the user's Frequent Traveler Loyalty Tier based on trailing 12-month stays.
 */
export function calculateLoyaltyTier(
  bookings: Booking[],
  isTelegramPremium: boolean,
  manualStayCountBonus: number = 0
): LoyaltyTierStatus {
  const recentBookings = getBookingsLast12Months(bookings);
  const completedLast12Months = recentBookings.length + manualStayCountBonus;

  let tier: LoyaltyTierConfig;
  let nextTier: LoyaltyTierConfig | null = null;
  let bookingsToNextTier = 0;
  let progressPercent = 100;

  if (completedLast12Months >= LOYALTY_TIERS.Jetsetter.minBookings) {
    tier = LOYALTY_TIERS.Jetsetter;
    nextTier = null;
    bookingsToNextTier = 0;
    progressPercent = 100;
  } else if (completedLast12Months >= LOYALTY_TIERS.Globetrotter.minBookings) {
    tier = LOYALTY_TIERS.Globetrotter;
    nextTier = LOYALTY_TIERS.Jetsetter;
    bookingsToNextTier = LOYALTY_TIERS.Jetsetter.minBookings - completedLast12Months;
    const range = LOYALTY_TIERS.Jetsetter.minBookings - LOYALTY_TIERS.Globetrotter.minBookings;
    const current = completedLast12Months - LOYALTY_TIERS.Globetrotter.minBookings;
    progressPercent = Math.min(100, Math.round((current / range) * 100));
  } else if (completedLast12Months >= LOYALTY_TIERS.Voyager.minBookings) {
    tier = LOYALTY_TIERS.Voyager;
    nextTier = LOYALTY_TIERS.Globetrotter;
    bookingsToNextTier = LOYALTY_TIERS.Globetrotter.minBookings - completedLast12Months;
    const range = LOYALTY_TIERS.Globetrotter.minBookings - LOYALTY_TIERS.Voyager.minBookings;
    const current = completedLast12Months - LOYALTY_TIERS.Voyager.minBookings;
    progressPercent = Math.min(100, Math.round((current / range) * 100));
  } else {
    tier = LOYALTY_TIERS.Explorer;
    nextTier = LOYALTY_TIERS.Voyager;
    bookingsToNextTier = LOYALTY_TIERS.Voyager.minBookings - completedLast12Months;
    const range = LOYALTY_TIERS.Voyager.minBookings;
    progressPercent = Math.min(100, Math.round((completedLast12Months / range) * 100));
  }

  const baseCashbackPercentage = isTelegramPremium ? 8.0 : 5.0;
  const bonusPercentage = tier.bonusPercentage;
  const totalCashbackPercentage = Number((baseCashbackPercentage + bonusPercentage).toFixed(1));

  return {
    tier,
    completedLast12Months,
    baseCashbackPercentage,
    bonusPercentage,
    totalCashbackPercentage,
    nextTier,
    bookingsToNextTier,
    progressPercent
  };
}
