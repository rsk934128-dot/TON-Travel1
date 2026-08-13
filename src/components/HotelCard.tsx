import React from 'react';
import { Hotel } from '../types';
import { Star, MapPin, Sparkles, ArrowRight, ShieldCheck, Award } from 'lucide-react';
import { formatFiatEstimate, getCurrencyInfo, formatFiat } from '../utils/currency';
import { useLanguage } from '../utils/i18n';

interface HotelCardProps {
  hotel: Hotel;
  tonPriceUsd: number;
  isPremium: boolean;
  loyaltyBonusPercentage?: number;
  loyaltyTierName?: string;
  selectedCurrency?: string;
  rates?: Record<string, number>;
  onSelect: (hotel: Hotel) => void;
}

export const HotelCard: React.FC<HotelCardProps> = ({
  hotel,
  tonPriceUsd,
  isPremium,
  loyaltyBonusPercentage = 0,
  loyaltyTierName,
  selectedCurrency = 'USD',
  rates = {},
  onSelect
}) => {
  const { t } = useLanguage();
  const basePercentage = isPremium ? 8 : 5;
  const cashbackPercentage = basePercentage + loyaltyBonusPercentage;
  const priceUsd = hotel.pricePerNightUsd;
  const priceTon = priceUsd / tonPriceUsd;
  
  const cashbackUsd = (priceUsd * cashbackPercentage) / 100;
  const cashbackTon = cashbackUsd / tonPriceUsd;

  const showFiat = selectedCurrency !== 'USD';
  const fiatPrice = formatFiatEstimate(priceUsd, selectedCurrency, rates);
  const fiatCashback = formatFiatEstimate(cashbackUsd, selectedCurrency, rates);

  return (
    <div
      onClick={() => onSelect(hotel)}
      className="group bg-slate-900/90 rounded-2xl border border-slate-800 hover:border-slate-700 overflow-hidden shadow-lg transition-all duration-200 hover:-translate-y-1 cursor-pointer flex flex-col"
    >
      {/* Image Thumbnail with Badges */}
      <div className="relative h-48 w-full overflow-hidden bg-slate-800">
        <img
          src={hotel.images[0]}
          alt={hotel.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/30" />

        {/* Popular / Promo Tag */}
        {hotel.tag && (
          <div className="absolute top-3 left-3 bg-[#0088cc]/90 backdrop-blur-md text-white font-bold text-[11px] px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
            <Sparkles className="w-3 3-h text-amber-300 fill-amber-300" />
            <span>{hotel.tag}</span>
          </div>
        )}

        {/* Telegram Premium & Frequent Traveler Cashback Badge */}
        <div className="absolute top-3 right-3 bg-slate-950/90 backdrop-blur-md border border-cyan-500/40 text-cyan-300 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-lg">
          <span className="text-amber-400">💎</span>
          <span>+{cashbackTon.toFixed(2)} TON</span>
          <span className="text-[10px] text-amber-300">({cashbackPercentage.toFixed(1)}%)</span>
        </div>

        {/* Location Overlay */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
          <div className="flex items-center gap-1 text-xs text-slate-200 font-medium truncate">
            <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="truncate">{hotel.location}</span>
          </div>

          <div className="flex items-center gap-1 bg-black/50 backdrop-blur-md px-2 py-0.5 rounded-md text-xs font-bold text-amber-400 border border-amber-400/20">
            <Star className="w-3 h-3 fill-amber-400" />
            <span>{hotel.rating.toFixed(2)}</span>
            <span className="text-[10px] text-slate-300">({hotel.reviewCount})</span>
          </div>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <h3 className="text-base font-bold text-slate-100 group-hover:text-[#0088cc] transition-colors line-clamp-1">
            {hotel.name}
          </h3>

          <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
            {hotel.description}
          </p>

          {/* Perks Tags */}
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {hotel.perks.slice(0, 3).map((perk, idx) => (
              <span
                key={idx}
                className="text-[10px] font-medium bg-slate-800/80 text-slate-300 px-2 py-0.5 rounded-md border border-slate-700/50"
              >
                {perk}
              </span>
            ))}
          </div>
        </div>

        {/* Price & Cashback Footer */}
        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-lg font-black text-white">${priceUsd}</span>
              {showFiat && (
                <span className="text-xs font-bold text-amber-300">
                  (≈ {fiatPrice})
                </span>
              )}
              <span className="text-xs text-slate-400 font-medium">/{t('hotels.per_night')}</span>
              {hotel.discountUsd && (
                <span className="text-xs text-slate-500 line-through">${hotel.discountUsd}</span>
              )}
            </div>
            <div className="text-[11px] text-cyan-400 font-semibold flex items-center gap-1.5 mt-0.5">
              <span>≈ {priceTon.toFixed(2)} TON</span>
              {showFiat && (
                <span className="text-[10px] text-slate-400 font-normal">
                  • +{fiatCashback} back
                </span>
              )}
            </div>
          </div>

          {/* Cashback Callout Button */}
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#0088cc] bg-[#0088cc]/10 group-hover:bg-[#0088cc] group-hover:text-white px-3 py-1.5 rounded-xl transition-all">
            <span>{t('hotels.book_btn')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </div>
  );
};
