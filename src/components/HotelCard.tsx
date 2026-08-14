import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Hotel } from '../types';
import { Star, MapPin, Sparkles, ArrowRight, Crown, Tag, Compass, Palmtree, Leaf, Waves, Share2, Check } from 'lucide-react';
import { formatFiatEstimate } from '../utils/currency';
import { useLanguage } from '../utils/i18n';

interface HotelCardProps {
  hotel: Hotel;
  tonPriceUsd: number;
  isPremium: boolean;
  loyaltyBonusPercentage?: number;
  loyaltyTierName?: string;
  selectedCurrency?: string;
  rates?: Record<string, number>;
  activeCategory?: string;
  onSelectCategory?: (category: string) => void;
  onSelect: (hotel: Hotel) => void;
  index?: number;
}

export const getCategoryVisual = (category: string) => {
  const cat = category.toLowerCase();
  if (cat.includes('lux')) {
    return {
      name: 'Luxury',
      label: 'Luxury',
      badgeClass: 'bg-gradient-to-r from-amber-500/25 to-yellow-500/20 text-amber-300 border-amber-500/40 shadow-sm',
      icon: Crown,
      emoji: '👑',
      accentHex: '#f59e0b'
    };
  }
  if (cat.includes('budget') || cat.includes('value')) {
    return {
      name: 'Budget',
      label: 'Budget',
      badgeClass: 'bg-gradient-to-r from-emerald-500/25 to-teal-500/20 text-emerald-300 border-emerald-500/40 shadow-sm',
      icon: Tag,
      emoji: '🏷️',
      accentHex: '#10b981'
    };
  }
  if (cat.includes('boutique')) {
    return {
      name: 'Boutique',
      label: 'Boutique',
      badgeClass: 'bg-gradient-to-r from-purple-500/25 to-pink-500/20 text-purple-300 border-purple-500/40 shadow-sm',
      icon: Compass,
      emoji: '✨',
      accentHex: '#a855f7'
    };
  }
  if (cat.includes('resort')) {
    return {
      name: 'Resort',
      label: 'Resort',
      badgeClass: 'bg-gradient-to-r from-cyan-500/25 to-blue-500/20 text-cyan-300 border-cyan-500/40 shadow-sm',
      icon: Palmtree,
      emoji: '🏖️',
      accentHex: '#06b6d4'
    };
  }
  if (cat.includes('eco')) {
    return {
      name: 'Eco-Villa',
      label: 'Eco-Villa',
      badgeClass: 'bg-gradient-to-r from-teal-500/25 to-emerald-500/20 text-teal-300 border-teal-500/40 shadow-sm',
      icon: Leaf,
      emoji: '🌿',
      accentHex: '#14b8a6'
    };
  }
  if (cat.includes('beach')) {
    return {
      name: 'Beachfront',
      label: 'Beachfront',
      badgeClass: 'bg-gradient-to-r from-sky-500/25 to-blue-500/20 text-sky-300 border-sky-500/40 shadow-sm',
      icon: Waves,
      emoji: '🌊',
      accentHex: '#0284c7'
    };
  }
  return {
    name: category,
    label: category,
    badgeClass: 'bg-slate-800/80 text-slate-300 border-slate-700/60',
    icon: Sparkles,
    emoji: '🏨',
    accentHex: '#94a3b8'
  };
};

export const HotelCard: React.FC<HotelCardProps> = ({
  hotel,
  tonPriceUsd,
  isPremium,
  loyaltyBonusPercentage = 0,
  selectedCurrency = 'USD',
  rates = {},
  activeCategory,
  onSelectCategory,
  onSelect,
  index = 0
}) => {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  const basePercentage = isPremium ? 8 : 5;
  const cashbackPercentage = basePercentage + loyaltyBonusPercentage;
  const priceUsd = hotel.pricePerNightUsd;
  const priceTon = priceUsd / tonPriceUsd;
  
  const cashbackUsd = (priceUsd * cashbackPercentage) / 100;
  const cashbackTon = cashbackUsd / tonPriceUsd;

  const showFiat = selectedCurrency !== 'USD';
  const fiatPrice = formatFiatEstimate(priceUsd, selectedCurrency, rates);
  const fiatCashback = formatFiatEstimate(cashbackUsd, selectedCurrency, rates);

  // Extract category tags
  const tagsList = hotel.categoryTags && hotel.categoryTags.length > 0
    ? hotel.categoryTags
    : hotel.category
      ? [hotel.category]
      : ['Luxury'];

  const primaryCategoryVisual = getCategoryVisual(tagsList[0]);

  // Native Web Share API Handler with Referral Link
  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation(); // prevent card click / modal opening

    const referralCode = 'TONTRAVEL_VIP';
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://t.me/tontravel_bot/app';
    const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
    const shareUrl = `${origin}${pathname}?hotel=${hotel.id}&ref=${referralCode}`;

    const shareData = {
      title: `${hotel.name} - TON Travel`,
      text: `🏨 Check out ${hotel.name} in ${hotel.location} on TON Travel!\nBook with TON or Card & earn up to +${cashbackTon.toFixed(2)} TON (${cashbackPercentage.toFixed(1)}%) crypto cashback!\nReferral: ${referralCode}`,
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
    <motion.div
      layout
      initial={{ opacity: 0, y: 22, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 12, scale: 0.96, transition: { duration: 0.18 } }}
      transition={{
        duration: 0.38,
        delay: Math.min(index * 0.05, 0.45),
        ease: [0.22, 1, 0.36, 1]
      }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      onClick={() => onSelect(hotel)}
      className="group bg-slate-900/90 rounded-2xl border border-slate-800 hover:border-slate-700 overflow-hidden shadow-lg cursor-pointer flex flex-col"
    >
      {/* Image Thumbnail with Badges */}
      <div className="relative h-48 w-full overflow-hidden bg-slate-800">
        <img
          src={hotel.images[0]}
          alt={hotel.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-transparent to-black/35" />

        {/* Top-Left Category & Promo Tag Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
          {/* Primary Category Pill Badge */}
          <div className={`backdrop-blur-md font-extrabold text-[11px] px-2.5 py-1 rounded-full shadow-md flex items-center gap-1 border ${primaryCategoryVisual.badgeClass}`}>
            <span>{primaryCategoryVisual.emoji}</span>
            <span>{primaryCategoryVisual.label}</span>
          </div>

          {/* Optional Promo / Featured Tag */}
          {hotel.tag && hotel.tag !== primaryCategoryVisual.label && (
            <div className="bg-slate-950/80 backdrop-blur-md text-cyan-300 font-semibold text-[10px] px-2 py-0.5 rounded-full border border-cyan-500/30 flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5 text-amber-300 fill-amber-300" />
              <span className="truncate max-w-[130px]">{hotel.tag}</span>
            </div>
          )}
        </div>

        {/* Telegram Premium & Frequent Traveler Cashback Badge + Share Button */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
          <div className="bg-slate-950/90 backdrop-blur-md border border-cyan-500/40 text-cyan-300 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-lg">
            <span className="text-amber-400">💎</span>
            <span>+{cashbackTon.toFixed(2)} TON</span>
            <span className="text-[10px] text-amber-300">({cashbackPercentage.toFixed(1)}%)</span>
          </div>

          {/* Native Web Share Button */}
          <button
            type="button"
            onClick={handleShare}
            className={`p-2 rounded-full backdrop-blur-md border transition-all duration-200 shadow-lg flex items-center justify-center ${
              copied
                ? 'bg-emerald-600/95 border-emerald-400 text-white scale-110 shadow-emerald-500/30 ring-2 ring-emerald-400/50'
                : 'bg-slate-950/85 hover:bg-slate-800 border-slate-700/80 text-slate-300 hover:text-white hover:border-cyan-400/80 hover:scale-105 active:scale-95'
            }`}
            title={copied ? 'Link & details copied!' : 'Share hotel & referral link with friends'}
            aria-label="Share hotel"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-white stroke-[2.5px]" />
            ) : (
              <Share2 className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Copied Toast Banner */}
        {copied && (
          <div className="absolute top-12 right-3 bg-emerald-950/95 border border-emerald-500 text-emerald-200 text-[10px] font-extrabold px-2.5 py-1 rounded-lg shadow-2xl backdrop-blur-md flex items-center gap-1 animate-fade-in z-20">
            <Check className="w-3 h-3 text-emerald-400" />
            <span>Referral link copied!</span>
          </div>
        )}

        {/* Location Overlay */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
          <div className="flex items-center gap-1 text-xs text-slate-200 font-medium truncate">
            <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="truncate">{hotel.location}</span>
          </div>

          <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md text-xs font-bold text-amber-400 border border-amber-400/25">
            <Star className="w-3 h-3 fill-amber-400" />
            <span>{hotel.rating.toFixed(2)}</span>
            <span className="text-[10px] text-slate-300">({hotel.reviewCount})</span>
          </div>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          {/* Category Tags Row */}
          <div className="flex items-center gap-1.5 flex-wrap mb-2">
            {tagsList.map((tag, idx) => {
              const visual = getCategoryVisual(tag);
              const isTagActive = activeCategory === tag;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={(e) => {
                    if (onSelectCategory) {
                      e.stopPropagation();
                      onSelectCategory(tag);
                    }
                  }}
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border flex items-center gap-1 transition-all ${
                    visual.badgeClass
                  } ${isTagActive ? 'ring-1 ring-white/60 scale-105' : 'opacity-90 hover:opacity-100 hover:scale-105'}`}
                  title={`Filter by ${tag}`}
                >
                  <span className="text-[11px]">{visual.emoji}</span>
                  <span>{tag}</span>
                </button>
              );
            })}
          </div>

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
    </motion.div>
  );
};
