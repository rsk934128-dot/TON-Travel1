import React, { useState } from 'react';
import { Hotel, RoomOption, PaymentMethod, Booking, UserState } from '../types';
import { X, Calendar, Users, Wallet, CreditCard, Sparkles, CheckCircle2, Cloud, ExternalLink, Loader2, ShieldCheck, Globe, CalendarPlus } from 'lucide-react';
import confetti from 'canvas-confetti';
import { saveBookingReceiptToDrive, requestDriveAuthToken } from '../services/driveService';
import { AddToCalendarDropdown } from './AddToCalendarDropdown';
import { formatFiatEstimate, getCurrencyInfo, formatFiat } from '../utils/currency';

interface BookingCheckoutModalProps {
  hotel: Hotel | null;
  room: RoomOption | null;
  userState: UserState;
  loyaltyBonusPercentage?: number;
  loyaltyTierName?: string;
  loyaltyTierDisplayName?: string;
  selectedCurrency?: string;
  rates?: Record<string, number>;
  onClose: () => void;
  onBookingComplete: (newBooking: Booking) => void;
  onConnectWallet: () => void;
}

export const BookingCheckoutModal: React.FC<BookingCheckoutModalProps> = ({
  hotel,
  room,
  userState,
  loyaltyBonusPercentage = 0,
  loyaltyTierName = 'Explorer',
  loyaltyTierDisplayName = 'Bronze Explorer',
  selectedCurrency = 'USD',
  rates = {},
  onClose,
  onBookingComplete,
  onConnectWallet
}) => {
  if (!hotel || !room) return null;

  const showFiat = selectedCurrency !== 'USD';

  // Default dates: tomorrow check-in, 3 days stay
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const checkout = new Date(tomorrow);
  checkout.setDate(checkout.getDate() + 3);

  const formatDateStr = (d: Date) => d.toISOString().split('T')[0];

  const [checkIn, setCheckIn] = useState(formatDateStr(tomorrow));
  const [checkOut, setCheckOut] = useState(formatDateStr(checkout));
  const [guests, setGuests] = useState(2);
  const [guestName, setGuestName] = useState(userState.userProfile.name || 'Alex Morgan');
  const [guestEmail, setGuestEmail] = useState('alex.morgan@telegram.me');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('TON');

  // Booking states
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);

  // Google Drive export state
  const [isExportingDrive, setIsExportingDrive] = useState(false);
  const [driveResult, setDriveResult] = useState<{ url: string; id: string } | null>(null);
  const [driveError, setDriveError] = useState<string | null>(null);

  // Calculate nights & totals
  const dIn = new Date(checkIn);
  const dOut = new Date(checkOut);
  const nights = Math.max(1, Math.round((dOut.getTime() - dIn.getTime()) / (1000 * 3600 * 24)));

  const totalPriceUsd = room.pricePerNightUsd * nights;
  const totalPriceTon = totalPriceUsd / userState.tonPriceUsd;

  const basePercentage = userState.isTelegramPremium ? 8 : 5;
  const cashbackPercentage = basePercentage + loyaltyBonusPercentage;
  const cashbackUsd = (totalPriceUsd * cashbackPercentage) / 100;
  const cashbackTon = cashbackUsd / userState.tonPriceUsd;

  const loyaltyBonusUsd = (totalPriceUsd * loyaltyBonusPercentage) / 100;
  const loyaltyBonusTon = loyaltyBonusUsd / userState.tonPriceUsd;

  const totalFiat = formatFiatEstimate(totalPriceUsd, selectedCurrency, rates);
  const cashbackFiat = formatFiatEstimate(cashbackUsd, selectedCurrency, rates);

  const handlePayAndBook = async () => {
    if (!userState.connectedWallet && paymentMethod !== 'CARD') {
      onConnectWallet();
      return;
    }

    setIsProcessing(true);

    // Call server API route for Stripe Payment Intent if paymentMethod is CARD
    if (paymentMethod === 'CARD') {
      try {
        const res = await fetch('/api/create-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amountUsd: totalPriceUsd,
            hotelName: hotel.name,
            roomName: room.name
          })
        });
        const data = await res.json();
        console.log('Stripe Payment Intent Result:', data);
      } catch (err) {
        console.warn('Stripe checkout error:', err);
      }
    }

    setTimeout(() => {
      setIsProcessing(false);

      const bookingId = 'TON-' + Math.floor(100000 + Math.random() * 900000);
      const walletAddress = userState.connectedWallet || 'EQB...5x9a_TonSpace_Wallet';

      const newBooking: Booking = {
        id: bookingId,
        hotelId: hotel.id,
        hotelName: hotel.name,
        hotelLocation: `${hotel.city}, ${hotel.country}`,
        hotelImage: hotel.images[0],
        roomName: room.name,
        checkIn,
        checkOut,
        nights,
        guests,
        totalPriceUsd,
        totalPriceTon,
        paymentMethod,
        cashbackPercentage,
        cashbackTon,
        cashbackUsd,
        status: 'Confirmed',
        bookingDate: new Date().toLocaleDateString(),
        userWallet: walletAddress,
        guestName,
        guestEmail,
        transactionHash: '0x' + Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
        loyaltyBonusTon: Number(loyaltyBonusTon.toFixed(3)),
        loyaltyTierAtBooking: loyaltyTierDisplayName
      };

      setConfirmedBooking(newBooking);
      onBookingComplete(newBooking);

      // Confetti celebration
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {
        // ignore fallback
      }
    }, 1800);
  };

  const handleExportToGoogleDrive = async () => {
    if (!confirmedBooking) return;

    setIsExportingDrive(true);
    setDriveError(null);

    try {
      let accessToken = userState.googleDriveToken;

      if (!accessToken) {
        const auth = await requestDriveAuthToken();
        accessToken = auth.token;
      }

      const res = await saveBookingReceiptToDrive(confirmedBooking, accessToken);
      setDriveResult({ url: res.webViewLink, id: res.fileId });
    } catch (err: any) {
      console.error('Drive export error:', err);
      setDriveError(err?.message || 'Failed to export booking voucher to Google Drive.');
    } finally {
      setIsExportingDrive(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg max-h-[94vh] overflow-y-auto shadow-2xl relative flex flex-col text-slate-100 my-auto">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/95 backdrop-blur-md z-10">
          <div>
            <h2 className="text-lg font-extrabold text-white">
              {confirmedBooking ? '🎉 Reservation Confirmed!' : 'Checkout & Earn Cashback'}
            </h2>
            <p className="text-xs text-slate-400">
              {confirmedBooking ? `Booking Reference: ${confirmedBooking.id}` : `${hotel.name} • ${room.name}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5">
          {confirmedBooking ? (
            /* Confirmation Screen */
            <div className="space-y-5 text-center">
              <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/40 animate-pulse">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <h3 className="text-xl font-extrabold text-white">You're going to {hotel.city}!</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Confirmation voucher has been sent to <strong>{guestEmail}</strong>.
                </p>
              </div>

              {/* TON Cashback Awarded Box */}
              <div className="bg-gradient-to-r from-cyan-950/80 via-slate-900 to-indigo-950/80 border border-cyan-500/50 rounded-2xl p-4 text-center space-y-1 shadow-lg">
                <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-center gap-1">
                  <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300" />
                  <span>TON Cashback Earned ({cashbackPercentage}%)</span>
                </div>
                <div className="text-2xl font-black text-cyan-300">
                  +{confirmedBooking.cashbackTon.toFixed(3)} TON
                </div>
                <p className="text-xs text-slate-400">
                  ≈ ${confirmedBooking.cashbackUsd.toFixed(2)} USD added to your TON Space Wallet
                </p>
              </div>

              {/* Booking Summary details */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-left text-xs space-y-2">
                <div className="flex justify-between text-slate-400">
                  <span>Hotel:</span>
                  <span className="font-bold text-slate-100">{confirmedBooking.hotelName}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Dates:</span>
                  <span className="font-bold text-slate-100">{confirmedBooking.checkIn} to {confirmedBooking.checkOut} ({confirmedBooking.nights} night/s)</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Payment Method:</span>
                  <span className="font-bold text-cyan-400">{confirmedBooking.paymentMethod}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Total Paid:</span>
                  <span className="font-extrabold text-white">${confirmedBooking.totalPriceUsd} ({confirmedBooking.totalPriceTon.toFixed(2)} TON)</span>
                </div>
                <div className="flex justify-between text-slate-400 pt-2 border-t border-slate-800">
                  <span>Wallet Payout:</span>
                  <span className="font-mono text-cyan-300">{confirmedBooking.userWallet}</span>
                </div>
              </div>

              {/* Calendar Sync Action Box */}
              <div className="bg-slate-800/80 border border-blue-900/60 rounded-2xl p-4 text-left space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-500/20 text-blue-400 rounded-xl">
                    <CalendarPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Add Stay to Your Calendar</h4>
                    <p className="text-[11px] text-slate-400">Sync check-in & check-out dates to Apple, Google or Outlook</p>
                  </div>
                </div>

                <AddToCalendarDropdown booking={confirmedBooking} variant="primary" />
              </div>

              {/* Google Drive Export Action Box */}
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 text-left space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
                    <Cloud className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Save Voucher to Google Drive</h4>
                    <p className="text-[11px] text-slate-400">Back up your hotel confirmation PDF & TON receipt to your Drive</p>
                  </div>
                </div>

                {driveResult ? (
                  <div className="bg-emerald-950/60 border border-emerald-800/60 p-3 rounded-xl text-xs space-y-2">
                    <div className="text-emerald-300 font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Voucher Saved to Google Drive!</span>
                    </div>
                    <a
                      href={driveResult.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-cyan-400 font-bold underline hover:text-cyan-300"
                    >
                      <span>Open File in Google Drive</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                ) : (
                  <div>
                    {driveError && (
                      <p className="text-xs text-rose-400 bg-rose-950/50 p-2 rounded-lg border border-rose-800/40 mb-2">
                        {driveError}
                      </p>
                    )}
                    <button
                      onClick={handleExportToGoogleDrive}
                      disabled={isExportingDrive}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isExportingDrive ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Uploading Voucher to Drive...</span>
                        </>
                      ) : (
                        <>
                          <Cloud className="w-4 h-4" />
                          <span>Save Confirmation to Google Drive</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={onClose}
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-3 rounded-xl text-xs transition-all"
              >
                Done & Return
              </button>
            </div>
          ) : (
            /* Checkout Form Screen */
            <div className="space-y-4">
              
              {/* Hotel Summary Pill */}
              <div className="flex items-center gap-3 bg-slate-950 p-3 rounded-2xl border border-slate-800">
                <img
                  src={hotel.images[0]}
                  alt={hotel.name}
                  className="w-16 h-16 rounded-xl object-cover shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm text-white truncate">{hotel.name}</h4>
                  <p className="text-xs text-slate-400 truncate">{room.name}</p>
                  <p className="text-xs text-[#0088cc] font-semibold mt-0.5">
                    ${room.pricePerNightUsd} / night
                  </p>
                </div>
              </div>

              {/* Stay Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Check-In
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={checkIn}
                      onChange={(e) => setCheckIn(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#0088cc]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Check-Out ({nights} night{nights > 1 ? 's' : ''})
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={checkOut}
                      onChange={(e) => setCheckOut(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#0088cc]"
                    />
                  </div>
                </div>
              </div>

              {/* Guest Details */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Primary Guest Name
                  </label>
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Full Legal Name"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#0088cc]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Email for Voucher
                  </label>
                  <input
                    type="email"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    placeholder="Email"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#0088cc]"
                  />
                </div>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  Select Payment Method
                </label>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('TON')}
                    className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                      paymentMethod === 'TON'
                        ? 'bg-[#0088cc]/20 border-[#0088cc] text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="text-xl">💎</span>
                    <span className="text-xs font-bold">TON</span>
                    <span className="text-[9px] text-cyan-300">TON Space</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('USDT_TON')}
                    className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                      paymentMethod === 'USDT_TON'
                        ? 'bg-emerald-500/20 border-emerald-500 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="text-xl">💵</span>
                    <span className="text-xs font-bold">USDT</span>
                    <span className="text-[9px] text-emerald-300">on TON</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CARD')}
                    className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                      paymentMethod === 'CARD'
                        ? 'bg-purple-500/20 border-purple-500 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <CreditCard className="w-5 h-5 text-purple-400" />
                    <span className="text-xs font-bold">Card</span>
                    <span className="text-[9px] text-purple-300">Visa/MC</span>
                  </button>
                </div>
              </div>

              {/* TON Space Wallet Address Status */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-cyan-400" />
                  <div>
                    <div className="text-slate-400 text-[10px]">TON Cashback Payout Wallet</div>
                    <div className="font-mono font-bold text-slate-200">
                      {userState.connectedWallet
                        ? `${userState.connectedWallet.slice(0, 8)}...${userState.connectedWallet.slice(-6)}`
                        : 'No Wallet Connected'}
                    </div>
                  </div>
                </div>

                {!userState.connectedWallet && (
                  <button
                    type="button"
                    onClick={onConnectWallet}
                    className="bg-[#0088cc] hover:bg-[#0077b3] text-white font-bold text-[11px] px-2.5 py-1 rounded-lg"
                  >
                    Connect
                  </button>
                )}
              </div>

              {/* Price & Cashback Breakdown Box */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>${room.pricePerNightUsd} × {nights} night(s)</span>
                  <span className="font-bold text-slate-200">
                    ${totalPriceUsd} USD {showFiat && <span className="text-amber-300 font-semibold">(≈ {totalFiat})</span>}
                  </span>
                </div>

                <div className="flex justify-between text-slate-400">
                  <span>TON Price Conversion</span>
                  <span className="font-mono text-cyan-400 font-bold">≈ {totalPriceTon.toFixed(2)} TON</span>
                </div>

                {showFiat && (
                  <div className="flex justify-between text-slate-400 text-[11px] bg-slate-900/60 px-2.5 py-1.5 rounded-lg border border-slate-800">
                    <span className="flex items-center gap-1">
                      <Globe className="w-3 h-3 text-cyan-400" />
                      <span>Local Currency Equivalent ({selectedCurrency})</span>
                    </span>
                    <span className="font-mono font-bold text-amber-300">{totalFiat}</span>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                  <div className="flex justify-between text-slate-400 text-[11px]">
                    <span>Base TON Cashback ({basePercentage}%)</span>
                    <span className="text-cyan-300">+{((totalPriceUsd * basePercentage) / (100 * userState.tonPriceUsd)).toFixed(3)} TON</span>
                  </div>

                  {loyaltyBonusPercentage > 0 && (
                    <div className="flex justify-between text-amber-300 text-[11px] font-semibold">
                      <span className="flex items-center gap-1">
                        <span>✈️</span>
                        <span>{loyaltyTierDisplayName} Bonus (+{loyaltyBonusPercentage}%)</span>
                      </span>
                      <span>+{loyaltyBonusTon.toFixed(3)} TON</span>
                    </div>
                  )}

                  <div className="pt-1.5 border-t border-slate-800 flex justify-between items-center text-emerald-400 font-bold">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      <span>Total TON Cashback ({cashbackPercentage.toFixed(1)}%)</span>
                    </span>
                    <div className="text-right">
                      <span className="text-sm font-black text-cyan-300">
                        +{cashbackTon.toFixed(3)} TON
                      </span>
                      {showFiat && (
                        <div className="text-[10px] text-emerald-400 font-normal">
                          ≈ +{cashbackFiat}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Pay Button */}
              <button
                type="button"
                onClick={handlePayAndBook}
                disabled={isProcessing}
                className="w-full bg-gradient-to-r from-[#0088cc] via-cyan-600 to-blue-600 hover:opacity-95 text-white font-black py-3.5 px-4 rounded-2xl shadow-xl shadow-[#0088cc]/30 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Confirming TON Transaction...</span>
                  </>
                ) : (
                  <>
                    <span>Pay ${totalPriceUsd} {showFiat && `(${totalFiat})`} & Earn +{cashbackTon.toFixed(2)} TON</span>
                  </>
                )}
              </button>

            </div>
          )}
        </div>

      </div>
    </div>
  );
};
