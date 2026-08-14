import React, { useState } from 'react';
import { Hotel, RoomOption } from '../types';
import { X, Star, MapPin, Sparkles, Check, Wifi, Shield, ArrowRight, Info, Coffee, Navigation, Award, Share2 } from 'lucide-react';
import { PriceHistoryChart } from './PriceHistoryChart';
import { HotelWeatherForecast } from './HotelWeatherForecast';
import { formatFiatEstimate } from '../utils/currency';
import { getCategoryVisual } from './HotelCard';

interface HotelDetailModalProps {
  hotel: Hotel | null;
  tonPriceUsd: number;
  isPremium: boolean;
  loyaltyBonusPercentage?: number;
  loyaltyTierName?: string;
  loyaltyTierDisplayName?: string;
  selectedCurrency?: string;
  rates?: Record<string, number>;
  onClose: () => void;
  onProceedToBooking: (hotel: Hotel, room: RoomOption) => void;
  onTogglePremium: () => void;
}

export const HotelDetailModal: React.FC<HotelDetailModalProps> = ({
  hotel,
  tonPriceUsd,
  isPremium,
  loyaltyBonusPercentage = 0,
  loyaltyTierName = 'Explorer',
  loyaltyTierDisplayName = 'Bronze Explorer',
  selectedCurrency = 'USD',
  rates = {},
  onClose,
  onProceedToBooking,
  onTogglePremium
}) => {
  if (!hotel) return null;

  const showFiat = selectedCurrency !== 'USD';

  const [copied, setCopied] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedRoom, setSelectedRoom] = useState<RoomOption>(hotel.rooms[0] || {
    id: 'default',
    name: 'Standard Deluxe Room',
    pricePerNightUsd: hotel.pricePerNightUsd,
    bedType: '1 King Bed',
    capacity: '2 Guests',
    features: ['Ocean / City View', 'Free Wi-Fi', 'Breakfast Included']
  });

  const basePercentage = isPremium ? 8 : 5;
  const totalCashbackPercentage = basePercentage + loyaltyBonusPercentage;
  const roomPriceUsd = selectedRoom.pricePerNightUsd;
  const roomPriceTon = roomPriceUsd / tonPriceUsd;
  
  const cashbackUsd = (roomPriceUsd * totalCashbackPercentage) / 100;
  const cashbackTon = cashbackUsd / tonPriceUsd;

  const loyaltyBonusUsd = (roomPriceUsd * loyaltyBonusPercentage) / 100;
  const loyaltyBonusTon = loyaltyBonusUsd / tonPriceUsd;

  // Premium boost calculation
  const premiumBonusUsd = (roomPriceUsd * 3) / 100;
  const premiumBonusTon = premiumBonusUsd / tonPriceUsd;

  const roomFiatPrice = formatFiatEstimate(roomPriceUsd, selectedCurrency, rates);
  const cashbackFiat = formatFiatEstimate(cashbackUsd, selectedCurrency, rates);

  const handleShare = async () => {
    const referralCode = 'TONTRAVEL_VIP';
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://t.me/tontravel_bot/app';
    const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
    const shareUrl = `${origin}${pathname}?hotel=${hotel.id}&ref=${referralCode}`;

    const shareData = {
      title: `${hotel.name} - TON Travel`,
      text: `🏨 Check out ${hotel.name} in ${hotel.location} on TON Travel!\nBook with TON or Card & earn up to +${cashbackTon.toFixed(2)} TON (${totalCashbackPercentage.toFixed(1)}%) crypto cashback!\nReferral: ${referralCode}`,
      url: shareUrl
    };

    try {
      if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        setCopied(true);
        setTimeout(() => setCopied(false), 2200);
      } else if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share(shareData);
        setCopied(true);
        setTimeout(() => setCopied(false), 2200);
      } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(`${shareData.text}\n${shareUrl}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2200);
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        try {
          if (typeof navigator !== 'undefined' && navigator.clipboard) {
            await navigator.clipboard.writeText(`${shareData.text}\n${shareUrl}`);
            setCopied(true);
            setTimeout(() => setCopied(false), 2200);
          }
        } catch (clipErr) {
          console.error('Share fallback error:', clipErr);
        }
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl relative flex flex-col text-slate-100 my-auto">
        
        {/* Top Header Actions (Share & Close) */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
          <button
            type="button"
            onClick={handleShare}
            className={`p-2 rounded-full backdrop-blur-md border transition-all duration-200 shadow-lg flex items-center justify-center ${
              copied
                ? 'bg-emerald-600 border-emerald-400 text-white scale-105 shadow-emerald-500/40 ring-2 ring-emerald-400/50'
                : 'bg-slate-950/70 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-700/60 hover:scale-105'
            }`}
            title={copied ? 'Referral Link Copied!' : 'Share hotel & referral link'}
            aria-label="Share hotel"
          >
            {copied ? <Check className="w-4 h-4 text-white stroke-[2.5px]" /> : <Share2 className="w-4 h-4" />}
          </button>

          <button
            onClick={onClose}
            className="bg-slate-950/70 hover:bg-slate-800 text-slate-300 hover:text-white p-2 rounded-full backdrop-blur-md border border-slate-700/60 transition-all hover:scale-105"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Copied Notification Pill */}
        {copied && (
          <div className="absolute top-16 right-4 bg-emerald-950/95 border border-emerald-500 text-emerald-200 text-xs font-extrabold px-3 py-1.5 rounded-xl shadow-2xl backdrop-blur-md flex items-center gap-1.5 animate-fade-in z-30">
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span>Referral link copied to clipboard!</span>
          </div>
        )}

        {/* Gallery Slider */}
        <div className="relative h-64 sm:h-80 w-full bg-slate-950 overflow-hidden">
          <img
            src={hotel.images[activeImageIndex] || hotel.images[0]}
            alt={hotel.name}
            className="w-full h-full object-cover transition-opacity duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-black/40" />

          {/* Gallery Thumbnails */}
          <div className="absolute bottom-3 left-4 right-4 flex items-center gap-2 overflow-x-auto pb-1">
            {hotel.images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setActiveImageIndex(idx)}
                className={`w-14 h-10 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${
                  activeImageIndex === idx ? 'border-[#0088cc] scale-105' : 'border-slate-700 opacity-60'
                }`}
              >
                <img src={img} alt="thumb" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>

          {/* Rating Badge */}
          <div className="absolute top-4 left-4 bg-slate-950/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-amber-400 border border-amber-400/30 flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 fill-amber-400" />
            <span>{hotel.rating.toFixed(2)}</span>
            <span className="text-slate-400">({hotel.reviewCount} reviews)</span>
          </div>
        </div>

        {/* Body Container */}
        <div className="p-5 sm:p-6 space-y-6">
          
          {/* Header Info */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
              <div className="flex items-center gap-2 text-xs text-[#0088cc] font-semibold">
                <MapPin className="w-3.5 h-3.5" />
                <span>{hotel.location}, {hotel.country}</span>
              </div>

              {/* Category Tags Chips */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {(hotel.categoryTags || (hotel.category ? [hotel.category] : ['Luxury'])).map((tag, idx) => {
                  const visual = getCategoryVisual(tag);
                  return (
                    <span
                      key={idx}
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border flex items-center gap-1 ${visual.badgeClass}`}
                    >
                      <span>{visual.emoji}</span>
                      <span>{tag}</span>
                    </span>
                  );
                })}
              </div>
            </div>
            <h2 className="text-2xl font-black text-white">{hotel.name}</h2>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">{hotel.description}</p>
          </div>

          {/* TON Cashback Offer Card with Frequent Traveler Boost */}
          <div className={`p-4 rounded-2xl border transition-all space-y-2.5 ${
            isPremium
              ? 'bg-gradient-to-r from-purple-950/50 via-slate-900 to-indigo-950/50 border-purple-500/40'
              : 'bg-slate-950 border-cyan-500/30'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">💎</span>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5 flex-wrap">
                    <span>TON Cashback Reward</span>
                    {isPremium && (
                      <span className="bg-purple-500/30 text-purple-300 text-[10px] px-2 py-0.5 rounded-full font-bold">
                        Telegram Premium 8%
                      </span>
                    )}
                    {loyaltyBonusPercentage > 0 && (
                      <span className="bg-amber-400/20 text-amber-300 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                        <Award className="w-3 h-3" />
                        <span>{loyaltyTierDisplayName} (+{loyaltyBonusPercentage}%)</span>
                      </span>
                    )}
                  </div>
                  <div className="text-lg font-black text-cyan-400 mt-0.5 flex items-baseline gap-1.5 flex-wrap">
                    <span>+{cashbackTon.toFixed(3)} TON</span>
                    <span className="text-xs text-slate-400 font-normal">
                      (≈ ${cashbackUsd.toFixed(2)} USD {showFiat && `• ≈ ${cashbackFiat}`} • {totalCashbackPercentage.toFixed(1)}% total back)
                    </span>
                  </div>
                </div>
              </div>

              {!isPremium && (
                <button
                  onClick={onTogglePremium}
                  className="self-start sm:self-auto bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-md transition-all flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                  <span>Boost to 8%</span>
                </button>
              )}
            </div>

            {/* Loyalty Tier Booster Callout */}
            {loyaltyBonusPercentage > 0 ? (
              <div className="text-[11px] text-amber-300/95 bg-amber-950/30 p-2 rounded-lg border border-amber-500/30 flex items-center justify-between">
                <span>🌟 <strong>{loyaltyTierDisplayName}</strong> gives you an extra <strong>+{loyaltyBonusTon.toFixed(3)} TON</strong> on this stay!</span>
              </div>
            ) : (
              <div className="text-[11px] text-cyan-300/80 bg-cyan-950/30 p-2 rounded-lg border border-cyan-800/30">
                <span>✈️ Frequent Traveler: Complete 2 bookings in 12 months to unlock <strong>Silver Voyager (+1.5% TON Cashback bonus)</strong>!</span>
              </div>
            )}

            {!isPremium && (
              <div className="text-[11px] text-purple-300/90 bg-purple-950/40 p-2 rounded-lg border border-purple-800/30 flex items-center justify-between">
                <span>💡 Telegram Premium members earn +{premiumBonusTon.toFixed(3)} TON extra!</span>
                <span className="font-bold underline cursor-pointer" onClick={onTogglePremium}>Enable 8%</span>
              </div>
            )}
          </div>

          {/* 30-Day Price History Chart (Recharts) */}
          <PriceHistoryChart hotel={hotel} tonPriceUsd={tonPriceUsd} />

          {/* Perks Highlights */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">Key Hotel Perks</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {hotel.perks.map((perk, idx) => (
                <div key={idx} className="bg-slate-800/60 border border-slate-700/50 px-3 py-2 rounded-xl text-xs font-medium text-slate-200 flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="truncate">{perk}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Room Selection */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">Select Room Category</h3>
            <div className="space-y-2.5">
              {hotel.rooms.map((room) => {
                const isSelected = selectedRoom.id === room.id;
                const rPriceTon = room.pricePerNightUsd / tonPriceUsd;
                const rCashbackTon = (room.pricePerNightUsd * totalCashbackPercentage) / (100 * tonPriceUsd);
                const rFiatPrice = formatFiatEstimate(room.pricePerNightUsd, selectedCurrency, rates);
                const rFiatCashback = formatFiatEstimate((room.pricePerNightUsd * totalCashbackPercentage) / 100, selectedCurrency, rates);

                return (
                  <div
                    key={room.id}
                    onClick={() => setSelectedRoom(room)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-cyan-950/40 border-[#0088cc] shadow-md shadow-[#0088cc]/10'
                        : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/80'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? 'border-[#0088cc] bg-[#0088cc]' : 'border-slate-500'}`}>
                          {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                        </div>
                        <h4 className="font-bold text-sm text-white">{room.name}</h4>
                      </div>
                      
                      <p className="text-xs text-slate-400 pl-6">
                        {room.bedType} • {room.capacity}
                      </p>

                      <div className="flex flex-wrap gap-1 pl-6 pt-1">
                        {room.features.map((feat, fIdx) => (
                          <span key={fIdx} className="text-[10px] bg-slate-900 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                            {feat}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="text-right pl-6 sm:pl-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800">
                      <div className="text-base font-black text-white">
                        ${room.pricePerNightUsd}
                        {showFiat && <span className="text-xs font-bold text-amber-300 ml-1">({rFiatPrice})</span>}
                        <span className="text-xs font-normal text-slate-400"> /night</span>
                      </div>
                      <div className="text-xs text-cyan-400 font-semibold">≈ {rPriceTon.toFixed(2)} TON</div>
                      <div className="text-[10px] text-emerald-400 font-bold mt-0.5">
                        +{rCashbackTon.toFixed(3)} TON Cashback {showFiat && `(≈ ${rFiatCashback})`}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3-Day Live Open Weather Forecast */}
          <HotelWeatherForecast
            latitude={hotel.latitude}
            longitude={hotel.longitude}
            cityName={hotel.city}
            countryName={hotel.country}
          />

          {/* Location Map Preview */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center justify-between">
              <span>Location Coordinates</span>
              <span className="text-[11px] text-[#0088cc] flex items-center gap-1 font-normal">
                <Navigation className="w-3 h-3" />
                {hotel.latitude.toFixed(4)}, {hotel.longitude.toFixed(4)}
              </span>
            </h3>
            
            <div className="h-32 bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden relative flex items-center justify-center">
              {/* Simulated map background grid */}
              <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40"></div>
              
              <div className="relative z-10 text-center p-3 bg-slate-900/90 backdrop-blur-md rounded-xl border border-slate-700 max-w-xs shadow-lg">
                <MapPin className="w-6 h-6 text-cyan-400 mx-auto mb-1 animate-bounce" />
                <p className="text-xs font-bold text-white">{hotel.name}</p>
                <p className="text-[10px] text-slate-400">{hotel.location}</p>
              </div>
            </div>
          </div>

        </div>

        {/* Modal Sticky Bottom Action Bar */}
        <div className="sticky bottom-0 bg-slate-900/95 backdrop-blur-md p-4 border-t border-slate-800 flex items-center justify-between gap-4">
          <div>
            <div className="text-xs text-slate-400">Total per night</div>
            <div className="text-xl font-black text-white flex items-baseline gap-1.5 flex-wrap">
              <span>${selectedRoom.pricePerNightUsd}</span>
              {showFiat && <span className="text-xs font-bold text-amber-300">({roomFiatPrice})</span>}
              <span className="text-xs font-medium text-cyan-400">({roomPriceTon.toFixed(2)} TON)</span>
            </div>
          </div>

          <button
            onClick={() => onProceedToBooking(hotel, selectedRoom)}
            className="flex-1 max-w-xs bg-gradient-to-r from-[#0088cc] to-cyan-600 hover:from-[#0077b3] hover:to-cyan-500 text-white font-bold py-3 px-5 rounded-2xl shadow-lg shadow-[#0088cc]/25 transition-all flex items-center justify-center gap-2 text-sm"
          >
            <span>Book with TON Cashback</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
