import { Booking, Hotel } from '../types';

export const ADMIN_EMAILS = [
  'rubelbank92@gmail.com',
  'rubels1k994@gmail.com'
] as const;

export type AdminEmail = (typeof ADMIN_EMAILS)[number];

/**
 * Checks if the given email is an authorized system administrator
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return ADMIN_EMAILS.some((admin) => admin.toLowerCase() === normalized);
}

export interface AdminStats {
  totalGrossVolumeUsd: number;
  totalGrossVolumeTon: number;
  totalCashbackDisbursedTon: number;
  totalCashbackDisbursedUsd: number;
  totalBookingsCount: number;
  confirmedBookingsCount: number;
  completedBookingsCount: number;
  cancelledBookingsCount: number;
  activeHotelsCount: number;
  telegramPremiumUsersPercent: number;
}

export function computeAdminStats(bookings: Booking[], hotelsCount: number, tonPriceUsd: number): AdminStats {
  const totalGrossVolumeUsd = bookings.reduce((sum, b) => sum + (b.totalPriceUsd || 0), 0);
  const totalGrossVolumeTon = bookings.reduce((sum, b) => sum + (b.totalPriceTon || 0), 0);
  const totalCashbackDisbursedTon = bookings.reduce((sum, b) => sum + (b.cashbackTon || 0), 0);
  const totalCashbackDisbursedUsd = totalCashbackDisbursedTon * tonPriceUsd;
  
  const confirmed = bookings.filter((b) => b.status === 'Confirmed').length;
  const completed = bookings.filter((b) => b.status === 'Completed').length;
  const cancelled = bookings.filter((b) => b.status === 'Cancelled').length;

  return {
    totalGrossVolumeUsd,
    totalGrossVolumeTon,
    totalCashbackDisbursedTon,
    totalCashbackDisbursedUsd,
    totalBookingsCount: bookings.length,
    confirmedBookingsCount: confirmed,
    completedBookingsCount: completed,
    cancelledBookingsCount: cancelled,
    activeHotelsCount: hotelsCount,
    telegramPremiumUsersPercent: 88
  };
}
