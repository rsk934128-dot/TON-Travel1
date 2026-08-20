import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
import { GmailView } from './components/GmailView';
import { CurrencyConverterModal } from './components/CurrencyConverterModal';
import { SmartTravelSuggestions } from './components/SmartTravelSuggestions';
import { AdminPanelModal } from './components/AdminPanelModal';
import { TonSpaceTroubleshooterModal } from './components/TonSpaceTroubleshooterModal';
import { TonApiInspectorModal } from './components/TonApiInspectorModal';
import { CryptoRankConnectorModal } from './components/CryptoRankConnectorModal';
import { BookingApiModal } from './components/BookingApiModal';
import { AuthModal } from './components/AuthModal';
import { GlobalToastContainer } from './components/GlobalToastContainer';
import { subscribeToToasts, removeToast, ToastNotification } from './services/toastService';
import {
  auth,
  db,
  saveUserStateToFirestore,
  saveBookingToFirestore
} from './services/firebaseService';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, onSnapshot, query, doc, getDoc } from 'firebase/firestore';
import { ADMIN_EMAILS } from './utils/admin';
import { requestDriveAuthToken } from './services/driveService';
import { calculateLoyaltyTier } from './utils/loyalty';
import { loadDailyRewardsState, getCooldownStatus } from './utils/dailyRewards';
import { AccentTheme, THEMES, loadSavedTheme, saveTheme } from './utils/theme';
import { loadSavedCurrency, saveCurrency, fetchFxRates, DEFAULT_FX_RATES } from './utils/currency';
import { useLanguage } from './utils/i18n';
import { Search, Sparkles, SlidersHorizontal, MapPin, Building2, Shield, RefreshCw, Gift, Flame, Clock, ChevronRight, ArrowRightLeft, RotateCcw, Tag, Globe2 } from 'lucide-react';
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
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

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

  // Hotel Catalog State (Allows Super Admin dynamic rate adjustments & discounts)
  const [hotels, setHotels] = useState<Hotel[]>(HOTELS);

  // Admin Modal & Active SuperAdmin Identity State
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [activeAdminEmail, setActiveAdminEmail] = useState<string>(ADMIN_EMAILS[0]);

  // TON Space Transaction Troubleshooting Modal
  const [isTonTroubleshooterOpen, setIsTonTroubleshooterOpen] = useState(false);

  // TON API v2 Live Inspector Modal (Accounts, Raw State, NFTs)
  const [isTonApiModalOpen, setIsTonApiModalOpen] = useState(false);

  // CryptoRank API v3 & MCP Connector Modal
  const [isCryptoRankModalOpen, setIsCryptoRankModalOpen] = useState(false);

  // Firebase Auth & Firestore Cloud Sync Modal
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Global Toast Notification Array State
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeToToasts((updatedToasts) => {
      setToasts(updatedToasts);
    });
    return () => unsubscribe();
  }, []);

  // Firebase Auth State Listener & Firestore Real-Time Sync
  useEffect(() => {
    let unsubscribeBookings: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      // Clean up previous bookings listener if active
      if (unsubscribeBookings) {
        unsubscribeBookings();
        unsubscribeBookings = null;
      }

      if (firebaseUser) {
        setUserState((prev) => ({
          ...prev,
          firebaseUid: firebaseUser.uid,
          firebaseEmail: firebaseUser.email,
          userProfile: {
            ...prev.userProfile,
            name: firebaseUser.displayName || prev.userProfile.name,
            avatar: firebaseUser.photoURL || prev.userProfile.avatar
          }
        }));

        // Fetch User profile doc from Firestore
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const snap = await getDoc(userDocRef);
          if (snap.exists()) {
            const data = snap.data();
            setUserState((prev) => ({
              ...prev,
              isTelegramPremium: data.isTelegramPremium ?? prev.isTelegramPremium,
              connectedWallet: data.connectedWallet ?? prev.connectedWallet,
              walletType: data.walletType ?? prev.walletType,
              tonBalance: data.tonBalance ?? prev.tonBalance,
              priceAlertConfig: data.priceAlertConfig ?? prev.priceAlertConfig,
              userProfile: {
                ...prev.userProfile,
                name: data.displayName || prev.userProfile.name
              }
            }));
          }
        } catch (e) {
          console.warn('Could not read user profile from Firestore:', e);
        }

        // Listen to User's Bookings collection in Firestore with error callback
        try {
          const bookingsCol = collection(db, 'users', firebaseUser.uid, 'bookings');
          unsubscribeBookings = onSnapshot(
            bookingsCol,
            (snapshot) => {
              if (!snapshot.empty) {
                const loadedBookings: Booking[] = [];
                snapshot.forEach((docSnap) => {
                  loadedBookings.push(docSnap.data() as Booking);
                });
                // Sort by booking date descending
                loadedBookings.sort((a, b) => new Date(b.bookingDate).getTime() - new Date(a.bookingDate).getTime());
                setBookings(loadedBookings);
              }
            },
            (error) => {
              console.warn('[Firestore] Bookings sync notice:', error?.message);
            }
          );
        } catch (err) {
          console.warn('[Firestore] Listener attach notice:', err);
        }
      } else {
        setUserState((prev) => ({
          ...prev,
          firebaseUid: null,
          firebaseEmail: null
        }));
      }
    });

    return () => {
      if (unsubscribeBookings) {
        unsubscribeBookings();
      }
      unsubscribeAuth();
    };
  }, []);

  const [activeTab, setActiveTab] = useState<TabType>('hotels');
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
  const [bookingTarget, setBookingTarget] = useState<{ hotel: Hotel; room: RoomOption } | null>(null);
  
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCityFilter, setSelectedCityFilter] = useState('All');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');

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
    setUserState((prev) => {
      const next = { ...prev, isTelegramPremium: !prev.isTelegramPremium };
      if (prev.firebaseUid) {
        saveUserStateToFirestore(prev.firebaseUid, next);
      }
      return next;
    });
  };

  // Connect TON Wallet Modal / Handler
  const handleConnectWallet = () => {
    if (userState.connectedWallet) {
      if (confirm('Disconnect current TON Space wallet?')) {
        setUserState((prev) => {
          const next = { ...prev, connectedWallet: null, walletType: null };
          if (prev.firebaseUid) {
            saveUserStateToFirestore(prev.firebaseUid, next);
          }
          return next;
        });
      }
    } else {
      const mockWallets = [
        'EQC4b829_Tonkeeper_w829',
        'EQBvW839_TonSpace_cX92',
        'EQD91a27_TelegramWallet_k192'
      ];
      const randomWallet = mockWallets[Math.floor(Math.random() * mockWallets.length)];
      setUserState((prev) => {
        const next = {
          ...prev,
          connectedWallet: randomWallet,
          walletType: 'TON Space' as const
        };
        if (prev.firebaseUid) {
          saveUserStateToFirestore(prev.firebaseUid, next);
        }
        return next;
      });
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
    setUserState((prev) => {
      const next = {
        ...prev,
        tonBalance: prev.tonBalance + newBooking.cashbackTon
      };
      if (prev.firebaseUid) {
        saveBookingToFirestore(prev.firebaseUid, newBooking);
        saveUserStateToFirestore(prev.firebaseUid, next);
      }
      return next;
    });
  };

  // On Claim Cashback
  const handleClaimCashback = (amount: number) => {
    setUserState((prev) => {
      const next = {
        ...prev,
        tonBalance: Math.max(0, prev.tonBalance - amount)
      };
      if (prev.firebaseUid) {
        saveUserStateToFirestore(prev.firebaseUid, next);
      }
      return next;
    });
  };

  // On Daily Reward Claimed
  const handleDailyRewardClaimed = (amountTon: number) => {
    setUserState((prev) => {
      const next = {
        ...prev,
        tonBalance: Number((prev.tonBalance + amountTon).toFixed(3))
      };
      if (prev.firebaseUid) {
        saveUserStateToFirestore(prev.firebaseUid, next);
      }
      return next;
    });
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

  // Import Travel Reservation from Gmail
  const handleImportBooking = (imported: Partial<Booking>) => {
    const matchingHotel = hotels.find(
      (h) => h.name.toLowerCase().includes((imported.hotelName || '').toLowerCase()) ||
             (imported.hotelName || '').toLowerCase().includes(h.name.toLowerCase())
    ) || hotels[0];

    const nights = 2;
    const pricePerNightUsd = matchingHotel.rooms[0]?.pricePerNightUsd || 160;
    const totalPriceUsd = pricePerNightUsd * nights;
    const totalPriceTon = totalPriceUsd / userState.tonPriceUsd;
    const cashbackPct = userState.isTelegramPremium ? 8 : 5;
    const cashbackTon = (totalPriceTon * cashbackPct) / 100;
    const cashbackUsd = (totalPriceUsd * cashbackPct) / 100;

    const newBooking: Booking = {
      id: `TT-GMAIL-${Math.floor(100000 + Math.random() * 900000)}`,
      hotelId: matchingHotel.id,
      hotelName: imported.hotelName || matchingHotel.name,
      hotelLocation: imported.hotelLocation || matchingHotel.location,
      hotelImage: matchingHotel.images[0],
      roomName: matchingHotel.rooms[0]?.name || 'Standard Deluxe Room',
      checkIn: imported.checkIn || new Date().toISOString().split('T')[0],
      checkOut: imported.checkOut || new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      nights,
      guests: 2,
      totalPriceUsd,
      totalPriceTon,
      paymentMethod: 'TON',
      cashbackPercentage: cashbackPct,
      cashbackTon,
      cashbackUsd,
      status: 'Confirmed',
      bookingDate: new Date().toISOString().split('T')[0],
      userWallet: userState.connectedWallet || 'EQBvW839_TonSpace_cX92',
      guestName: userState.userProfile.name,
      guestEmail: 'alex.morgan@telegram.org'
    };

    setBookings((prev) => [newBooking, ...prev]);
  };

  // Filter Hotels
  const filteredHotels = hotels.filter((hotel) => {
    const query = searchQuery.toLowerCase().trim();
    const hotelTags = hotel.categoryTags || (hotel.category ? [hotel.category] : []);

    const matchesSearch =
      !query ||
      hotel.name.toLowerCase().includes(query) ||
      hotel.location.toLowerCase().includes(query) ||
      hotel.city.toLowerCase().includes(query) ||
      hotel.country.toLowerCase().includes(query) ||
      (hotel.category && hotel.category.toLowerCase().includes(query)) ||
      hotelTags.some((tag) => tag.toLowerCase().includes(query)) ||
      hotel.perks.some((perk) => perk.toLowerCase().includes(query));

    const matchesCity = selectedCityFilter === 'All' || hotel.city === selectedCityFilter;

    const matchesCategory =
      selectedCategoryFilter === 'All' ||
      hotel.category === selectedCategoryFilter ||
      hotelTags.includes(selectedCategoryFilter);

    return matchesSearch && matchesCity && matchesCategory;
  });

  const CATEGORY_FILTERS = [
    { id: 'All', labelKey: 'categories.all', fallback: 'All Categories', emoji: '🏨' },
    { id: 'Luxury', labelKey: 'categories.luxury', fallback: 'Luxury', emoji: '👑', color: '#f59e0b' },
    { id: 'Boutique', labelKey: 'categories.boutique', fallback: 'Boutique', emoji: '✨', color: '#a855f7' },
    { id: 'Budget', labelKey: 'categories.budget', fallback: 'Budget', emoji: '🏷️', color: '#10b981' },
    { id: 'Resort', labelKey: 'categories.resort', fallback: 'Resorts', emoji: '🏖️', color: '#06b6d4' },
    { id: 'Eco-Villa', labelKey: 'categories.eco_villa', fallback: 'Eco-Villas', emoji: '🌿', color: '#14b8a6' }
  ];

  const getCategoryCount = (catId: string) => {
    if (catId === 'All') return hotels.length;
    return hotels.filter((h) => {
      const tags = h.categoryTags || (h.category ? [h.category] : []);
      return h.category === catId || tags.includes(catId);
    }).length;
  };

  const cities = ['All', 'Bali', 'Paris', 'Dubai', 'Tokyo', 'Maldives', 'New York', 'Bangkok', 'Rome', 'London'];

  const hasActiveFilters = searchQuery !== '' || selectedCityFilter !== 'All' || selectedCategoryFilter !== 'All';

  // Super Admin Action Handlers
  const handleUpdateBookingStatus = (bookingId: string, newStatus: 'Confirmed' | 'Pending' | 'Completed' | 'Cancelled') => {
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b))
    );
  };

  const handleUpdateHotel = (updatedHotel: Hotel) => {
    setHotels((prev) =>
      prev.map((h) => (h.id === updatedHotel.id ? updatedHotel : h))
    );
    if (selectedHotel?.id === updatedHotel.id) {
      setSelectedHotel(updatedHotel);
    }
  };

  const handleAddCashbackToUser = (amountTon: number) => {
    setUserState((prev) => ({
      ...prev,
      tonBalance: Number((prev.tonBalance + amountTon).toFixed(3))
    }));
  };

  const handleBulkDiscount = (discountPercent: number) => {
    setHotels((prev) =>
      prev.map((hotel) => {
        const factor = (100 - discountPercent) / 100;
        return {
          ...hotel,
          rooms: hotel.rooms.map((room) => ({
            ...room,
            pricePerNightUsd: Math.max(20, Math.round(room.pricePerNightUsd * factor))
          }))
        };
      })
    );
  };

  const resetAllFilters = () => {
    setSearchQuery('');
    setSelectedCityFilter('All');
    setSelectedCategoryFilter('All');
  };

  const loyaltyStatus = calculateLoyaltyTier(bookings, userState.isTelegramPremium);

  return (
    <TelegramFrame
      userState={userState}
      loyaltyStatus={loyaltyStatus}
      currentTheme={currentTheme}
      selectedCurrency={selectedCurrency}
      rates={fxRates}
      onOpenConverter={() => setIsCurrencyModalOpen(true)}
      onOpenAdmin={() => setIsAdminModalOpen(true)}
      onOpenCryptoRank={() => setIsCryptoRankModalOpen(true)}
      onOpenBookingApi={() => setIsBookingModalOpen(true)}
      onOpenAuth={() => setIsAuthModalOpen(true)}
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

              {/* Booking.com Real-time Demand API & Global Explorer Banner */}
              <div className="px-4 max-w-6xl mx-auto">
                <div
                  onClick={() => setIsBookingModalOpen(true)}
                  className="cursor-pointer p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-blue-950/60 via-slate-900 to-cyan-950/50 border border-cyan-500/30 hover:border-cyan-400/60 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shadow-md shrink-0 group-hover:scale-105 transition-transform">
                      <Globe2 className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-white text-xs sm:text-sm tracking-tight">
                          Booking.com Demand API Integration
                        </span>
                        <span className="px-2 py-0.2 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Lifetime Active
                        </span>
                      </div>
                      <p className="text-slate-400 text-[11px] mt-0.5">
                        Access 3.28M+ global hotels with real-time verified rates & instant 5%–8% TON Cashback
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span className="text-[11px] font-extrabold text-cyan-300 group-hover:text-white bg-cyan-950/80 group-hover:bg-cyan-600 px-3 py-1.5 rounded-xl border border-cyan-500/30 group-hover:border-cyan-400 transition-all flex items-center gap-1">
                      <span>API Explorer</span>
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </div>
              </div>

              {/* Search & Multi-Filter Bar */}
              <div className="px-4 space-y-3.5 max-w-6xl mx-auto">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder={t('search.placeholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-10 pr-10 py-3 text-xs sm:text-sm text-white focus:outline-none transition-all placeholder:text-slate-500 shadow-md"
                    style={{
                      borderColor: searchQuery ? activeThemeDef.primaryHex : undefined
                    }}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Hotel Category Tags Filter Bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs px-0.5">
                    <span className="font-extrabold text-slate-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-amber-400" />
                      <span>{t('categories.filter_title')}</span>
                    </span>

                    {hasActiveFilters && (
                      <button
                        onClick={resetAllFilters}
                        className="text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>{t('categories.clear')}</span>
                      </button>
                    )}
                  </div>

                  {/* Category Filter Chips */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                    {CATEGORY_FILTERS.map((cat) => {
                      const isSelected = selectedCategoryFilter === cat.id;
                      const count = getCategoryCount(cat.id);
                      const displayLabel = cat.labelKey ? t(cat.labelKey) : cat.fallback;
                      
                      return (
                        <button
                          key={cat.id}
                          onClick={() => setSelectedCategoryFilter(cat.id)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 border ${
                            isSelected
                              ? 'text-white border-white/30 shadow-lg scale-[1.02]'
                              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border-slate-800/90 hover:border-slate-700'
                          }`}
                          style={{
                            backgroundColor: isSelected
                              ? (cat.color ? `${cat.color}35` : activeThemeDef.primaryHex)
                              : undefined,
                            borderColor: isSelected
                              ? (cat.color ? cat.color : activeThemeDef.primaryHex)
                              : undefined,
                            boxShadow: isSelected
                              ? `0 4px 14px ${(cat.color || activeThemeDef.primaryHex)}40`
                              : undefined
                          }}
                        >
                          <span className="text-sm">{cat.emoji}</span>
                          <span className={isSelected ? 'text-white font-extrabold' : ''}>{displayLabel}</span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                            isSelected ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-500'
                          }`}>
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* City Filter Pills */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {cities.map((city) => {
                    const isSelected = selectedCityFilter === city;
                    const displayCity = city === 'All' ? t('search.all_cities') : city;
                    return (
                      <button
                        key={city}
                        onClick={() => setSelectedCityFilter(city)}
                        className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all shrink-0 border ${
                          isSelected
                            ? 'text-white border-transparent shadow-md font-bold'
                            : 'bg-slate-950/70 text-slate-400 hover:text-slate-200 border-slate-800'
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
                  hotels={hotels}
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

                {filteredHotels.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 text-center max-w-md mx-auto space-y-4 shadow-xl my-6"
                  >
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-2xl">
                      🔍
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">{t('categories.no_results')}</h3>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">{t('categories.no_results_desc')}</p>
                    </div>
                    <button
                      onClick={resetAllFilters}
                      className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-extrabold px-5 py-2.5 rounded-xl shadow-lg transition-all"
                    >
                      {t('categories.clear')}
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    key={`hotel-grid-${selectedCategoryFilter}-${selectedCityFilter}-${searchQuery}`}
                    layout
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
                  >
                    <AnimatePresence mode="popLayout">
                      {filteredHotels.map((hotel, index) => (
                        <HotelCard
                          key={hotel.id}
                          index={index}
                          hotel={hotel}
                          tonPriceUsd={userState.tonPriceUsd}
                          isPremium={userState.isTelegramPremium}
                          loyaltyBonusPercentage={loyaltyStatus.bonusPercentage}
                          loyaltyTierName={loyaltyStatus.tier.name}
                          selectedCurrency={selectedCurrency}
                          rates={fxRates}
                          activeCategory={selectedCategoryFilter}
                          onSelectCategory={(cat) => setSelectedCategoryFilter(cat)}
                          onSelect={(h) => setSelectedHotel(h)}
                        />
                      ))}
                    </AnimatePresence>
                  </motion.div>
                )}
              </div>

            </div>
          )}

          {/* TAB 2: MAP VIEW */}
          {activeTab === 'map' && (
            <MapView
              hotels={hotels}
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
              onOpenTonTroubleshooter={() => setIsTonTroubleshooterOpen(true)}
              onOpenTonApiInspector={() => setIsTonApiModalOpen(true)}
              onOpenCryptoRankConnector={() => setIsCryptoRankModalOpen(true)}
              onOpenAuth={() => setIsAuthModalOpen(true)}
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
              onNavigateToGmail={() => setActiveTab('gmail')}
            />
          )}

          {/* TAB 5: GMAIL TRAVEL HUB */}
          {activeTab === 'gmail' && (
            <GmailView
              bookings={bookings}
              onImportBooking={handleImportBooking}
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

        {/* Modal: Super Admin Control Portal (Admins: rubelbank92@gmail.com & rubels1k994@gmail.com) */}
        <AdminPanelModal
          isOpen={isAdminModalOpen}
          onClose={() => setIsAdminModalOpen(false)}
          activeAdminEmail={activeAdminEmail}
          onSwitchAdminEmail={(email) => setActiveAdminEmail(email)}
          bookings={bookings}
          hotels={hotels}
          userState={userState}
          onUpdateBookingStatus={handleUpdateBookingStatus}
          onUpdateHotel={handleUpdateHotel}
          onAddCashbackToUser={handleAddCashbackToUser}
          onBulkDiscountHotels={handleBulkDiscount}
        />

        {/* Modal: TON Space Transaction Troubleshooting & Diagnostics */}
        <TonSpaceTroubleshooterModal
          isOpen={isTonTroubleshooterOpen}
          onClose={() => setIsTonTroubleshooterOpen(false)}
          userState={userState}
          onOpenTonApiInspector={() => setIsTonApiModalOpen(true)}
        />

        {/* Modal: TON API v2 Live Inspector (GET /v2/accounts, /v2/blockchain/accounts, /v2/accounts/nfts) */}
        <TonApiInspectorModal
          isOpen={isTonApiModalOpen}
          onClose={() => setIsTonApiModalOpen(false)}
          defaultAddress={userState.connectedWallet || 'EQBvW839_TonSpace_cX92vK4499_TravelReward_Vault'}
        />

        {/* Modal: CryptoRank API v3 & MCP Connector with Recharts Price Trend Chart */}
        <CryptoRankConnectorModal
          isOpen={isCryptoRankModalOpen}
          onClose={() => setIsCryptoRankModalOpen(false)}
          tonPriceUsd={userState.tonPriceUsd}
        />

        {/* Modal: Booking.com API Integration & Lifetime Gateway Diagnostics */}
        <BookingApiModal
          isOpen={isBookingModalOpen}
          onClose={() => setIsBookingModalOpen(false)}
          currentTheme={currentTheme}
          tonPriceUsd={userState.tonPriceUsd}
          onSelectCity={(cityName) => {
            setSelectedCityFilter(cityName);
            setSearchQuery('');
          }}
        />

        {/* Modal: Firebase Auth & Cloud Firestore Data Sync */}
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
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

        {/* Global Toast Notification System */}
        <GlobalToastContainer
          toasts={toasts}
          onDismiss={removeToast}
        />

      </div>
    </TelegramFrame>
  );
}
