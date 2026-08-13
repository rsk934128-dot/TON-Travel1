import { UserTravelPreferences, SmartSuggestionsResult, Booking, Hotel } from '../types';
import { HOTELS } from '../data/hotels';

const PREFS_STORAGE_KEY = 'ton_travel_user_preferences_v1';
const CACHE_SUGGESTIONS_KEY = 'ton_travel_smart_suggestions_cache_v1';

export const DEFAULT_PREFERENCES: UserTravelPreferences = {
  travelStyles: ['Cliffside & Ocean Luxury', 'Overwater & Island Villas'],
  budgetTier: 'Flexible Luxury ($300 - $800)',
  tripPace: 'Scenic & Relaxing',
  favoritePerks: ['Private Pool', 'Ocean View', 'Michelin Dining']
};

export const AVAILABLE_STYLES = [
  'Cliffside & Ocean Luxury',
  'Overwater & Island Villas',
  'Skyline & City Lights',
  'Historic Palaces & Heritage',
  'Zen Wellness & Onsen',
  'Chic Beach Clubs & Sunset'
];

export const AVAILABLE_BUDGETS = [
  'Value Luxury ($150 - $350)',
  'Flexible Luxury ($300 - $800)',
  'Ultra High-Yield ($600 - $1500+)'
];

export const AVAILABLE_PACES = [
  'Scenic & Relaxing',
  'Foodie & Cultural',
  'Romantic Getaway',
  'Fast-Paced Adventure'
];

export const AVAILABLE_PERKS = [
  'Private Pool',
  'Ocean View',
  'Michelin Dining',
  'Spa / Onsen',
  '24/7 Butler',
  'Free Airport Transfer'
];

export function loadUserPreferences(): UserTravelPreferences {
  try {
    const raw = localStorage.getItem(PREFS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_PREFERENCES,
        ...parsed
      };
    }
  } catch (e) {
    console.warn('Failed to load user preferences:', e);
  }
  return DEFAULT_PREFERENCES;
}

export function saveUserPreferences(prefs: UserTravelPreferences): void {
  try {
    localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(prefs));
  } catch (e) {
    console.warn('Failed to save user preferences:', e);
  }
}

export async function fetchSmartSuggestions(params: {
  bookingHistory: Booking[];
  preferences: UserTravelPreferences;
  isPremium: boolean;
  loyaltyBonusPercentage: number;
  tonPriceUsd: number;
  tonBalance: number;
  availableHotels?: Hotel[];
}): Promise<SmartSuggestionsResult> {
  const {
    bookingHistory,
    preferences,
    isPremium,
    loyaltyBonusPercentage,
    tonPriceUsd,
    tonBalance,
    availableHotels = HOTELS
  } = params;

  try {
    const response = await fetch('/api/smart-suggestions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        bookingHistory,
        preferences,
        isPremium,
        loyaltyBonusPercentage,
        tonPriceUsd,
        tonBalance,
        availableHotels: availableHotels.map(h => ({
          id: h.id,
          name: h.name,
          city: h.city,
          country: h.country,
          pricePerNightUsd: h.pricePerNightUsd,
          rating: h.rating,
          perks: h.perks,
          tag: h.tag,
          images: h.images
        }))
      })
    });

    if (response.ok) {
      const data: SmartSuggestionsResult = await response.json();
      if (data && data.suggestions && data.suggestions.length > 0) {
        // Cache result
        try {
          localStorage.setItem(CACHE_SUGGESTIONS_KEY, JSON.stringify(data));
        } catch (e) {}
        return data;
      }
    }
  } catch (err) {
    console.error('Error requesting smart suggestions:', err);
  }

  // If failed or offline, try cached or fallback
  try {
    const cached = localStorage.getItem(CACHE_SUGGESTIONS_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (e) {}

  // Fallback if network issue
  const rate = (isPremium ? 8 : 5) + loyaltyBonusPercentage;
  return {
    travelProfileSummary: 'Personalized selection optimizing TON cashback yield with curated luxury hidden gems.',
    cashbackOptimizationTips: [
      `Your active rate is ${rate}% in TON cashback.`,
      'Booking cliffside and overwater suites generates highest absolute cryptocurrency rewards.'
    ],
    suggestions: [
      {
        hotelId: 'hotel-bali-01',
        hotelName: 'Alila Villas Uluwatu',
        destination: 'Uluwatu, Bali, Indonesia',
        matchScore: 99,
        tag: '🔥 Top TON Cashback Yield',
        whyYoullLoveIt: 'Eco-luxury open-plan ocean villas perched on limestone cliffs with private pools and dedicated butler service.',
        insiderTip: 'Reserve Villa #14 for uninterrupted 180° sunset vistas over the Indian Ocean.',
        pricePerNightUsd: 480,
        nightsRecommendation: 3,
        estimatedCashbackTon: Number((480 * 3 * (rate / 100) / tonPriceUsd).toFixed(2)),
        estimatedCashbackUsd: Number((480 * 3 * (rate / 100)).toFixed(2)),
        cashbackRatePercent: rate,
        primaryVibe: 'Cliffside Eco-Luxury',
        catalogHotel: true
      },
      {
        hotelId: 'hotel-maldives-05',
        hotelName: 'Soneva Jani',
        destination: 'Noonu Atoll, Maldives',
        matchScore: 97,
        tag: '✨ Overwater Slide Villa',
        whyYoullLoveIt: 'Overwater lagoon sanctuary featuring private water slides directly into turquoise waters and retractable roof master bedrooms.',
        insiderTip: 'Master bedroom ceiling opens with a single button for open-sky stargazing over the Indian Ocean.',
        pricePerNightUsd: 1350,
        nightsRecommendation: 2,
        estimatedCashbackTon: Number((1350 * 2 * (rate / 100) / tonPriceUsd).toFixed(2)),
        estimatedCashbackUsd: Number((1350 * 2 * (rate / 100)).toFixed(2)),
        cashbackRatePercent: rate,
        primaryVibe: 'Lagoon Luxury & Stargazing',
        catalogHotel: true
      }
    ]
  };
}
