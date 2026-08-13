import React, { useMemo } from 'react';
import { Hotel } from '../types';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts';
import { TrendingDown, TrendingUp, Sparkles, Calendar, Info } from 'lucide-react';

interface PriceHistoryChartProps {
  hotel: Hotel;
  tonPriceUsd: number;
}

export const PriceHistoryChart: React.FC<PriceHistoryChartProps> = ({
  hotel,
  tonPriceUsd
}) => {
  // Generate 30 days of synthetic price history based on hotel price and ID seed
  const data = useMemo(() => {
    const currentUsd = hotel.pricePerNightUsd;
    const baseTon = currentUsd / tonPriceUsd;
    const list = [];

    // Simple deterministic seed from hotel id
    let hash = 0;
    for (let i = 0; i < hotel.id.length; i++) {
      hash = (hash << 5) - hash + hotel.id.charCodeAt(i);
      hash |= 0;
    }

    const today = new Date();

    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      // Sine wave plus pseudo-random noise
      const dayOffset = Math.sin((i + Math.abs(hash % 7)) * 0.4) * 0.12;
      const noise = (((Math.abs(hash * (i + 1)) % 100) / 100) - 0.5) * 0.08;

      let factor = 1 + dayOffset + noise;
      // Day 0 (today) matches exact current price
      if (i === 0) factor = 1.0;

      const usdPrice = Math.round(currentUsd * factor);
      const tonPrice = Number((usdPrice / tonPriceUsd).toFixed(2));

      list.push({
        date: dateStr,
        usd: usdPrice,
        ton: tonPrice,
        isToday: i === 0
      });
    }

    return list;
  }, [hotel, tonPriceUsd]);

  const pricesTon = data.map((d) => d.ton);
  const minTon = Math.min(...pricesTon);
  const maxTon = Math.max(...pricesTon);
  const avgTon = Number((pricesTon.reduce((a, b) => a + b, 0) / pricesTon.length).toFixed(2));
  const currentTon = data[data.length - 1].ton;

  const isLowPrice = currentTon <= avgTon;
  const savingsPct = Math.round(((maxTon - currentTon) / maxTon) * 100);

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
            <Calendar className="w-3.5 h-3.5 text-[#0088cc]" />
            <span>30-Day TON Price History</span>
          </div>
          <p className="text-[11px] text-slate-400">Track rate fluctuations before booking</p>
        </div>

        {/* Dynamic Booking Recommendation Badge */}
        <div className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto border ${
          isLowPrice
            ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
            : 'bg-amber-950/80 text-amber-300 border-amber-500/40'
        }`}>
          {isLowPrice ? (
            <>
              <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />
              <span>Great Time to Book ({savingsPct}% below 30-day peak)</span>
            </>
          ) : (
            <>
              <Info className="w-3.5 h-3.5 text-amber-400" />
              <span>Above 30-Day Avg ({avgTon} TON)</span>
            </>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-2 text-center text-xs py-1">
        <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
          <div className="text-[10px] text-slate-400 font-medium">30-Day Low</div>
          <div className="text-sm font-black text-emerald-400 mt-0.5">{minTon} TON</div>
        </div>

        <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
          <div className="text-[10px] text-slate-400 font-medium">30-Day Average</div>
          <div className="text-sm font-black text-cyan-300 mt-0.5">{avgTon} TON</div>
        </div>

        <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
          <div className="text-[10px] text-slate-400 font-medium">30-Day High</div>
          <div className="text-sm font-black text-rose-400 mt-0.5">{maxTon} TON</div>
        </div>
      </div>

      {/* Recharts Area Chart */}
      <div className="h-44 w-full pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="tonGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0088cc" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#0088cc" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis
              dataKey="date"
              stroke="#64748b"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              interval={6}
            />
            <YAxis
              stroke="#64748b"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              domain={['dataMin - 2', 'dataMax + 2']}
              tickFormatter={(val) => `${val}`}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload;
                  return (
                    <div className="bg-slate-900 border border-slate-700 p-2 rounded-xl shadow-xl text-xs space-y-0.5">
                      <div className="text-slate-400 font-medium">{item.date} {item.isToday ? '(Today)' : ''}</div>
                      <div className="font-bold text-cyan-300">💎 {item.ton} TON</div>
                      <div className="text-[10px] text-slate-400">≈ ${item.usd} USD</div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <ReferenceLine y={avgTon} stroke="#a855f7" strokeDasharray="3 3" label={{ value: 'Avg', fill: '#a855f7', fontSize: 10, position: 'insideTopLeft' }} />
            <Area
              type="monotone"
              dataKey="ton"
              stroke="#0088cc"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#tonGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
