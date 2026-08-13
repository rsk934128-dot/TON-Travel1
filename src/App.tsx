import React, { useState, useEffect } from 'react';
import { UserState, Hotel, RoomOption, Booking } from './types';
import { HOTELS } from './data/hotels';
import { TelegramFrame } from './components/TelegramFrame';
import { BottomTabs, TabType } from './components/BottomTabs';
import { HotelCard } from './components/HotelCard';
import { HotelDetailModal } from './components/HotelDetailModal';
import { BookingCheckoutModal } from './components/BookingCheckoutModal';
import { WalletView } from './components/WalletView';
import { MapView } from './components/MapView';
import { MyStaysView } from './components/MyStaysView';
import { CurrencyConverterModal } from './components/CurrencyConverterModal';
import { SmartTravelSuggestions } from './components/SmartTravelSuggestions';
import { requestDriveAuthToken } from './services/driveService';
import { calculateLoyaltyTier } from './utils/loyalty';
import { loadDailyRewardsState, getCooldownStatus } from './utils/dailyRewards';
import { AccentTheme, THEMES, loadSavedTheme, saveTheme } from './utils/theme';
import { loadSavedCurrency, saveCurrency, fetchFxRates, DEFAULT_FX_RATES } from './utils/currency';
import { useLanguage } from './utils/i18n';
import { Search, Sparkles, SlidersHorizontal, MapPin, Building2, Shield, RefreshCw, Gift, Flame, Clock, ChevronRight, ArrowRightLeft } from 'lucide-react';
import appLogo from './assets/images/ton_travel_logo_1786647813598.jpg';

export default function App() {
  const { t } = useLanguage();

  // Accent Theme State
  const [currentTheme, setCurrentTheme] = useState<AccentTheme>(() => loadSavedTheme());
  const activeThemeDef = THEMES[currentTheme];

  const handleSelectTheme = (theme: AccentTheme) => {
    setCurrentTheme(theme);
    saveTheme(theme);
  };

  // Currency Converter State
  const [selectedCurrency, setSelectedCurrency] = useState<string>(() => loadSavedCurrency());
  const [fxRates, setFxRates] = useState<Record<string, number>>(DEFAULT_FX_RATES);
  const [isCurrencyModalOpen, setIsCurrencyModalOpen] = useState(false);

  const handleSelectCurrency = (currencyCode: string) => {
    setSelectedCurrency(currencyCode);
    saveCurrency(currencyCode);
  };

  // Fetch real-time FX rates from server proxy
  useEffect(() => {
    let isMounted = true;
    fetchFxRates()
      .then((rates) => {
        if (isMounted && rates && Object.keys(rates).length > 0) {
          setFxRates(rates);
        }
      })
      .catch((err) => {
        console.warn('Could not fetch live FX rates, fallback rates active:', err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Application State
  const [userState, setUserState] = useState<UserState>({
    isTelegramPremium: true, // Default to Telegram Premium for best 8% preview experience!
    connectedWallet: 'EQBvW839_TonSpace_cX92',
    walletType: 'TON Space',
    tonBalance: 18.45,
    tonPriceUsd: 5.42,
    googleDriveToken: null,
    driveUserEmail: null,
    userProfile: {
      name: 'Alex Morgan',
      username: 'alex_ton_traveler',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      telegramId: '849201948'
    }
  });

  const [activeTab, setActiveTab] = useState<TabType>('hotels');
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
  const [bookingTarget, setBookingTarget] = useState<{ hotel: Hotel; room: RoomOption } | null>(null);
  
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCityFilter, setSelectedCityFilter] = useState('All');

  // Daily Rewards quick status
  const [dailyRewardsState, setDailyRewardsState] = useState(() => loadDailyRewardsState());
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const cooldownStatus = getCooldownStatus(dailyRewardsState.lastClaimedTimestamp, currentTime);

  // User Bookings - Initialized with a sample booking for instant testing
  const [bookings, setBookings] = useState<Booking[]>([
    {
      id: 'TON-849201',
      hotelId: 'hotel-bali-01',
      hotelName: 'Alila Villas Uluwatu',
      hotelLocation: 'Bali, Indonesia',
      hotelImage: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1200&q=80',
      roomName: 'One-Bedroom Ocean Pool Villa',
      checkIn: '2026-09-10',
      checkOut: '2026-09-13',
      nights: 3,
      guests: 2,
      totalPriceUsd: 1440,
      totalPriceTon: 265.68,
      paymentMethod: 'TON',
      cashbackPercentage: 8,
      cashbackTon: 21.25,
      cashbackUsd: 115.20,
      status: 'Confirmed',
      bookingDate: '2026-08-10',
      userWallet: 'EQBvW839_TonSpace_cX92',
      guestName: 'Alex Morgan',
      guestEmail: 'alex.morgan@telegram.me',
      transactionHash: '0x9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c'
    }
  ]);

  // Handle Telegram Premium Toggle
  const handleTogglePremium = () => {
    setUserState((prev) => ({
      ...prev,
      isTelegramPremium: !prev.isTelegramPremium
    }));
  };

  // Connect TON Wallet Modal / Handler
  const handleConnectWallet = () => {
    if (userState.connectedWallet) {
      if (confirm('Disconnect current TON Space wallet?')) {
        setUserState((prev) => ({
          ...prev,
          connectedWallet: null,
          walletType: null
        }));
      }
    } else {
      const mockWallets = [
        'EQC4b829_Tonkeeper_w829',
        'EQBvW839_TonSpace_cX92',
        'EQD91a27_TelegramWallet_k192'
      ];
      const randomWallet = mockWallets[Math.floor(Math.random() * mockWallets.length)];
      setUserState((prev) => ({
        ...prev,
        connectedWallet: randomWallet,
        walletType: 'TON Space'
      }));
    }
  };

  // Google Drive Authentication
  const handleDriveAuth = async () => {
    try {
      const auth = await requestDriveAuthToken();
      setUserState((prev) => ({
        ...prev,
        googleDriveToken: auth.token,
        driveUserEmail: auth.email || 'user@google.com'
      }));
    } catch (err: any) {
      console.warn('Drive auth prompt cancelled or failed:', err);
    }
  };

  // On Booking Completion
  const handleBookingComplete = (newBooking: Booking) => {
    setBookings((prev) => [newBooking, ...prev]);
    setUserState((prev) => ({
      ...prev,
      tonBalance: prev.tonBalance + newBooking.cashbackTon
    }));
  };

  // On Claim Cashback
  const handleClaimCashback = (amount: number) => {
    setUserState((prev) => ({
      ...prev,
      tonBalance: Math.max(0, prev.tonBalance - amount)
    }));
  };

  // On Daily Reward Claimed
  const handleDailyRewardClaimed = (amountTon: number) => {
    setUserState((prev) => ({
      ...prev,
      tonBalance: Number((prev.tonBalance + amountTon).toFixed(3))
    }));
    setDailyRewardsState(loadDailyRewardsState());
  };

  // Update Booking Drive URL
  const handleUpdateBookingDriveStatus = (bookingId: string, driveFileId: string, driveUrl: string) => {
    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId
          ? { ...b, driveFileId, driveFileUrl: driveUrl, driveExportedAt: new Date().toLocaleTimeString() }
          : b
      )
    );
  };

  // Filter Hotels
  const filteredHotels = HOTELS.filter((hotel) => {
    const matchesSearch =
      hotel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hotel.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hotel.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hotel.country.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCity = selectedCityFilter === 'All' || hotel.city === selectedCityFilter;

    return matchesSearch && matchesCity;
  });

  const cities = ['All', 'Bali', 'Paris', 'Dubai', 'Tokyo', 'Maldives', 'New York', 'Bangkok', 'Rome', 'London'];

  const loyaltyStatus = calculateLoyaltyTier(bookings, userState.isTelegramPremium);

  return (
    <TelegramFrame
      userState={userState}
      loyaltyStatus={loyaltyStatus}
      currentTheme={currentTheme}
      selectedCurrency={selectedCurrency}
      rates={fxRates}
      onOpenConverter={() => setIsCurrencyModalOpen(true)}
      onSelectTheme={handleSelectTheme}
      onTogglePremium={handleTogglePremium}
      onConnectWallet={handleConnectWallet}
      onDriveAuth={handleDriveAuth}
    >
      <div className="flex-1 flex flex-col justify-between min-h-screen bg-slate-950 text-slate-100">
        
        {/* Main View Router */}
        <main className="flex-1 pb-6">
          
          {/* TAB 1: HOTELS */}
          {activeTab === 'hotels' && (
            <div className="space-y-6">
              
              {/* Hero Banner with TON Cashback Callout */}
              <div
                className="relative overflow-hidden p-6 sm:p-8 rounded-b-3xl sm:rounded-3xl shadow-2xl mx-0 sm:mx-4 mt-0 sm:mt-4 transition-all duration-500"
                style={{
                  background: `linear-gradient(135deg, ${activeThemeDef.primaryHex}dd 0%, ${activeThemeDef.secondaryHex}88 50%, #090d16 100%)`
                }}
              >
                <div
                  className="absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl pointer-events-none opacity-30 transition-colors duration-500"
                  style={{ backgroundColor: activeThemeDef.secondaryHex }}
                />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="max-w-2xl space-y-3">
                    <div className="inline-flex items-center gap-2 bg-black/30 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white border border-white/20">
                      <img
                        src={appLogo}
                        alt="TON Travel"
                        referrerPolicy="no-referrer"
                        className="w-4 h-4 rounded-full object-cover"
                      />
                      <span>Telegram Travel Mini App</span>
                    </div>

                    <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                      {t('hero.title_line1')}<br />
                      {t('hero.title_line2')}
                    </h1>

                    <p className="text-xs sm:text-sm text-slate-100 leading-relaxed max-w-lg">
                      {t('hero.description')}
                    </p>

                    <div className="pt-2 flex flex-wrap items-center gap-2">
                      <div className="bg-slate-950/80 backdrop-blur-md text-white text-xs font-extrabold px-3 py-1.5 rounded-xl border border-white/20">
                        👑 {t('hero.badge_premium')}
                      </div>
                      {loyaltyStatus.bonusPercentage > 0 && (
                        <div className="bg-gradient-to-r from-amber-500/20 to-amber-700/20 backdrop-blur-md text-amber-300 text-xs font-bold px-3 py-1.5 rounded-xl border border-amber-400/40">
                          {loyaltyStatus.tier.icon} {loyaltyStatus.tier.displayName} (+{loyaltyStatus.bonusPercentage}%)
                        </div>
                      )}
                      <div className="bg-slate-950/60 backdrop-blur-md text-slate-200 text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-700">
                        {t('hero.badge_standard')}
                      </div>
                    </div>
                  </div>

                  {/* Prominent Logo Visual on Desktop / Tablets */}
                  <div className="hidden sm:flex flex-col items-center justify-center shrink-0 self-center">
                    <div className="relative group">
                      <div
                        className="absolute -inset-1 rounded-3xl blur-xl opacity-60 group-hover:opacity-100 transition duration-500 animate-pulse"
                        style={{ backgroundColor: activeThemeDef.primaryHex }}
                      />
                      <div className="relative p-2 bg-slate-950/70 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl">
                        <img
                          src={appLogo}
                          alt="TON Travel App Logo"
                          referrerPolicy="no-referrer"
                          className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover shadow-inner transform group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Daily Rewards Teaser / Quick Action Bar */}
              <div className="px-4 max-w-6xl mx-auto">
                <div
                  onClick={() => setActiveTab('cashback')}
                  className="cursor-pointer bg-slate-900 hover:bg-slate-900/90 border border-slate-800 hover:border-slate-700 p-3.5 sm:p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg transition-all group"
                  style={{
                    borderLeftColor: activeThemeDef.primaryHex,
                    borderLeftWidth: '4px'
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-lg shadow-md shrink-0">
                      <Gift className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-white text-xs sm:text-sm">{t('rewards.title')}</span>
                        <span className="bg-amber-400/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Flame className="w-3 h-3 fill-amber-400 text-amber-400" />
                          <span>{t('rewards.streak_day', { day: dailyRewardsState.currentStreakDay })}</span>
                        </span>
                      </div>
                      <p className="text-slate-400 text-[11px] mt-0.5">
                        Earn free TON every 24h • Total collected: <strong className="text-amber-400">+{dailyRewardsState.totalTonCollected.toFixed(2)} TON</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 self-start sm:self-auto">
                    {cooldownStatus.canClaim ? (
                      <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-xs px-3.5 py-1.5 rounded-xl shadow-md flex items-center gap-1.5 group-hover:scale-105 transition-transform animate-pulse">
                        <Sparkles className="w-3.5 h-3.5 text-amber-200 fill-amber-200" />
                        <span>{t('rewards.claim_btn')}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
                        <Clock className="w-3.5 h-3.5" style={{ color: activeThemeDef.secondaryHex }} />
                        <span className="text-slate-400 text-[11px]">{t('rewards.next_in')}</span>
                        <span className="font-mono font-bold" style={{ color: activeThemeDef.secondaryHex }}>{cooldownStatus.formattedTimer}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition-colors" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Search & City Filter Bar */}
              <div className="px-4 space-y-3 max-w-6xl mx-auto">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder={t('search.placeholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-10 pr-4 py-3 text-xs sm:text-sm text-white focus:outline-none transition-all placeholder:text-slate-500 shadow-md"
                    style={{
                      borderColor: searchQuery ? activeThemeDef.primaryHex : undefined
                    }}
                  />
                </div>

                {/* City Filter Pills */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {cities.map((city) => {
                    const isSelected = selectedCityFilter === city;
                    const displayCity = city === 'All' ? t('search.all') : city;
                    return (
                      <button
                        key={city}
                        onClick={() => setSelectedCityFilter(city)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                          isSelected
                            ? 'text-white shadow-md'
                            : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                        }`}
                        style={{
                          backgroundColor: isSelected ? activeThemeDef.primaryHex : undefined,
                          boxShadow: isSelected ? `0 4px 12px ${activeThemeDef.primaryHex}40` : undefined
                        }}
                      >
                        {displayCity}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* AI-Powered Smart Travel Suggestions Section */}
              <div className="px-4 max-w-6xl mx-auto">
                <SmartTravelSuggestions
                  bookings={bookings}
                  hotels={HOTELS}
                  tonPriceUsd={userState.tonPriceUsd}
                  isPremium={userState.isTelegramPremium}
                  loyaltyBonusPercentage={loyaltyStatus.bonusPercentage}
                  loyaltyTierName={loyaltyStatus.tier.displayName}
                  tonBalance={userState.tonBalance}
                  selectedCurrency={selectedCurrency}
                  rates={fxRates}
                  theme={activeThemeDef}
                  onSelectHotel={(h) => setSelectedHotel(h)}
                />
              </div>

              {/* Hotel Cards Grid */}
              <div className="px-4 max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                    <Building2 className="w-4 h-4" style={{ color: activeThemeDef.primaryHex }} />
                    <span>{t('hotels.featured_stays', { count: filteredHotels.length })}</span>
                  </h2>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsCurrencyModalOpen(true)}
                      className="text-xs font-bold text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 px-2.5 py-1 rounded-xl flex items-center gap-1.5 transition-all"
                    >
                      <ArrowRightLeft className="w-3 h-3 text-cyan-400" />
                      <span>{t('hotels.currency')}: <strong className="text-cyan-300">{selectedCurrency}</strong></span>
                    </button>
                    <span className="hidden sm:inline text-xs font-semibold" style={{ color: activeThemeDef.secondaryHex }}>
                      1 TON = ${userState.tonPriceUsd.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredHotels.map((hotel) => (
                    <HotelCard
                      key={hotel.id}
                      hotel={hotel}
                      tonPriceUsd={userState.tonPriceUsd}
                      isPremium={userState.isTelegramPremium}
                      loyaltyBonusPercentage={loyaltyStatus.bonusPercentage}
                      loyaltyTierName={loyaltyStatus.tier.name}
                      selectedCurrency={selectedCurrency}
                      rates={fxRates}
                      onSelect={(h) => setSelectedHotel(h)}
                    />
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: MAP VIEW */}
          {activeTab === 'map' && (
            <MapView
              hotels={HOTELS}
              tonPriceUsd={userState.tonPriceUsd}
              isPremium={userState.isTelegramPremium}
              loyaltyBonusPercentage={loyaltyStatus.bonusPercentage}
              selectedCurrency={selectedCurrency}
              rates={fxRates}
              onSelectHotel={(h) => setSelectedHotel(h)}
            />
          )}

          {/* TAB 3: CASHBACK & WALLET */}
          {activeTab === 'cashback' && (
            <WalletView
              userState={userState}
              bookings={bookings}
              currentTheme={currentTheme}
              selectedCurrency={selectedCurrency}
              rates={fxRates}
              onOpenConverter={() => setIsCurrencyModalOpen(true)}
              onSelectTheme={handleSelectTheme}
              onConnectWallet={handleConnectWallet}
              onTogglePremium={handleTogglePremium}
              onDriveAuth={handleDriveAuth}
              onClaimCashback={handleClaimCashback}
              onDailyRewardClaimed={handleDailyRewardClaimed}
            />
          )}

          {/* TAB 4: MY STAYS */}
          {activeTab === 'stays' && (
            <MyStaysView
              bookings={bookings}
              userState={userState}
              selectedCurrency={selectedCurrency}
              rates={fxRates}
              onDriveAuth={handleDriveAuth}
              onUpdateBookingDriveStatus={handleUpdateBookingDriveStatus}
            />
          )}

        </main>

        {/* Modal: Hotel Detail View */}
        <HotelDetailModal
          hotel={selectedHotel}
          tonPriceUsd={userState.tonPriceUsd}
          isPremium={userState.isTelegramPremium}
          loyaltyBonusPercentage={loyaltyStatus.bonusPercentage}
          loyaltyTierName={loyaltyStatus.tier.name}
          loyaltyTierDisplayName={loyaltyStatus.tier.displayName}
          selectedCurrency={selectedCurrency}
          rates={fxRates}
          onClose={() => setSelectedHotel(null)}
          onProceedToBooking={(hotel, room) => {
            setSelectedHotel(null);
            setBookingTarget({ hotel, room });
          }}
          onTogglePremium={handleTogglePremium}
        />

        {/* Modal: Booking & Payment Checkout */}
        <BookingCheckoutModal
          hotel={bookingTarget?.hotel || null}
          room={bookingTarget?.room || null}
          userState={userState}
          loyaltyBonusPercentage={loyaltyStatus.bonusPercentage}
          loyaltyTierName={loyaltyStatus.tier.name}
          loyaltyTierDisplayName={loyaltyStatus.tier.displayName}
          selectedCurrency={selectedCurrency}
          rates={fxRates}
          onClose={() => setBookingTarget(null)}
          onBookingComplete={handleBookingComplete}
          onConnectWallet={handleConnectWallet}
        />

        {/* Modal: Real-Time Currency Converter & FX Rates */}
        <CurrencyConverterModal
          isOpen={isCurrencyModalOpen}
          onClose={() => setIsCurrencyModalOpen(false)}
          selectedCurrency={selectedCurrency}
          onSelectCurrency={handleSelectCurrency}
          rates={fxRates}
          tonPriceUsd={userState.tonPriceUsd}
          themeDef={activeThemeDef}
        />

        {/* Telegram Mini App Bottom Navigation Tabs */}
        <BottomTabs
          activeTab={activeTab}
          onChangeTab={(tab) => setActiveTab(tab)}
          bookingCount={bookings.length}
          cashbackBalanceTon={userState.tonBalance}
          isPremium={userState.isTelegramPremium}
          currentTheme={currentTheme}
        />

      </div>
    </TelegramFrame>
  );
}
