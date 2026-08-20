export interface RoomOption {
  id: string;
  name: string;
  pricePerNightUsd: number;
  bedType: string;
  capacity: string;
  features: string[];
}

export interface Hotel {
  id: string;
  name: string;
  location: string;
  city: string;
  country: string;
  rating: number;
  reviewCount: number;
  stars: number;
  images: string[];
  pricePerNightUsd: number;
  discountUsd?: number;
  perks: string[];
  latitude: number;
  longitude: number;
  description: string;
  rooms: RoomOption[];
  popular?: boolean;
  tag?: string;
  category?: 'Luxury' | 'Budget' | 'Boutique' | 'Resort' | 'Eco-Villa' | string;
  categoryTags?: string[];
  source?: 'booking_com' | 'curated' | 'live_feed';
  bookingComId?: string;
  verifiedPartner?: boolean;
  liveRateVerifiedAt?: string;
  address?: string;
  checkInTime?: string;
  checkOutTime?: string;
}

export interface BookingLocationResult {
  dest_id: string;
  dest_type: string;
  label: string;
  name: string;
  city_name: string;
  country: string;
  image_url?: string;
  hotels_count?: number;
  latitude?: number;
  longitude?: number;
}

export interface BookingApiStatus {
  status: 'online' | 'degraded' | 'cached';
  provider: 'Booking.com Official Demand API v3.1' | 'Booking.com Official Demand API' | 'RapidAPI Enterprise Proxy' | 'TON Travel Resilience Gateway' | string;
  isLiveApiKeyConfigured: boolean;
  isDemandApiConfigured?: boolean;
  affiliateId?: string;
  totalHotelsIndexed: number;
  activeGateway: string;
  latencyMs: number;
  lastSyncTimestamp: number;
  supportedDestinationsCount: number;
  features: {
    demandApiV31?: boolean;
    liveRates: boolean;
    realTimePhotos: boolean;
    instantCashbackCalc: boolean;
    autoFailoverResilience: boolean;
    permanentZeroDowntime: boolean;
  };
}

export type PaymentMethod = 'TON' | 'USDT_TON' | 'CARD';

export interface Booking {
  id: string;
  hotelId: string;
  hotelName: string;
  hotelLocation: string;
  hotelImage: string;
  roomName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  totalPriceUsd: number;
  totalPriceTon: number;
  paymentMethod: PaymentMethod;
  cashbackPercentage: number; // 8% for Premium, 5% for Standard
  cashbackTon: number;
  cashbackUsd: number;
  status: 'Confirmed' | 'Completed' | 'Cancelled';
  bookingDate: string;
  userWallet: string;
  guestName: string;
  guestEmail: string;
  transactionHash?: string;
  driveFileId?: string;
  driveFileUrl?: string;
  driveExportedAt?: string;
  loyaltyBonusTon?: number;
  loyaltyTierAtBooking?: string;
}

export type LoyaltyTierName = 'Explorer' | 'Voyager' | 'Globetrotter' | 'Jetsetter';

export interface UserTravelPreferences {
  travelStyles: string[];
  budgetTier: string;
  tripPace: string;
  favoritePerks: string[];
}

export interface SmartSuggestion {
  hotelId: string;
  hotelName: string;
  destination: string;
  matchScore: number;
  tag: string;
  whyYoullLoveIt: string;
  insiderTip: string;
  pricePerNightUsd: number;
  nightsRecommendation: number;
  estimatedCashbackTon: number;
  estimatedCashbackUsd: number;
  cashbackRatePercent: number;
  primaryVibe: string;
  catalogHotel?: boolean;
}

export interface SmartSuggestionsResult {
  travelProfileSummary: string;
  cashbackOptimizationTips: string[];
  suggestions: SmartSuggestion[];
}

export type Language = 'en' | 'ru' | 'es';

export interface LanguageOption {
  code: Language;
  name: string;
  nativeName: string;
  flag: string;
  description: string;
}

export interface TonPriceAlertConfig {
  enabled: boolean;
  thresholdPercent: number; // e.g. 3% volatility
  alertOnHigh: boolean;
  highTargetPrice: number;
  alertOnLow: boolean;
  lowTargetPrice: number;
  soundEnabled: boolean;
  browserNotifications: boolean;
  emailNotificationsEnabled?: boolean;
  emailRecipient?: string;
  lastEmailSentAt?: string;
  updatedAt?: string;
}

export interface PriceAlertEvent {
  id: string;
  userId?: string;
  triggerType: 'HIGH_TARGET' | 'LOW_DIP' | 'VOLATILITY_THRESHOLD' | 'TEST';
  currentPrice: number; // TON/USD rate at the time of the alert
  thresholdPrice?: number;
  thresholdPercent?: number;
  changePercent?: number;
  recipientEmail?: string;
  subject?: string;
  timestamp: string; // ISO string
  createdAt?: string;
}

export interface UserState {
  isTelegramPremium: boolean;
  connectedWallet: string | null;
  walletType: 'TON Space' | 'Tonkeeper' | 'Telegram Wallet' | null;
  tonBalance: number; // accumulated cashback TON balance
  tonPriceUsd: number;
  googleDriveToken: string | null;
  driveUserEmail: string | null;
  firebaseUid?: string | null;
  firebaseEmail?: string | null;
  priceAlertConfig?: TonPriceAlertConfig;
  userProfile: {
    name: string;
    username: string;
    avatar: string;
    telegramId: string;
  };
}
