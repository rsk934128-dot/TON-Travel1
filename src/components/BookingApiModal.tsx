import React, { useState, useEffect } from 'react';
import {
  Globe2,
  X,
  CheckCircle2,
  RefreshCw,
  Search,
  Sparkles,
  Zap,
  Key,
  ShieldCheck,
  Building2,
  ExternalLink,
  Layers,
  ArrowRight,
  Code2,
  Terminal,
  FileJson,
  Play,
  Coins,
  Database,
  Trash2,
  Gauge,
  HardDrive,
  Clock,
  Check
} from 'lucide-react';
import { BookingApiStatus, BookingLocationResult } from '../types';
import {
  getBookingApiStatus,
  searchBookingLocations,
  getSavedBookingApiKey,
  saveBookingApiKey,
  getSavedBookingDemandToken,
  saveBookingDemandToken,
  getSavedBookingAffiliateId,
  saveBookingAffiliateId,
  searchBookingDemandApi,
  clearBookingCache,
  getBookingCacheStats
} from '../services/bookingApiService';
import { CacheStats } from '../services/bookingCacheService';
import { AccentTheme, THEMES } from '../utils/theme';
import { addToast } from '../services/toastService';

interface BookingApiModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme?: AccentTheme;
  tonPriceUsd: number;
  onSelectCity?: (cityName: string) => void;
}

export const BookingApiModal: React.FC<BookingApiModalProps> = ({
  isOpen,
  onClose,
  currentTheme = 'blue',
  tonPriceUsd = 5.42,
  onSelectCity
}) => {
  const [activeTab, setActiveTab] = useState<'demand_v31' | 'cache_engine' | 'destinations' | 'architecture'>('demand_v31');
  const [statusData, setStatusData] = useState<BookingApiStatus | null>(null);
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Credentials
  const [demandTokenInput, setDemandTokenInput] = useState<string>(() => getSavedBookingDemandToken());
  const [affiliateIdInput, setAffiliateIdInput] = useState<string>(() => getSavedBookingAffiliateId());
  const [rapidApiKeyInput, setRapidApiKeyInput] = useState<string>(() => getSavedBookingApiKey());
  const [isSaved, setIsSaved] = useState<boolean>(false);
  
  // Demand API v3.1 Test Execution
  const [demandCityId, setDemandCityId] = useState<number>(-2140479); // Amsterdam / Global
  const [demandCountry, setDemandCountry] = useState<string>('nl');
  const [bypassCache, setBypassCache] = useState<boolean>(false);
  const [isTestingDemand, setIsTestingDemand] = useState<boolean>(false);
  const [demandResponseData, setDemandResponseData] = useState<any>(null);
  const [executionTimeMs, setExecutionTimeMs] = useState<number | null>(null);

  // Destination Search
  const [testQuery, setTestQuery] = useState<string>('Paris');
  const [testResults, setTestResults] = useState<BookingLocationResult[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  
  const themeDef = THEMES[currentTheme];

  const fetchStatus = async () => {
    setIsLoading(true);
    try {
      const data = await getBookingApiStatus();
      setStatusData(data);
      const stats = await getBookingCacheStats();
      setCacheStats(stats);
    } catch (e) {
      console.warn('Failed to load Booking API status:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
      handleRunTestSearch('Paris');
    }
  }, [isOpen]);

  const handleSaveCredentials = () => {
    saveBookingDemandToken(demandTokenInput);
    saveBookingAffiliateId(affiliateIdInput);
    saveBookingApiKey(rapidApiKeyInput);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
    fetchStatus();
    addToast({
      title: 'Booking.com API Credentials Saved',
      message: 'Demand API v3.1 & Resilience Gateway synchronized',
      type: 'success'
    });
  };

  const handleRunDemandApiSearch = async () => {
    setIsTestingDemand(true);
    const start = performance.now();
    try {
      const resp = await searchBookingDemandApi({
        country: demandCountry,
        city: demandCityId,
        adults: 2,
        rooms: 1,
        forceRefresh: bypassCache
      });
      const end = performance.now();
      const elapsed = Math.round(end - start);
      setExecutionTimeMs(elapsed);
      setDemandResponseData(resp);
      
      const stats = await getBookingCacheStats();
      setCacheStats(stats);

      addToast({
        title: resp?.fromLocalCache ? '⚡ Loaded from Local Cache' : 'Demand API v3.1 Executed',
        message: resp?.fromLocalCache
          ? `Instant zero-network load in ${elapsed}ms (${stats.storageType})`
          : `Fetched in ${elapsed}ms & cached to ${stats.storageType}`,
        type: resp?.fromLocalCache ? 'info' : 'success'
      });
    } catch (err) {
      console.warn('Demand API search execution failed:', err);
    } finally {
      setIsTestingDemand(false);
    }
  };

  const handleClearCache = async () => {
    await clearBookingCache();
    const stats = await getBookingCacheStats();
    setCacheStats(stats);
    setDemandResponseData(null);
    setExecutionTimeMs(null);
    addToast({
      title: 'Local Cache Cleared',
      message: 'IndexedDB and LocalStorage cache purged successfully',
      type: 'info'
    });
  };

  const handleRunTestSearch = async (query: string) => {
    setIsSearching(true);
    try {
      const results = await searchBookingLocations(query);
      setTestResults(results);
    } catch (err) {
      console.warn('Test search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="booking-api-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="booking-api-modal-container"
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between gap-3 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div
              className="p-2.5 rounded-2xl border text-white shadow-lg shrink-0"
              style={{ backgroundColor: `${themeDef.primaryHex}20`, borderColor: `${themeDef.primaryHex}40` }}
            >
              <Globe2 className="w-6 h-6" style={{ color: themeDef.primaryHex }} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                  Booking.com Demand API v3.1
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  IndexedDB Cache Active
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Official Demand API v3.1 • Local Caching Layer (IndexedDB / LocalStorage) • Instant TON Cashback
              </p>
            </div>
          </div>

          <button
            type="button"
            id="close-booking-api-modal-btn"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center border-b border-slate-800 bg-slate-950/50 px-4 pt-2 gap-1.5 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('demand_v31')}
            className={`px-3 py-2 text-xs font-bold rounded-t-xl transition-all flex items-center gap-1.5 border-b-2 shrink-0 ${
              activeTab === 'demand_v31'
                ? 'border-cyan-500 text-cyan-300 bg-slate-900/80'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Demand API Runner</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('cache_engine')}
            className={`px-3 py-2 text-xs font-bold rounded-t-xl transition-all flex items-center gap-1.5 border-b-2 shrink-0 ${
              activeTab === 'cache_engine'
                ? 'border-cyan-500 text-cyan-300 bg-slate-900/80'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Local Cache Engine</span>
            {cacheStats && cacheStats.totalEntries > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-cyan-500/20 text-cyan-300 font-mono">
                {cacheStats.totalEntries}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('destinations')}
            className={`px-3 py-2 text-xs font-bold rounded-t-xl transition-all flex items-center gap-1.5 border-b-2 shrink-0 ${
              activeTab === 'destinations'
                ? 'border-cyan-500 text-cyan-300 bg-slate-900/80'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Destinations</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('architecture')}
            className={`px-3 py-2 text-xs font-bold rounded-t-xl transition-all flex items-center gap-1.5 border-b-2 shrink-0 ${
              activeTab === 'architecture'
                ? 'border-cyan-500 text-cyan-300 bg-slate-900/80'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Architecture</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 text-slate-200">
          
          {/* Status Diagnostic Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Storage Engine</span>
              <span className="text-xs font-extrabold text-emerald-400 flex items-center gap-1 mt-1 truncate">
                <Database className="w-3.5 h-3.5 shrink-0" />
                {cacheStats?.storageType || 'IndexedDB'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Cached Queries</span>
              <span className="text-xs font-extrabold text-cyan-300 mt-1">
                {cacheStats?.totalEntries || 0} Entries (Hit: {cacheStats?.hitsCount || 0})
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Latency Saved</span>
              <span className="text-xs font-extrabold text-purple-300 mt-1 font-mono">
                ⚡ ~{cacheStats?.estimatedLatencySavedMs || 0}ms
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">TON Cashback</span>
              <span className="text-xs font-extrabold text-amber-300 mt-1">
                5% – 8% Instant
              </span>
            </div>
          </div>

          {/* TAB 1: Demand API v3.1 Runner */}
          {activeTab === 'demand_v31' && (
            <div className="space-y-4">
              {/* Credentials Form */}
              <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Official Booking.com Demand API v3.1 Credentials
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    Endpoint: demandapi.booking.com/3.1/accommodations/search
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-bold text-slate-300 mb-1 block">
                      Bearer Authorization Token (Optional / Customizable)
                    </label>
                    <input
                      type="password"
                      value={demandTokenInput}
                      onChange={(e) => setDemandTokenInput(e.target.value)}
                      placeholder="Bearer <YOUR_string_HERE>"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-300 mb-1 block">
                      X-Affiliate-Id
                    </label>
                    <input
                      type="text"
                      value={affiliateIdInput}
                      onChange={(e) => setAffiliateIdInput(e.target.value)}
                      placeholder="0"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <p className="text-[11px] text-slate-400">
                    টোকেন সংরক্ষিত থাকলে সরাসরি Booking.com এপিআই থেকে ডাটা আসবে এবং লোকাল ক্যাশে সেভ হবে।
                  </p>
                  <button
                    type="button"
                    onClick={handleSaveCredentials}
                    className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-extrabold transition-all active:scale-95 shadow-md shadow-cyan-600/20"
                  >
                    {isSaved ? '✓ Saved' : 'Save Credentials'}
                  </button>
                </div>
              </div>

              {/* Live Demand API Payload Tester with Cache benchmark */}
              <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      POST /3.1/accommodations/search Live Runner
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={bypassCache}
                        onChange={(e) => setBypassCache(e.target.checked)}
                        className="rounded border-slate-700 text-cyan-500 focus:ring-0 bg-slate-900"
                      />
                      <span className="text-[11px]">Bypass Cache</span>
                    </label>

                    <button
                      type="button"
                      onClick={handleRunDemandApiSearch}
                      disabled={isTestingDemand}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-md shadow-emerald-600/20 active:scale-95 disabled:opacity-50"
                    >
                      <Play className={`w-3.5 h-3.5 fill-current ${isTestingDemand ? 'animate-spin' : ''}`} />
                      <span>{isTestingDemand ? 'Executing...' : 'Run Query'}</span>
                    </button>
                  </div>
                </div>

                {/* Benchmark Performance Badge */}
                {executionTimeMs !== null && (
                  <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Gauge className="w-4 h-4 text-cyan-400" />
                      <span>
                        Response Time: <strong className="text-white font-mono">{executionTimeMs}ms</strong>
                      </span>
                    </div>
                    {demandResponseData?.fromLocalCache ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                        <Zap className="w-3 h-3 text-emerald-400" />
                        Cached (0-Network Overhead)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        Network Live Sync &rarr; Saved to Cache
                      </span>
                    )}
                  </div>
                )}

                {/* Pre-formatted Request Code Visualizer */}
                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 font-mono text-[11px] text-slate-300 space-y-1 overflow-x-auto">
                  <div className="text-cyan-400 font-bold">POST https://demandapi.booking.com/3.1/accommodations/search</div>
                  <div className="text-slate-400">Headers:</div>
                  <div className="text-slate-300 pl-3">
                    Content-Type: application/json<br />
                    X-Affiliate-Id: {affiliateIdInput || '0'}<br />
                    Authorization: Bearer {demandTokenInput ? '••••••••' : '&lt;TON_GATEWAY_MANAGED&gt;'}
                  </div>
                  <div className="text-slate-400 pt-1">Body Payload:</div>
                  <pre className="text-emerald-300 text-[10px] pl-3 leading-relaxed">
{`{
  "booker": { "country": "${demandCountry}", "platform": "desktop" },
  "checkin": "2026-09-10",
  "checkout": "2026-09-13",
  "city": ${demandCityId},
  "extras": ["extra_charges", "products"],
  "guests": { "number_of_adults": 2, "number_of_rooms": 1 }
}`}
                  </pre>
                </div>

                {/* Response Visualizer */}
                {demandResponseData && (
                  <div className="p-3 rounded-xl bg-slate-900/95 border border-cyan-500/30 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-cyan-300 font-bold">
                        <FileJson className="w-4 h-4" />
                        <span>Response ({demandResponseData.source || 'Local Cache'})</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 font-mono">
                        200 OK
                      </span>
                    </div>

                    <pre className="p-2.5 rounded-lg bg-slate-950 font-mono text-[10px] text-slate-300 max-h-40 overflow-y-auto leading-relaxed border border-slate-800">
                      {JSON.stringify(demandResponseData, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Local Cache Engine */}
          {activeTab === 'cache_engine' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-cyan-400" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      IndexedDB & LocalStorage Dual Caching Layer
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearCache}
                    className="px-3 py-1.5 rounded-xl bg-rose-950/70 hover:bg-rose-900 border border-rose-500/30 text-rose-300 text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear Cache</span>
                  </button>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  The local caching layer persistently stores Booking.com Demand API responses in the browser (IndexedDB) with a 30-minute TTL for search queries and 2-hour TTL for location autocomplete. This eliminates redundant network round-trips and makes accommodation browsing instant.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Cache Engine</span>
                    <span className="text-xs font-extrabold text-emerald-400 mt-1 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      {cacheStats?.storageType || 'IndexedDB'}
                    </span>
                    <span className="text-[10px] text-slate-500 mt-0.5">Auto-fallback enabled</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Cache Hit Ratio</span>
                    <span className="text-xs font-extrabold text-cyan-300 mt-1">
                      {cacheStats ? `${cacheStats.hitsCount} hits / ${cacheStats.hitsCount + cacheStats.missesCount} queries` : '0 queries'}
                    </span>
                    <span className="text-[10px] text-slate-500 mt-0.5">Saves ~140ms per hit</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Cache Expiry Policy</span>
                    <span className="text-xs font-extrabold text-purple-300 mt-1 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      30 min (Auto-prune)
                    </span>
                    <span className="text-[10px] text-slate-500 mt-0.5">LRU Eviction Active</span>
                  </div>
                </div>
              </div>

              {/* Cached Keys Inventory */}
              <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-white">
                  <span>Active Cache Keys Inventory</span>
                  <span className="text-[11px] text-slate-400 font-normal">
                    {cacheStats?.cachedKeys.length || 0} items stored
                  </span>
                </div>

                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {cacheStats && cacheStats.cachedKeys.length > 0 ? (
                    cacheStats.cachedKeys.map((key) => (
                      <div
                        key={key}
                        className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-300"
                      >
                        <span className="truncate pr-2">{key}</span>
                        <span className="px-2 py-0.5 rounded-md bg-cyan-950 border border-cyan-500/20 text-cyan-300 text-[10px] shrink-0">
                          Active
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-xs text-slate-500 bg-slate-900/50 rounded-xl border border-slate-800/80">
                      No active cache keys stored yet. Run a Demand API query or search hotels to populate.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Destination Explorer */}
          {activeTab === 'destinations' && (
            <div className="space-y-3">
              <div className="flex items-center gap-1.5 flex-wrap">
                {['Paris', 'Bali', 'Dubai', 'Tokyo', 'London', 'New York', 'Bangkok', 'Amsterdam'].map((city) => (
                  <button
                    key={city}
                    type="button"
                    onClick={() => {
                      setTestQuery(city);
                      handleRunTestSearch(city);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      testQuery.toLowerCase() === city.toLowerCase()
                        ? 'bg-cyan-500 text-white shadow-sm'
                        : 'bg-slate-900 border border-slate-700 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {city}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={testQuery}
                    onChange={(e) => {
                      setTestQuery(e.target.value);
                      handleRunTestSearch(e.target.value);
                    }}
                    placeholder="Search any global destination..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleRunTestSearch(testQuery)}
                  disabled={isSearching}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs transition-all disabled:opacity-50"
                  title="Refresh Search"
                >
                  <RefreshCw className={`w-4 h-4 ${isSearching ? 'animate-spin text-cyan-400' : ''}`} />
                </button>
              </div>

              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {testResults.length > 0 ? (
                  testResults.map((loc) => (
                    <div
                      key={loc.dest_id}
                      className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800/90 hover:border-slate-700 flex items-center justify-between gap-2 text-xs transition-all"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Building2 className="w-4 h-4 text-cyan-400 shrink-0" />
                        <div className="truncate">
                          <span className="font-extrabold text-white">{loc.name}</span>
                          <span className="text-slate-400 ml-1.5 text-[11px] truncate">
                            ({loc.country}) • {loc.hotels_count ? `${loc.hotels_count.toLocaleString()} Hotels` : 'Available'}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (onSelectCity) {
                            onSelectCity(loc.name);
                            onClose();
                            addToast({
                              title: `Filtered: ${loc.name}`,
                              message: `Showing Booking.com partner hotels in ${loc.name}`,
                              type: 'info'
                            });
                          }
                        }}
                        className="px-2.5 py-1 rounded-lg bg-cyan-950/70 hover:bg-cyan-900 border border-cyan-500/30 text-cyan-300 font-bold text-[11px] flex items-center gap-1 shrink-0 transition-all"
                      >
                        <span>Explore</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="p-3 text-center text-xs text-slate-500">
                    {isSearching ? 'Searching Booking.com destinations...' : 'No destination matched.'}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: Architecture Overview */}
          {activeTab === 'architecture' && (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-950/40 via-slate-950 to-slate-900 border border-blue-900/40 space-y-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0" />
                <h4 className="text-xs sm:text-sm font-black text-white tracking-tight">
                  লাইফ টাইম কাজ করার আর্কিটেকচার (Lifetime Zero-Downtime Guarantee)
                </h4>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                বুকিং ডট কম এপিআই ইন্টিগ্রেশনটিতে **Booking.com Demand API v3.1 স্পেসিফিকেশন** ও **IndexedDB লোকাল ক্যাশিং লেয়ার** হুবহু কনফিগার করা হয়েছে।
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-start gap-2">
                  <Database className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[11px] font-bold text-white">IndexedDB Local Cache</div>
                    <div className="text-[10px] text-slate-400">০-নেটওয়ার্ক ইনস্ট্যান্ট লোডিং</div>
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-start gap-2">
                  <Coins className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[11px] font-bold text-white">TON Cashback Engine</div>
                    <div className="text-[10px] text-slate-400">৫% থেকে ৮% ইনস্ট্যান্ট পেআউট</div>
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-start gap-2">
                  <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[11px] font-bold text-white">Zero-Downtime Proxy</div>
                    <div className="text-[10px] text-slate-400">সার্ভার-সাইড সিকিউর প্রক্সি</div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>TON Cashback Rate: <strong>5% – 8%</strong> (TON Price: ${tonPriceUsd.toFixed(2)})</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
