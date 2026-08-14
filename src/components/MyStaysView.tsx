import React, { useState } from 'react';
import { Booking, UserState } from '../types';
import { Luggage, Calendar, Cloud, ExternalLink, CheckCircle, Sparkles, Loader2, ArrowUpRight, ShieldCheck, Award, Mail } from 'lucide-react';
import { saveBookingReceiptToDrive, requestDriveAuthToken } from '../services/driveService';
import { AddToCalendarDropdown } from './AddToCalendarDropdown';
import { calculateLoyaltyTier } from '../utils/loyalty';
import { formatFiatEstimate } from '../utils/currency';
import { useLanguage } from '../utils/i18n';
import appLogo from '../assets/images/ton_travel_logo_1786647813598.jpg';

interface MyStaysViewProps {
  bookings: Booking[];
  userState: UserState;
  selectedCurrency?: string;
  rates?: Record<string, number>;
  onDriveAuth: () => void;
  onUpdateBookingDriveStatus: (bookingId: string, driveFileId: string, driveUrl: string) => void;
  onNavigateToGmail?: () => void;
}

export const MyStaysView: React.FC<MyStaysViewProps> = ({
  bookings,
  userState,
  selectedCurrency = 'USD',
  rates = {},
  onDriveAuth,
  onUpdateBookingDriveStatus,
  onNavigateToGmail
}) => {
  const { t } = useLanguage();
  const [exportingId, setExportingId] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const showFiat = selectedCurrency !== 'USD';
  const loyaltyStatus = calculateLoyaltyTier(bookings, userState.isTelegramPremium);

  const handleExportToDrive = async (booking: Booking) => {
    setExportingId(booking.id);
    setExportError(null);

    try {
      let accessToken = userState.googleDriveToken;

      if (!accessToken) {
        const auth = await requestDriveAuthToken();
        accessToken = auth.token;
      }

      const res = await saveBookingReceiptToDrive(booking, accessToken);
      onUpdateBookingDriveStatus(booking.id, res.fileId, res.webViewLink);
    } catch (err: any) {
      console.error('Drive Export Error:', err);
      setExportError(err?.message || 'Failed to sync voucher to Google Drive');
    } finally {
      setExportingId(null);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Luggage className="w-6 h-6 text-[#0088cc]" />
            <span>{t('stays.title')}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {t('stays.subtitle')}
          </p>
        </div>

        <button
          onClick={onDriveAuth}
          className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all flex items-center gap-1.5 ${
            userState.googleDriveToken
              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
          }`}
        >
          <Cloud className="w-3.5 h-3.5 text-emerald-400" />
          <span>{userState.googleDriveToken ? t('header.drive_connected') : t('header.sync_drive')}</span>
        </button>
      </div>

      {/* Loyalty Status Callout in My Stays */}
      <div className={`p-4 rounded-2xl border ${loyaltyStatus.tier.borderColor} bg-gradient-to-r ${loyaltyStatus.tier.gradientBg} flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-950/80 border border-slate-700/60 flex items-center justify-center text-xl shadow-inner">
            {loyaltyStatus.tier.icon}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-white text-sm">{loyaltyStatus.tier.displayName}</span>
              <span className="text-[10px] bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full font-bold">
                {loyaltyStatus.totalCashbackPercentage}% Cashback Rate
              </span>
            </div>
            <p className="text-slate-400 text-[11px] mt-0.5">
              {loyaltyStatus.completedLast12Months} stay(s) in trailing 12 months • {loyaltyStatus.nextTier ? `${loyaltyStatus.bookingsToNextTier} more to ${loyaltyStatus.nextTier.displayName}` : 'Top Tier Reached'}
            </p>
          </div>
        </div>

        {loyaltyStatus.bonusPercentage > 0 && (
          <div className="bg-slate-950/80 px-3 py-1.5 rounded-xl border border-amber-500/30 text-amber-300 font-bold self-start sm:self-auto">
            +{loyaltyStatus.bonusPercentage}% Loyalty Booster Active
          </div>
        )}
      </div>

      {exportError && (
        <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-300 rounded-xl text-xs">
          {exportError}
        </div>
      )}

      {/* Bookings List */}
      {bookings.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 text-center space-y-3">
          <div className="relative inline-block mx-auto">
            <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-2xl mx-auto ring-2 ring-cyan-500/30">
              <img
                src={appLogo}
                alt="TON Travel"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <h3 className="font-extrabold text-white text-base">{t('stays.no_stays')}</h3>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            {t('stays.no_stays_desc')}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => (
            <div
              key={b.id}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4 transition-all hover:border-slate-700"
            >
              {/* Top Row: Hotel & Status */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <img
                    src={b.hotelImage}
                    alt={b.hotelName}
                    className="w-14 h-14 rounded-2xl object-cover shrink-0"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-white text-base">{b.hotelName}</h3>
                      <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                        {b.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{b.hotelLocation} • {b.roomName}</p>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <div className="text-xs text-slate-400">Reference Number</div>
                  <div className="font-mono font-bold text-white text-sm">{b.id}</div>
                </div>
              </div>

              {/* Middle Row: Details Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-950 p-3 rounded-2xl border border-slate-800/80">
                <div>
                  <div className="text-slate-500 text-[10px] uppercase font-bold">Check-In / Out</div>
                  <div className="font-bold text-white mt-0.5">{b.checkIn}</div>
                  <div className="text-[11px] text-slate-400">{b.nights} night(s)</div>
                </div>

                <div>
                  <div className="text-slate-500 text-[10px] uppercase font-bold">Total Paid</div>
                  <div className="font-extrabold text-white mt-0.5">${b.totalPriceUsd}</div>
                  <div className="text-[11px] text-cyan-400">
                    ≈ {b.totalPriceTon.toFixed(2)} TON
                    {showFiat && <span className="text-amber-300 ml-1">({formatFiatEstimate(b.totalPriceUsd, selectedCurrency, rates)})</span>}
                  </div>
                </div>

                <div>
                  <div className="text-slate-500 text-[10px] uppercase font-bold">TON Cashback</div>
                  <div className="font-black text-emerald-400 mt-0.5">+{b.cashbackTon.toFixed(3)} TON</div>
                  <div className="text-[11px] text-slate-400">
                    ({b.cashbackPercentage}% {showFiat && `• ≈ ${formatFiatEstimate(b.cashbackUsd, selectedCurrency, rates)}`})
                  </div>
                </div>

                <div>
                  <div className="text-slate-500 text-[10px] uppercase font-bold">Guest</div>
                  <div className="font-bold text-white mt-0.5 truncate">{b.guestName}</div>
                  <div className="text-[11px] text-slate-400 truncate">{b.guestEmail}</div>
                </div>
              </div>

              {/* Bottom Row: Google Drive Sync Status */}
              <div className="pt-1 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  <span>Paid via <strong className="text-white">{b.paymentMethod}</strong></span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Calendar Integration Dropdown */}
                  <AddToCalendarDropdown booking={b} variant="compact" />

                  {onNavigateToGmail && (
                    <button
                      onClick={onNavigateToGmail}
                      className="inline-flex items-center gap-1.5 bg-red-950/60 hover:bg-red-900/60 text-red-300 font-bold px-3 py-1.5 rounded-xl border border-red-800/60 transition-all shadow-sm"
                      title="Open Gmail Travel Hub to send or check vouchers"
                    >
                      <Mail className="w-3.5 h-3.5 text-red-400" />
                      <span>Send to Gmail</span>
                    </button>
                  )}

                  {b.driveFileUrl ? (
                    <a
                      href={b.driveFileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 bg-emerald-950/80 hover:bg-emerald-900/80 text-emerald-300 font-bold px-3 py-1.5 rounded-xl border border-emerald-800/80 transition-all"
                    >
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Saved in Drive</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <button
                      onClick={() => handleExportToDrive(b)}
                      disabled={exportingId === b.id}
                      className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3.5 py-1.5 rounded-xl shadow-md transition-all disabled:opacity-50"
                    >
                      {exportingId === b.id ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Syncing...</span>
                        </>
                      ) : (
                        <>
                          <Cloud className="w-3.5 h-3.5" />
                          <span>{t('stays.export_drive')}</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};

