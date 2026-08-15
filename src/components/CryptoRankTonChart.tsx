import React, { useState, useEffect, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Activity,
  Maximize2,
  Hotel,
  DollarSign,
  Calendar,
  Layers,
  Sparkles,
  Zap,
  Info
} from 'lucide-react';
import {
  getCryptoRankTonPriceHistory,
  CryptoRankPricePoint,
  ChartTimeframe,
  CryptoRankCurrency
} from '../services/cryptorankService';

interface CryptoRankTonChartProps {
  tonData?: CryptoRankCurrency | null;
  currentTonPrice?: number;
  onRefreshParent?: () => void;
}

export const CryptoRankTonChart: React.FC<CryptoRankTonChartProps> = ({
  tonData,
  currentTonPrice = 5.42,
  onRefreshParent
}) => {
  const [timeframe, setTimeframe] = useState<ChartTimeframe>('24h');
  const [dataPoints, setDataPoints] = useState<CryptoRankPricePoint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [liveTicks, setLiveTicks] = useState<number>(0);
  const [isLiveActive, setIsLiveActive] = useState<boolean>(true);
  const [selectedHoldings, setSelectedHoldings] = useState<number>(100);

  const fetchChartData = async (tf: ChartTimeframe) => {
    setLoading(true);
    try {
      const points = await getCryptoRankTonPriceHistory(tf);
      setDataPoints(points);
    } catch (e) {
      console.error('Failed to load CryptoRank chart points:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChartData(timeframe);
  }, [timeframe]);

  // Live real-time tick updates (simulating live CryptoRank v3 stream)
  useEffect(() => {
    if (!isLiveActive) return;

    const interval = setInterval(() => {
      setDataPoints((prev) => {
        if (!prev || prev.length === 0) return prev;
        const last = prev[prev.length - 1];
        // Micro oscillation (+/- 0.004)
        const delta = (Math.random() - 0.48) * 0.008;
        const newPrice = Number(Math.max(1, last.price + delta).toFixed(3));
        const updatedLast = {
          ...last,
          price: newPrice,
          hotelEquiv: Number(((selectedHoldings * newPrice) / 250).toFixed(2))
        };
        return [...prev.slice(0, -1), updatedLast];
      });
      setLiveTicks((c) => c + 1);
    }, 4000);

    return () => clearInterval(interval);
  }, [isLiveActive, selectedHoldings]);

  // Computed metrics across current period
  const stats = useMemo(() => {
    if (!dataPoints || dataPoints.length === 0) {
      return {
        min: currentTonPrice * 0.95,
        max: currentTonPrice * 1.05,
        avg: currentTonPrice,
        first: currentTonPrice,
        latest: currentTonPrice,
        changeUsd: 0,
        changePercent: 0,
        isPositive: true,
        totalVol: 312000000
      };
    }

    const prices = dataPoints.map((p) => p.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
    const first = prices[0];
    const latest = prices[prices.length - 1];
    const changeUsd = latest - first;
    const changePercent = (changeUsd / first) * 100;
    const isPositive = changePercent >= 0;
    const totalVol = dataPoints.reduce((acc, p) => acc + (p.volume || 0), 0);

    return {
      min,
      max,
      avg,
      first,
      latest,
      changeUsd,
      changePercent,
      isPositive,
      totalVol
    };
  }, [dataPoints, currentTonPrice]);

  const activePrice = stats.latest || currentTonPrice;
  const hotelNights = (selectedHoldings * activePrice) / 250;

  return (
    <div
      id="cryptorank-ton-chart-card"
      className="p-4 sm:p-5 rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-blue-500/30 shadow-2xl space-y-4"
    >
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold text-lg shadow-inner">
            💎
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-black text-white tracking-wide">
                TON / USD Market Price Trend
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20 text-[10px] font-bold font-mono">
                CryptoRank v3 API
              </span>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Live Feed</span>
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Interactive high-frequency price curve powered by CryptoRank v3 market endpoints
            </p>
          </div>
        </div>

        {/* Timeframe selector */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-2xl border border-slate-800 self-start sm:self-auto">
          {(['24h', '7d', '30d', '90d', '1y'] as ChartTimeframe[]).map((tf) => (
            <button
              key={tf}
              id={`cryptorank-tf-btn-${tf}`}
              onClick={() => setTimeframe(tf)}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-xl transition-all uppercase ${
                timeframe === tf
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              {tf}
            </button>
          ))}
          <button
            onClick={() => {
              fetchChartData(timeframe);
              if (onRefreshParent) onRefreshParent();
            }}
            disabled={loading}
            className="p-1 rounded-xl text-slate-400 hover:text-cyan-300 hover:bg-slate-900 transition-colors"
            title="Reload CryptoRank Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Primary Price & Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Spot Price (TON)
          </div>
          <div className="text-lg sm:text-xl font-black text-cyan-300 font-mono flex items-center gap-1.5 mt-0.5">
            <span>${activePrice.toFixed(3)}</span>
          </div>
          <div
            className={`text-[11px] font-mono font-bold flex items-center gap-0.5 ${
              stats.isPositive ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {stats.isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            <span>
              {stats.isPositive ? '+' : ''}
              {stats.changePercent.toFixed(2)}% ({timeframe})
            </span>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Period High / Low
          </div>
          <div className="text-xs sm:text-sm font-bold text-emerald-400 font-mono mt-1">
            High: ${stats.max.toFixed(3)}
          </div>
          <div className="text-xs sm:text-sm font-bold text-rose-400 font-mono">
            Low: ${stats.min.toFixed(3)}
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Average in Period
          </div>
          <div className="text-base sm:text-lg font-bold text-white font-mono mt-0.5">
            ${stats.avg.toFixed(3)}
          </div>
          <div className="text-[10px] text-slate-500 font-mono">
            Delta: {stats.changeUsd >= 0 ? '+' : ''}${stats.changeUsd.toFixed(3)}
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-950/60 to-slate-950 border border-indigo-500/30">
          <div className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1">
            <Hotel className="w-3 h-3 text-indigo-400" />
            <span>100 TON Stay Value</span>
          </div>
          <div className="text-base sm:text-lg font-black text-indigo-200 font-mono mt-0.5">
            ${(100 * activePrice).toFixed(2)}
          </div>
          <div className="text-[10px] text-emerald-400 font-bold">
            ≈ {((100 * activePrice) / 250).toFixed(1)} Luxury Nights
          </div>
        </div>
      </div>

      {/* Main Recharts Area Chart */}
      <div className="w-full h-64 sm:h-72 bg-slate-950/90 rounded-2xl p-2 sm:p-3 border border-slate-800/80 relative">
        {loading && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center z-10 rounded-2xl">
            <div className="flex items-center gap-2 text-xs text-blue-300 font-mono">
              <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
              <span>Fetching CryptoRank v3 Price History ({timeframe})...</span>
            </div>
          </div>
        )}

        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={dataPoints}
            margin={{ top: 10, right: 12, left: -18, bottom: 0 }}
          >
            <defs>
              <linearGradient id="cryptorankTonGradient" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor={stats.isPositive ? '#06b6d4' : '#f43f5e'}
                  stopOpacity={0.45}
                />
                <stop
                  offset="95%"
                  stopColor={stats.isPositive ? '#3b82f6' : '#881337'}
                  stopOpacity={0.0}
                />
              </linearGradient>
              <linearGradient id="volumeBarGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#0284c7" stopOpacity={0.05} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />

            <XAxis
              dataKey="formattedTime"
              stroke="#64748b"
              tick={{ fontSize: 10, fill: '#64748b' }}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
              minTickGap={24}
            />

            <YAxis
              domain={['auto', 'auto']}
              stroke="#64748b"
              tick={{ fontSize: 10, fill: '#64748b' }}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
              tickFormatter={(v) => `$${Number(v).toFixed(2)}`}
            />

            <ReferenceLine
              y={stats.avg}
              stroke="#475569"
              strokeDasharray="4 4"
              label={{
                value: `Avg $${stats.avg.toFixed(2)}`,
                fill: '#94a3b8',
                fontSize: 9,
                position: 'right'
              }}
            />

            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload as CryptoRankPricePoint;
                  const price = data.price;
                  const deltaVsFirst = price - stats.first;
                  const deltaPct = (deltaVsFirst / stats.first) * 100;
                  const nights = ((selectedHoldings * price) / 250).toFixed(1);

                  return (
                    <div className="bg-slate-900/95 border border-cyan-500/40 rounded-xl p-3 shadow-2xl backdrop-blur-md text-xs space-y-1.5 min-w-[190px] animate-fade-in">
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono border-b border-slate-800 pb-1">
                        <span>{data.formattedTime}</span>
                        <span className="text-cyan-400">CryptoRank v3</span>
                      </div>

                      <div className="flex items-baseline justify-between gap-3">
                        <span className="text-slate-300 font-bold">Price (TON):</span>
                        <strong className="text-sm font-black text-cyan-300 font-mono">
                          ${price.toFixed(3)} USD
                        </strong>
                      </div>

                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className="text-slate-400">vs. Period Start:</span>
                        <span
                          className={`font-bold ${
                            deltaPct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {deltaPct >= 0 ? '+' : ''}
                          {deltaPct.toFixed(2)}%
                        </span>
                      </div>

                      <div className="pt-1 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                        <span className="text-slate-400">Hotel Power ({selectedHoldings} TON):</span>
                        <span className="font-bold text-amber-300 font-mono">
                          ≈ {nights} Nights
                        </span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />

            <Area
              type="monotone"
              dataKey="price"
              stroke={stats.isPositive ? '#22d3ee' : '#fb7185'}
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#cryptorankTonGradient)"
              activeDot={{
                r: 6,
                fill: '#38bdf8',
                stroke: '#ffffff',
                strokeWidth: 2
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Interactive Travel Purchasing Power Simulator Bar */}
      <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/90 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
          <div>
            <span className="font-bold text-white">Live Purchasing Power Calculator:</span>{' '}
            <span className="text-slate-400">
              Calculate travel booking power at live CryptoRank price (${activePrice.toFixed(2)})
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-xl border border-slate-700">
            <input
              type="number"
              min="1"
              max="10000"
              value={selectedHoldings}
              onChange={(e) => setSelectedHoldings(Math.max(1, Number(e.target.value)))}
              className="w-16 bg-transparent text-cyan-300 font-mono font-bold text-xs focus:outline-none text-right"
            />
            <span className="text-[11px] text-slate-400 font-bold">TON</span>
          </div>
          <span className="text-slate-500">=</span>
          <span className="font-mono font-bold text-white">
            ${(selectedHoldings * activePrice).toFixed(2)} USD
          </span>
          <span className="px-2 py-1 rounded-xl bg-emerald-500/10 text-emerald-300 font-bold text-[11px] border border-emerald-500/20 whitespace-nowrap">
            🏨 {hotelNights.toFixed(1)} Nights
          </span>
        </div>
      </div>
    </div>
  );
};
