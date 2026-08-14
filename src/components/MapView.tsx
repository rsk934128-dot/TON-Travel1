import React, { useState, useMemo } from 'react';
import { Hotel } from '../types';
import {
  MapPin,
  Star,
  Sparkles,
  ArrowRight,
  X,
  Layers,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Building2,
  ChevronRight,
  Eye,
  SlidersHorizontal,
  Compass
} from 'lucide-react';
import { formatFiatEstimate } from '../utils/currency';
import { getCategoryVisual } from './HotelCard';
import { useLanguage } from '../utils/i18n';

interface MapViewProps {
  hotels: Hotel[];
  tonPriceUsd: number;
  isPremium: boolean;
  loyaltyBonusPercentage?: number;
  selectedCurrency?: string;
  rates?: Record<string, number>;
  onSelectHotel: (hotel: Hotel) => void;
}

export interface HotelCluster {
  id: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  hotels: Hotel[];
  minPrice: number;
  maxPrice: number;
  avgRating: number;
  isCluster: boolean;
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
  const { t } = useLanguage();

  // Clustering & View State
  const [clusteringEnabled, setClusteringEnabled] = useState<boolean>(true);
  const [zoomLevel, setZoomLevel] = useState<number>(1); // 1 = Global, 2 = Regional, 3 = City
  const [focusedCity, setFocusedCity] = useState<string>('All');
  const [selectedCluster, setSelectedCluster] = useState<HotelCluster | null>(null);
  const [selectedPin, setSelectedPin] = useState<Hotel | null>(hotels[0] || null);

  const basePercentage = isPremium ? 8 : 5;
  const cashbackPercentage = basePercentage + loyaltyBonusPercentage;
  const showFiat = selectedCurrency !== 'USD';

  // Group hotels into clusters by City / Proximity
  const clusters: HotelCluster[] = useMemo(() => {
    if (!clusteringEnabled || zoomLevel >= 3) {
      // Unclustered: every hotel is its own single-item cluster
      return hotels.map((h) => ({
        id: `single-${h.id}`,
        city: h.city,
        country: h.country,
        latitude: h.latitude,
        longitude: h.longitude,
        hotels: [h],
        minPrice: h.pricePerNightUsd,
        maxPrice: h.pricePerNightUsd,
        avgRating: h.rating,
        isCluster: false
      }));
    }

    // Group by City
    const cityMap = new Map<string, Hotel[]>();
    hotels.forEach((hotel) => {
      const key = `${hotel.city}__${hotel.country}`;
      if (!cityMap.has(key)) {
        cityMap.set(key, []);
      }
      cityMap.get(key)!.push(hotel);
    });

    const result: HotelCluster[] = [];
    cityMap.forEach((cityHotels) => {
      const first = cityHotels[0];
      const count = cityHotels.length;

      // Compute average center coordinates
      const avgLat = cityHotels.reduce((sum, h) => sum + h.latitude, 0) / count;
      const avgLng = cityHotels.reduce((sum, h) => sum + h.longitude, 0) / count;
      const prices = cityHotels.map((h) => h.pricePerNightUsd);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const avgRating = cityHotels.reduce((sum, h) => sum + h.rating, 0) / count;

      result.push({
        id: `cluster-${first.city}-${count}`,
        city: first.city,
        country: first.country,
        latitude: avgLat,
        longitude: avgLng,
        hotels: cityHotels,
        minPrice,
        maxPrice,
        avgRating,
        isCluster: count > 1
      });
    });

    return result;
  }, [hotels, clusteringEnabled, zoomLevel]);

  // Unique list of cities for quick navigation
  const citySummary = useMemo(() => {
    const counts: Record<string, number> = {};
    hotels.forEach((h) => {
      counts[h.city] = (counts[h.city] || 0) + 1;
    });
    return Object.entries(counts).map(([city, count]) => ({ city, count }));
  }, [hotels]);

  // Handle clicking a cluster or single marker
  const handleMarkerClick = (cluster: HotelCluster) => {
    if (cluster.isCluster) {
      setSelectedCluster(cluster);
      setSelectedPin(cluster.hotels[0]);
    } else {
      setSelectedCluster(null);
      setSelectedPin(cluster.hotels[0]);
    }
  };

  // Zoom to a specific city and expand its markers
  const handleFocusCity = (cityName: string) => {
    setFocusedCity(cityName);
    if (cityName === 'All') {
      setZoomLevel(1);
      setSelectedCluster(null);
      setSelectedPin(hotels[0] || null);
    } else {
      const matchingCluster = clusters.find((c) => c.city.toLowerCase() === cityName.toLowerCase());
      if (matchingCluster) {
        setSelectedCluster(matchingCluster);
        setSelectedPin(matchingCluster.hotels[0]);
        setZoomLevel(2);
      }
    }
  };

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(3, prev + 1));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => {
      const next = Math.max(1, prev - 1);
      if (next === 1) setSelectedCluster(null);
      return next;
    });
  };

  const handleResetView = () => {
    setZoomLevel(1);
    setFocusedCity('All');
    setSelectedCluster(null);
    setSelectedPin(hotels[0] || null);
  };

  // Projection math: converts lat/lon into container percentage coordinates with zoom & city offset
  const getProjectedCoordinates = (lat: number, lng: number, indexInCluster = 0, totalInCluster = 1) => {
    // Base Mercator-like normalized coordinates (0% to 100%)
    let x = ((lng + 180) / 360) * 100;
    let y = ((90 - lat) / 180) * 100;

    // Apply micro-offsets when rendering multiple unclustered hotels at the same city
    if (totalInCluster > 1 && (!clusteringEnabled || zoomLevel >= 2)) {
      const angle = (indexInCluster / totalInCluster) * 2 * Math.PI;
      const radius = zoomLevel === 3 ? 3.5 : 2.2; // percentage offset radius
      x += Math.cos(angle) * radius;
      y += Math.sin(angle) * radius;
    }

    // Bounds safety clamp
    const clampedX = Math.min(88, Math.max(12, x));
    const clampedY = Math.min(82, Math.max(16, y));

    return { x: clampedX, y: clampedY };
  };

  return (
    <div className="relative w-full h-[720px] bg-slate-950 overflow-hidden flex flex-col select-none">
      
      {/* Map Graphic Background */}
      <div className="absolute inset-0 bg-[#080e1e] opacity-95 transition-transform duration-500">
        {/* World Map Grid Lines & Dots Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1.5px,transparent_1.5px)] [background-size:24px_24px]"></div>
        
        {/* Stylized Continent Outlines */}
        <svg className="absolute inset-0 w-full h-full opacity-25 text-slate-700 pointer-events-none" fill="currentColor">
          <path d="M120,120 Q180,70 280,90 T420,140 T580,90 T780,180 Z" />
          <path d="M180,280 Q280,260 380,330 T530,380 T680,300 Z" />
          <path d="M580,130 Q720,100 820,200 T920,280 Z" />
          <path d="M750,450 Q850,420 900,500 T800,560 Z" />
        </svg>

        {/* Dynamic Zoom Level Visual Vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/40 pointer-events-none" />
      </div>

      {/* Top Map Control Bar */}
      <div className="relative z-20 p-3.5 sm:p-4 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center justify-between sm:justify-start gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Compass className="w-4 h-4 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-black text-white uppercase tracking-wider">TON Travel Map</h2>
                <span className="bg-cyan-500/20 text-cyan-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-cyan-500/30">
                  {hotels.length} Stays • {citySummary.length} Cities
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {clusteringEnabled
                  ? 'Clustering active: click city clusters to unpack hotels'
                  : 'Individual marker mode: showing all hotel locations'}
              </p>
            </div>
          </div>

          {/* Cashback Pill on Mobile */}
          <div className="sm:hidden text-[11px] font-bold text-amber-300 bg-amber-950/80 border border-amber-800/80 px-2.5 py-1 rounded-full flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400 fill-amber-400" />
            <span>{cashbackPercentage}% TON</span>
          </div>
        </div>

        {/* Controls: Cluster Toggle & Zoom Status */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Clustering Mode Toggle Button */}
          <button
            onClick={() => setClusteringEnabled((prev) => !prev)}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border transition-all flex items-center gap-1.5 ${
              clusteringEnabled
                ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500/60 shadow-sm'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
            }`}
            title="Toggle Smart Marker Clustering"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{clusteringEnabled ? 'Clustering ON' : 'Clustering OFF'}</span>
          </button>

          {/* Desktop Cashback Badge */}
          <div className="hidden sm:flex text-xs font-bold text-cyan-300 bg-cyan-950/80 border border-cyan-800 px-3 py-1.5 rounded-xl items-center gap-1.5 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
            <span>Earn {cashbackPercentage}% TON Cashback</span>
          </div>
        </div>
      </div>

      {/* City Filter Chips Bar */}
      <div className="relative z-10 px-4 py-2 bg-slate-900/60 backdrop-blur-sm border-b border-slate-800/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
          <MapPin className="w-3 h-3 text-cyan-400" />
          <span>Jump to:</span>
        </span>

        <button
          onClick={() => handleFocusCity('All')}
          className={`px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 transition-all border ${
            focusedCity === 'All'
              ? 'bg-[#0088cc] text-white border-transparent shadow-sm'
              : 'bg-slate-950 text-slate-400 hover:text-slate-200 border-slate-800'
          }`}
        >
          All Destinations ({hotels.length})
        </button>

        {citySummary.map(({ city, count }) => {
          const isSelected = focusedCity === city;
          return (
            <button
              key={city}
              onClick={() => handleFocusCity(city)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 transition-all border flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-amber-500 text-slate-950 font-black border-amber-400 shadow-md scale-[1.02]'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border-slate-800'
              }`}
            >
              <span>{city}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                isSelected ? 'bg-black/30 text-slate-950' : 'bg-slate-800 text-slate-400'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Floating Map Navigation Floating Actions (Zoom In, Zoom Out, Reset) */}
      <div className="absolute top-28 right-4 z-20 flex flex-col gap-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-800 p-1.5 rounded-2xl shadow-2xl">
        <button
          onClick={handleZoomIn}
          disabled={zoomLevel >= 3}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-30 transition-all"
          title="Zoom In (Expand Clusters)"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          disabled={zoomLevel <= 1}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-30 transition-all"
          title="Zoom Out (Group Clusters)"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleResetView}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all border-t border-slate-700/60"
          title="Reset Map View"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Interactive Map Pins Canvas Area */}
      <div className="relative flex-1 w-full h-full p-6 overflow-hidden">
        {clusters.map((cluster) => {
          const { x, y } = getProjectedCoordinates(cluster.latitude, cluster.longitude);
          const isSelected = selectedCluster?.id === cluster.id || (!cluster.isCluster && selectedPin?.id === cluster.hotels[0]?.id);

          // CASE 1: CLUSTER MARKER (Multiple Hotels in same city/region)
          if (cluster.isCluster) {
            const hotelCount = cluster.hotels.length;
            const cashbackEstTon = (cluster.minPrice * cashbackPercentage) / (100 * tonPriceUsd);

            return (
              <div
                key={cluster.id}
                onClick={() => handleMarkerClick(cluster)}
                style={{
                  left: `${x}%`,
                  top: `${y}%`
                }}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer transition-all duration-500 hover:z-30"
              >
                {/* Outer Glow / Ping Effect */}
                <div className="relative flex items-center justify-center">
                  <span className="absolute -inset-1.5 rounded-full bg-amber-500/30 animate-pulse" />
                  
                  {/* Cluster Pill Container */}
                  <div
                    className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-full border shadow-2xl transition-all ${
                      isSelected
                        ? 'bg-gradient-to-r from-amber-500 to-yellow-500 border-white text-slate-950 scale-125 z-40 shadow-amber-500/60'
                        : 'bg-slate-900/95 hover:bg-slate-800 border-amber-500/70 text-white hover:scale-110'
                    }`}
                  >
                    {/* Hotel Count Badge */}
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 shadow-sm ${
                      isSelected ? 'bg-black text-amber-400' : 'bg-amber-500 text-slate-950'
                    }`}>
                      {hotelCount}
                    </span>

                    {/* City & Starting Price */}
                    <div className="flex flex-col text-left leading-none pr-0.5">
                      <span className={`text-[10px] font-extrabold truncate max-w-[80px] ${
                        isSelected ? 'text-slate-950 font-black' : 'text-slate-200'
                      }`}>
                        {cluster.city}
                      </span>
                      <span className={`text-[9px] font-bold ${
                        isSelected ? 'text-slate-900' : 'text-emerald-400'
                      }`}>
                        from ${cluster.minPrice}
                      </span>
                    </div>

                    {/* Visual Cluster Stack Cue */}
                    <Layers className={`w-3 h-3 ${isSelected ? 'text-slate-950' : 'text-amber-400'}`} />
                  </div>
                </div>
              </div>
            );
          }

          // CASE 2: SINGLE HOTEL PIN
          const singleHotel = cluster.hotels[0];
          const isSingleSelected = selectedPin?.id === singleHotel.id;
          const cashbackTon = (singleHotel.pricePerNightUsd * cashbackPercentage) / (100 * tonPriceUsd);

          return (
            <div
              key={singleHotel.id}
              onClick={() => {
                setSelectedPin(singleHotel);
                setSelectedCluster(null);
              }}
              style={{
                left: `${x}%`,
                top: `${y}%`
              }}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer transition-all duration-300 hover:z-30"
            >
              <div className={`group relative flex items-center gap-1.5 px-3 py-1.5 rounded-full border shadow-xl transition-all ${
                isSingleSelected
                  ? 'bg-[#0088cc] border-white text-white scale-125 z-40 shadow-cyan-500/50'
                  : 'bg-slate-900/90 hover:bg-slate-800 border-cyan-500/50 text-slate-100 hover:scale-110'
              }`}>
                <MapPin className={`w-3.5 h-3.5 ${isSingleSelected ? 'text-white' : 'text-cyan-400'}`} />
                <span className="text-xs font-extrabold">${singleHotel.pricePerNightUsd}</span>
                <span className="text-[10px] text-emerald-300 font-bold bg-black/40 px-1.5 py-0.5 rounded-md">
                  +{cashbackTon.toFixed(1)}TON
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* CLUSTER EXPANSION DRAWER (When a multi-hotel cluster is selected) */}
      {selectedCluster && selectedCluster.isCluster && (
        <div className="absolute bottom-4 left-4 right-4 z-30 max-w-lg mx-auto bg-slate-900/95 backdrop-blur-md border border-amber-500/50 rounded-3xl p-4 shadow-2xl animate-fade-in space-y-3">
          {/* Cluster Drawer Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-white flex items-center gap-1.5">
                  <span>{selectedCluster.city}, {selectedCluster.country}</span>
                  <span className="bg-amber-500/20 text-amber-300 text-[10px] font-black px-2 py-0.2 rounded-full border border-amber-500/30">
                    {selectedCluster.hotels.length} Stays
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Select a property below or explore prices in this city
                </p>
              </div>
            </div>

            <button
              onClick={() => setSelectedCluster(null)}
              className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* List of Hotels in the Cluster */}
          <div className="space-y-2 max-h-52 overflow-y-auto pr-1 no-scrollbar">
            {selectedCluster.hotels.map((hotel) => {
              const isSelected = selectedPin?.id === hotel.id;
              const cashbackTon = (hotel.pricePerNightUsd * cashbackPercentage) / (100 * tonPriceUsd);
              const tag = (hotel.categoryTags && hotel.categoryTags[0]) || hotel.category || 'Luxury';
              const visual = getCategoryVisual(tag);

              return (
                <div
                  key={hotel.id}
                  onClick={() => setSelectedPin(hotel)}
                  className={`p-2.5 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                    isSelected
                      ? 'bg-slate-800 border-amber-400/80 shadow-md ring-1 ring-amber-400/40'
                      : 'bg-slate-950/80 hover:bg-slate-800/80 border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={hotel.images[0]}
                      alt={hotel.name}
                      className="w-12 h-12 rounded-xl object-cover shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                        <span className="flex items-center gap-0.5 text-amber-400 font-bold">
                          <Star className="w-2.5 h-2.5 fill-amber-400" />
                          <span>{hotel.rating.toFixed(2)}</span>
                        </span>
                        <span>•</span>
                        <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded-md border flex items-center gap-0.5 ${visual.badgeClass}`}>
                          <span>{visual.emoji}</span>
                          <span>{tag}</span>
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-white truncate">{hotel.name}</h4>
                      <div className="text-[11px] font-extrabold text-cyan-400">
                        ${hotel.pricePerNightUsd}
                        {showFiat && <span className="text-amber-300 font-semibold ml-1">({formatFiatEstimate(hotel.pricePerNightUsd, selectedCurrency, rates)})</span>}
                        <span className="text-emerald-400 font-bold ml-1.5">+{cashbackTon.toFixed(1)} TON</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectHotel(hotel);
                    }}
                    className="bg-[#0088cc] hover:bg-[#0077b3] text-white p-2 rounded-xl shadow-md transition-all shrink-0"
                    title="Book this stay"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SINGLE HOTEL FLOATING PREVIEW CARD (When no multi-hotel cluster drawer is open) */}
      {selectedPin && (!selectedCluster || !selectedCluster.isCluster) && (
        <div className="absolute bottom-4 left-4 right-4 z-30 max-w-md mx-auto bg-slate-900/95 backdrop-blur-md border border-cyan-500/40 rounded-3xl p-4 shadow-2xl animate-fade-in flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={selectedPin.images[0]}
              alt={selectedPin.name}
              className="w-16 h-16 rounded-2xl object-cover shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-[11px] text-amber-400 font-bold mb-0.5">
                <span className="flex items-center gap-1">
                  <Star className="w-3 h-3 fill-amber-400" />
                  <span>{selectedPin.rating.toFixed(2)}</span>
                </span>
                {(() => {
                  const tag = (selectedPin.categoryTags && selectedPin.categoryTags[0]) || selectedPin.category || 'Luxury';
                  const visual = getCategoryVisual(tag);
                  return (
                    <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded-md border flex items-center gap-0.5 ${visual.badgeClass}`}>
                      <span>{visual.emoji}</span>
                      <span>{tag}</span>
                    </span>
                  );
                })()}
                <span className="text-slate-400 font-normal truncate">({selectedPin.city})</span>
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
            title="Book Stay"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      )}

    </div>
  );
};
