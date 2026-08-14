import React, { useState } from 'react';
import {
  ShieldCheck,
  X,
  Crown,
  Users,
  Building2,
  Receipt,
  Sparkles,
  TrendingUp,
  DollarSign,
  Gift,
  Search,
  CheckCircle2,
  AlertTriangle,
  Plus,
  RefreshCw,
  Zap,
  Mail,
  Cloud,
  Layers,
  Edit3,
  Percent,
  Sliders,
  Check,
  Trash2,
  Send,
  Eye,
  Activity
} from 'lucide-react';
import { Booking, Hotel, UserState } from '../types';
import { ADMIN_EMAILS, isAdminEmail, computeAdminStats } from '../utils/admin';
import { AccentTheme, THEMES } from '../utils/theme';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  userState: UserState;
  onUpdateUserState: (updater: (prev: UserState) => UserState) => void;
  bookings: Booking[];
  onUpdateBookings: (updater: (prev: Booking[]) => Booking[]) => void;
  hotels: Hotel[];
  onUpdateHotels: (updater: (prev: Hotel[]) => Hotel[]) => void;
  currentTheme?: AccentTheme;
  activeAdminEmail?: string;
  onSelectAdminEmail?: (email: string) => void;
}

type AdminTab = 'overview' | 'bookings' | 'hotels' | 'cashback' | 'admins';

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  isOpen,
  onClose,
  userState,
  onUpdateUserState,
  bookings,
  onUpdateBookings,
  hotels,
  onUpdateHotels,
  currentTheme = 'blue',
  activeAdminEmail = ADMIN_EMAILS[0],
  onSelectAdminEmail
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [bookingFilter, setBookingFilter] = useState<'All' | 'Confirmed' | 'Completed' | 'Cancelled'>('All');
  const [bookingSearch, setBookingSearch] = useState('');
  const [hotelSearch, setHotelSearch] = useState('');
  
  // Quick Cashback Grant Form
  const [airdropAmount, setAirdropAmount] = useState<string>('5.00');
  const [airdropTargetWallet, setAirdropTargetWallet] = useState<string>(userState.connectedWallet || 'EQBvW839_TonSpace_cX92');
  const [airdropSuccess, setAirdropSuccess] = useState<string | null>(null);

  // Global Announcement
  const [announcementText, setAnnouncementText] = useState<string>('🎉 Super Admin Summer Promotion: Enjoy +2% Extra TON Cashback on all Luxury Villas!');
  const [isAnnouncementActive, setIsAnnouncementActive] = useState<boolean>(true);
  const [announcementSaved, setAnnouncementSaved] = useState<boolean>(false);

  const themeDef = THEMES[currentTheme];
  const stats = computeAdminStats(bookings, hotels.length, userState.tonPriceUsd);

  if (!isOpen) return null;

  const filteredBookings = bookings.filter((b) => {
    const matchesFilter = bookingFilter === 'All' || b.status === bookingFilter;
    const matchesSearch =
      b.hotelName.toLowerCase().includes(bookingSearch.toLowerCase()) ||
      b.id.toLowerCase().includes(bookingSearch.toLowerCase()) ||
      b.guestName.toLowerCase().includes(bookingSearch.toLowerCase()) ||
      b.guestEmail.toLowerCase().includes(bookingSearch.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const filteredHotels = hotels.filter((h) => {
    return (
      h.name.toLowerCase().includes(hotelSearch.toLowerCase()) ||
      h.city.toLowerCase().includes(hotelSearch.toLowerCase()) ||
      h.country.toLowerCase().includes(hotelSearch.toLowerCase())
    );
  });

  const handleUpdateBookingStatus = (bookingId: string, newStatus: 'Confirmed' | 'Completed' | 'Cancelled') => {
    onUpdateBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b))
    );
  };

  const handleApplyGlobalDiscount = (percent: number) => {
    onUpdateHotels((prev) =>
      prev.map((h) => ({
        ...h,
        discountUsd: Math.round(h.pricePerNightUsd * (percent / 100))
      }))
    );
  };

  const handleToggleHotelPopular = (hotelId: string) => {
    onUpdateHotels((prev) =>
      prev.map((h) => (h.id === hotelId ? { ...h, popular: !h.popular } : h))
    );
  };

  const handleAdjustHotelPrice = (hotelId: string, newPrice: number) => {
    if (isNaN(newPrice) || newPrice <= 0) return;
    onUpdateHotels((prev) =>
      prev.map((h) => (h.id === hotelId ? { ...h, pricePerNightUsd: newPrice } : h))
    );
  };

  const handleExecuteAirdrop = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(airdropAmount);
    if (isNaN(amount) || amount <= 0) return;

    onUpdateUserState((prev) => ({
      ...prev,
      tonBalance: Number((prev.tonBalance + amount).toFixed(3))
    }));

    setAirdropSuccess(`Successfully credited +${amount.toFixed(2)} TON cashback to wallet ${airdropTargetWallet.slice(0, 10)}...`);
    setTimeout(() => setAirdropSuccess(null), 4000);
  };

  const handleToggleTelegramPremium = () => {
    onUpdateUserState((prev) => ({
      ...prev,
      isTelegramPremium: !prev.isTelegramPremium
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-amber-500/40 rounded-3xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-fade-in text-slate-100">
        {/* Admin Header */}
        <div className="bg-gradient-to-r from-amber-950/70 via-slate-900 to-indigo-950/70 border-b border-amber-500/30 p-4 sm:p-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/20">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-white tracking-wide">
                  TON Travel Admin Control Portal
                </h2>
                <span className="bg-amber-500/20 border border-amber-500/50 text-amber-300 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Super Admin
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Authorized Admins: <strong className="text-amber-300 font-mono">rubelbank92@gmail.com</strong> & <strong className="text-amber-300 font-mono">rubels1k994@gmail.com</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Active Admin Switcher */}
            <div className="hidden md:flex items-center gap-1 bg-slate-950/80 border border-amber-500/30 rounded-xl px-2.5 py-1 text-xs">
              <span className="text-slate-400">Current Operator:</span>
              <select
                value={activeAdminEmail}
                onChange={(e) => onSelectAdminEmail && onSelectAdminEmail(e.target.value)}
                className="bg-transparent text-amber-300 font-semibold text-xs focus:outline-none cursor-pointer"
              >
                {ADMIN_EMAILS.map((email) => (
                  <option key={email} value={email} className="bg-slate-900 text-white">
                    {email}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-slate-950/60 border-b border-slate-800 px-4 flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-3.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Dashboard & Metrics</span>
          </button>

          <button
            onClick={() => setActiveTab('bookings')}
            className={`py-3 px-3.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'bookings'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Bookings & Vouchers ({bookings.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('hotels')}
            className={`py-3 px-3.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'hotels'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Hotels & Rates ({hotels.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('cashback')}
            className={`py-3 px-3.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'cashback'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Gift className="w-4 h-4" />
            <span>Cashback & VIP Airdrop</span>
          </button>

          <button
            onClick={() => setActiveTab('admins')}
            className={`py-3 px-3.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'admins'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Admin Roster & Health</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stat Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-slate-400 text-xs">
                    <span>Gross Volume (GMV)</span>
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-white">
                    ${stats.totalGrossVolumeUsd.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-cyan-400 font-mono">
                    ≈ {stats.totalGrossVolumeTon.toFixed(2)} TON
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-slate-400 text-xs">
                    <span>Cashback Disbursed</span>
                    <Gift className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-cyan-300 font-mono">
                    +{stats.totalCashbackDisbursedTon.toFixed(2)} TON
                  </div>
                  <div className="text-[11px] text-slate-400">
                    ≈ ${stats.totalCashbackDisbursedUsd.toFixed(2)} USD
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-slate-400 text-xs">
                    <span>Total Reservations</span>
                    <Receipt className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-white">
                    {stats.totalBookingsCount}
                  </div>
                  <div className="text-[11px] text-emerald-400">
                    {stats.confirmedBookingsCount} Confirmed • {stats.completedBookingsCount} Completed
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-slate-400 text-xs">
                    <span>Active Properties</span>
                    <Building2 className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-white">
                    {stats.activeHotelsCount}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Worldwide destinations
                  </div>
                </div>
              </div>

              {/* Broadcast Announcement Bar */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-950 to-blue-950/40 border border-amber-500/30 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-amber-300">
                      Live Guest Broadcast Banner
                    </h3>
                  </div>
                  <span className="text-[10px] text-slate-400">Pushed to all active mini app sessions</span>
                </div>

                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                  <input
                    type="text"
                    value={announcementText}
                    onChange={(e) => setAnnouncementText(e.target.value)}
                    placeholder="Enter broadcast alert message..."
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setAnnouncementSaved(true);
                      setTimeout(() => setAnnouncementSaved(false), 2000);
                    }}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-md active:scale-95"
                  >
                    {announcementSaved ? <Check className="w-4 h-4 text-slate-950" /> : <Send className="w-4 h-4" />}
                    <span>{announcementSaved ? 'Broadcast Active' : 'Broadcast Message'}</span>
                  </button>
                </div>
              </div>

              {/* Recent Booking Activity Feed */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
                  <span>Recent Platform Bookings</span>
                  <span className="text-[11px] text-amber-400">{bookings.length} Total Bookings</span>
                </h3>

                <div className="space-y-2">
                  {bookings.slice(0, 3).map((b) => (
                    <div
                      key={b.id}
                      className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center justify-between gap-3 flex-wrap text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={b.hotelImage}
                          alt={b.hotelName}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                        <div>
                          <div className="font-bold text-white flex items-center gap-2">
                            <span>{b.hotelName}</span>
                            <span className="text-[10px] font-mono bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded">
                              {b.id}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {b.guestName} ({b.guestEmail}) • {b.nights} nights
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="font-bold text-white">${b.totalPriceUsd}</div>
                          <div className="text-[10px] text-cyan-400 font-mono">+{b.cashbackTon.toFixed(2)} TON Cashback</div>
                        </div>
                        <span
                          className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full ${
                            b.status === 'Confirmed'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : b.status === 'Completed'
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          }`}
                        >
                          {b.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BOOKINGS MANAGEMENT */}
          {activeTab === 'bookings' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                {/* Search Bar */}
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={bookingSearch}
                    onChange={(e) => setBookingSearch(e.target.value)}
                    placeholder="Search by hotel, booking ID, guest email..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 p-1 rounded-xl text-xs font-semibold">
                  {(['All', 'Confirmed', 'Completed', 'Cancelled'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setBookingFilter(filter)}
                      className={`px-3 py-1 rounded-lg transition-all ${
                        bookingFilter === filter
                          ? 'bg-amber-500 text-slate-950 font-bold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bookings Table / List */}
              <div className="space-y-2.5">
                {filteredBookings.map((b) => (
                  <div
                    key={b.id}
                    className="p-4 bg-slate-950/80 border border-slate-800/90 rounded-2xl space-y-3"
                  >
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-3">
                        <img
                          src={b.hotelImage}
                          alt={b.hotelName}
                          className="w-12 h-12 rounded-xl object-cover border border-slate-700"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-white text-sm">{b.hotelName}</span>
                            <span className="text-xs font-mono text-amber-300 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                              {b.id}
                            </span>
                          </div>
                          <div className="text-xs text-slate-400">
                            {b.roomName} • {b.checkIn} to {b.checkOut} ({b.nights} nights, {b.guests} guests)
                          </div>
                          <div className="text-[11px] text-slate-400">
                            Guest: <strong className="text-white">{b.guestName}</strong> ({b.guestEmail})
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-base font-black text-white">${b.totalPriceUsd}</div>
                          <div className="text-xs text-cyan-400 font-mono">
                            +{b.cashbackTon.toFixed(2)} TON ({b.cashbackPercentage}%)
                          </div>
                          <div className="text-[10px] text-slate-400">Paid: {b.paymentMethod}</div>
                        </div>

                        {/* Status Switcher */}
                        <select
                          value={b.status}
                          onChange={(e) =>
                            handleUpdateBookingStatus(
                              b.id,
                              e.target.value as 'Confirmed' | 'Completed' | 'Cancelled'
                            )
                          }
                          className={`text-xs font-bold px-2.5 py-1.5 rounded-xl border focus:outline-none cursor-pointer ${
                            b.status === 'Confirmed'
                              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600'
                              : b.status === 'Completed'
                              ? 'bg-blue-950/80 text-blue-300 border-blue-600'
                              : 'bg-rose-950/80 text-rose-300 border-rose-600'
                          }`}
                        >
                          <option value="Confirmed" className="bg-slate-900 text-white">Confirmed</option>
                          <option value="Completed" className="bg-slate-900 text-white">Completed</option>
                          <option value="Cancelled" className="bg-slate-900 text-white">Cancelled</option>
                        </select>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span>Wallet: <code className="text-slate-300 font-mono">{b.userWallet}</code></span>
                        {b.transactionHash && (
                          <span>Tx: <code className="text-slate-400 font-mono">{b.transactionHash.slice(0, 12)}...</code></span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {b.driveFileUrl && (
                          <a
                            href={b.driveFileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-cyan-400 hover:underline flex items-center gap-1"
                          >
                            <Cloud className="w-3 h-3" /> Drive Receipt
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: HOTELS & PRICING */}
          {activeTab === 'hotels' && (
            <div className="space-y-4">
              {/* Quick Batch Actions */}
              <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    Global Flash Sale & Promo Rates
                  </h3>
                  <p className="text-xs text-slate-400">
                    Apply automatic instant discount across all properties in the catalog.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => handleApplyGlobalDiscount(0)}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-bold text-slate-300 border border-slate-700"
                  >
                    Reset (0%)
                  </button>
                  <button
                    onClick={() => handleApplyGlobalDiscount(10)}
                    className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-xs font-bold text-amber-300 border border-amber-500/40"
                  >
                    10% Off All
                  </button>
                  <button
                    onClick={() => handleApplyGlobalDiscount(20)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-xs font-bold text-emerald-300 border border-emerald-500/40"
                  >
                    20% Off All
                  </button>
                </div>
              </div>

              {/* Hotel Search */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={hotelSearch}
                  onChange={(e) => setHotelSearch(e.target.value)}
                  placeholder="Search hotel catalog by name or city..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Hotel Catalog Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredHotels.map((h) => (
                  <div
                    key={h.id}
                    className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={h.images[0]}
                        alt={h.name}
                        className="w-16 h-16 rounded-xl object-cover border border-slate-700 shrink-0"
                      />
                      <div>
                        <div className="font-bold text-white text-xs line-clamp-1">{h.name}</div>
                        <div className="text-[11px] text-slate-400">{h.city}, {h.country}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-extrabold text-emerald-400">
                            ${h.pricePerNightUsd}/night
                          </span>
                          {h.discountUsd && h.discountUsd > 0 && (
                            <span className="text-[10px] bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded font-bold">
                              -${h.discountUsd} Off
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5">
                      <button
                        onClick={() => handleToggleHotelPopular(h.id)}
                        className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-all ${
                          h.popular
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                        }`}
                      >
                        {h.popular ? '★ Featured' : '☆ Standard'}
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleAdjustHotelPrice(h.id, h.pricePerNightUsd - 20)}
                          className="w-6 h-6 rounded bg-slate-900 hover:bg-slate-800 text-xs font-bold text-slate-300 border border-slate-800 flex items-center justify-center"
                          title="Decrease $20"
                        >
                          -
                        </button>
                        <button
                          onClick={() => handleAdjustHotelPrice(h.id, h.pricePerNightUsd + 20)}
                          className="w-6 h-6 rounded bg-slate-900 hover:bg-slate-800 text-xs font-bold text-slate-300 border border-slate-800 flex items-center justify-center"
                          title="Increase $20"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: CASHBACK & USER VIP */}
          {activeTab === 'cashback' && (
            <div className="space-y-6">
              {/* User VIP & Telegram Premium Controller */}
              <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                        User VIP Status & Telegram Premium Tier
                      </h3>
                      <p className="text-xs text-slate-400">
                        Controls base cashback multiplier (8% for Premium, 5% for Standard)
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleToggleTelegramPremium}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md ${
                      userState.isTelegramPremium
                        ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-amber-500/20'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {userState.isTelegramPremium ? '★ Premium (8% Cashback Active)' : 'Standard (5% Cashback)'}
                  </button>
                </div>
              </div>

              {/* Direct TON Cashback Airdrop Tool */}
              <div className="p-4 bg-slate-950/80 border border-cyan-900/40 rounded-2xl space-y-4">
                <div className="flex items-center gap-2.5">
                  <Gift className="w-5 h-5 text-cyan-400" />
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                      Admin TON Cashback Top-Up & Airdrop
                    </h3>
                    <p className="text-xs text-slate-400">
                      Credit promotional TON rewards or reimbursement directly to user wallet balance
                    </p>
                  </div>
                </div>

                <form onSubmit={handleExecuteAirdrop} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 mb-1 block">Target Wallet</label>
                      <input
                        type="text"
                        value={airdropTargetWallet}
                        onChange={(e) => setAirdropTargetWallet(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 mb-1 block">Amount in TON</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.1"
                        value={airdropAmount}
                        onChange={(e) => setAirdropAmount(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-1">
                    <div className="text-xs text-slate-400">
                      Current User Balance: <strong className="text-cyan-300 font-mono">{userState.tonBalance.toFixed(2)} TON</strong>
                    </div>

                    <button
                      type="submit"
                      className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-lg active:scale-95"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Execute Cashback Credit</span>
                    </button>
                  </div>

                  {airdropSuccess && (
                    <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-semibold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{airdropSuccess}</span>
                    </div>
                  )}
                </form>
              </div>
            </div>
          )}

          {/* TAB 5: ADMIN ROSTER & SECURITY */}
          {activeTab === 'admins' && (
            <div className="space-y-6">
              {/* Authorized Admins List */}
              <div className="bg-slate-950/80 border border-amber-500/30 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-amber-400" />
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                      Verified Super Administrator Accounts
                    </h3>
                    <p className="text-xs text-slate-400">
                      These accounts possess master administrative control over bookings, catalog, and finances
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  {ADMIN_EMAILS.map((email, idx) => (
                    <div
                      key={email}
                      className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between gap-3 flex-wrap"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-black text-xs">
                          #{idx + 1}
                        </div>
                        <div>
                          <div className="font-bold text-white text-xs font-mono">{email}</div>
                          <div className="text-[10px] text-slate-400">Master Level 3 SuperAdmin Access</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Active & Verified
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Connected Services & Security Health */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                    Integrated System Health Status
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Firebase Auth & Security</span>
                    </div>
                    <span className="text-emerald-400 font-bold text-[11px]">Operational</span>
                  </div>

                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-cyan-400" />
                      <span>Open-Meteo Weather API</span>
                    </div>
                    <span className="text-emerald-400 font-bold text-[11px]">Operational</span>
                  </div>

                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Cloud className="w-4 h-4 text-blue-400" />
                      <span>Google Drive File Sync</span>
                    </div>
                    <span className="text-emerald-400 font-bold text-[11px]">OAuth Enabled</span>
                  </div>

                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-purple-400" />
                      <span>Gmail Integration API</span>
                    </div>
                    <span className="text-emerald-400 font-bold text-[11px]">Active</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-950 border-t border-slate-800 p-3 sm:p-4 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Admin Console Live & Synchronized</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-all text-xs"
          >
            Close Console
          </button>
        </div>
      </div>
    </div>
  );
};
