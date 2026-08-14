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

export interface UserState {
  isTelegramPremium: boolean;
  connectedWallet: string | null;
  walletType: 'TON Space' | 'Tonkeeper' | 'Telegram Wallet' | null;
  tonBalance: number; // accumulated cashback TON balance
  tonPriceUsd: number;
  googleDriveToken: string | null;
  driveUserEmail: string | null;
  userProfile: {
    name: string;
    username: string;
    avatar: string;
    telegramId: string;
  };
}
