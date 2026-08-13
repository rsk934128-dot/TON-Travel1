import React, { useState } from 'react';
import { Hotel } from '../types';
import { MapPin, Star, Sparkles, ArrowRight, X } from 'lucide-react';
import { formatFiatEstimate } from '../utils/currency';

interface MapViewProps {
  hotels: Hotel[];
  tonPriceUsd: number;
  isPremium: boolean;
  loyaltyBonusPercentage?: number;
  selectedCurrency?: string;
  rates?: Record<string, number>;
  onSelectHotel: (hotel: Hotel) => void;
}

export const MapView: React.FC<MapViewProps> = ({
  hotels,
  tonPriceUsd,
  isPremium,
  loyaltyBonusPercentage = 0,
  selectedCurrency = 'USD',
  rates = {},
  onSelectHotel
}) => {
  const [selectedPin, setSelectedPin] = useState<Hotel | null>(hotels[0] || null);

  const basePercentage = isPremium ? 8 : 5;
  const cashbackPercentage = basePercentage + loyaltyBonusPercentage;
  const showFiat = selectedCurrency !== 'USD';

  return (
    <div className="relative w-full h-[680px] bg-slate-950 overflow-hidden flex flex-col">
      
      {/* Map Graphic Canvas / Background */}
      <div className="absolute inset-0 bg-[#0b1329] opacity-90">
        {/* World Map Grid Lines & Dots Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1.5px,transparent_1.5px)] [background-size:24px_24px]"></div>
        
        {/* Stylized continent shapes */}
        <svg className="absolute inset-0 w-full h-full opacity-20 text-slate-700 pointer-events-none" fill="currentColor">
          <path d="M150,120 Q200,80 300,100 T450,150 T600,100 T800,200 Z" />
          <path d="M200,300 Q300,280 400,350 T550,400 T700,320 Z" />
          <path d="M600,150 Q750,120 850,220 T950,300 Z" />
        </svg>
      </div>

      {/* Map Control Overlay Header */}
      <div className="relative z-10 p-4 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-[#0088cc]" />
          <div>
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">3,000,000+ Hotels Worldwide</h2>
            <p className="text-[11px] text-slate-400">Click map pin to inspect TON cashback rates</p>
          </div>
        </div>

        <div className="text-xs font-bold text-cyan-300 bg-cyan-950/80 border border-cyan-800 px-3 py-1 rounded-full flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
          <span>Earn {cashbackPercentage}% TON Cashback</span>
        </div>
      </div>

      {/* Interactive Pin Container */}
      <div className="relative flex-1 w-full h-full p-6 overflow-hidden">
        {hotels.map((hotel, idx) => {
          // Normalize lat/lon to percentage coordinates for visual scattering
          const x = ((hotel.longitude + 180) / 360) * 100;
          const y = ((90 - hotel.latitude) / 180) * 100;
          
          const isSelected = selectedPin?.id === hotel.id;
          const cashbackTon = (hotel.pricePerNightUsd * cashbackPercentage) / (100 * tonPriceUsd);

          return (
            <div
              key={hotel.id}
              onClick={() => setSelectedPin(hotel)}
              style={{
                left: `${Math.min(85, Math.max(10, x))}%`,
                top: `${Math.min(80, Math.max(15, y))}%`
              }}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer transition-all duration-300"
            >
              <div className={`group relative flex items-center gap-1.5 px-3 py-1.5 rounded-full border shadow-xl transition-all ${
                isSelected
                  ? 'bg-[#0088cc] border-white text-white scale-125 z-30 shadow-cyan-500/50'
                  : 'bg-slate-900/90 hover:bg-slate-800 border-cyan-500/50 text-slate-100 hover:scale-110'
              }`}>
                <MapPin className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-cyan-400'}`} />
                <span className="text-xs font-extrabold">${hotel.pricePerNightUsd}</span>
                <span className="text-[10px] text-emerald-300 font-bold bg-black/40 px-1.5 py-0.5 rounded-md">
                  +{cashbackTon.toFixed(1)}TON
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Hotel Floating Preview Card */}
      {selectedPin && (
        <div className="absolute bottom-4 left-4 right-4 z-30 max-w-md mx-auto bg-slate-900/95 backdrop-blur-md border border-cyan-500/40 rounded-3xl p-4 shadow-2xl animate-fade-in flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={selectedPin.images[0]}
              alt={selectedPin.name}
              className="w-16 h-16 rounded-2xl object-cover shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1 text-[11px] text-amber-400 font-bold">
                <Star className="w-3 h-3 fill-amber-400" />
                <span>{selectedPin.rating.toFixed(2)}</span>
                <span className="text-slate-400 font-normal">({selectedPin.location})</span>
              </div>
              <h3 className="font-extrabold text-sm text-white truncate">{selectedPin.name}</h3>
              <div className="text-xs text-cyan-400 font-bold mt-0.5">
                ${selectedPin.pricePerNightUsd}
                {showFiat && <span className="text-amber-300 font-semibold ml-1">({formatFiatEstimate(selectedPin.pricePerNightUsd, selectedCurrency, rates)})</span>}
                /night • <span className="text-emerald-400">+{((selectedPin.pricePerNightUsd * cashbackPercentage) / (100 * tonPriceUsd)).toFixed(2)} TON Cashback</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onSelectHotel(selectedPin)}
            className="bg-[#0088cc] hover:bg-[#0077b3] text-white p-3 rounded-2xl shadow-lg transition-all shrink-0"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      )}

    </div>
  );
};
