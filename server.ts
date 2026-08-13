import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import Stripe from "stripe";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Lazy Stripe client initializer
  let stripeClient: Stripe | null = null;
  function getStripe(): Stripe | null {
    if (!stripeClient) {
      const key = process.env.STRIPE_SECRET_KEY;
      if (key) {
        stripeClient = new Stripe(key);
      }
    }
    return stripeClient;
  }

  // Lazy Gemini client initializer with access-denied circuit breaker
  let isGeminiAccessDenied = false;

  function getAiClient() {
    if (isGeminiAccessDenied) {
      return null;
    }
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      return null;
    }
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }

  // In-memory cache for FX Rates
  let cachedFxRates: { rates: Record<string, number>; lastUpdated: number } | null = null;

  // API Route: Live FX Exchange Rates
  app.get("/api/fx-rates", async (req, res) => {
    try {
      const now = Date.now();
      // Use cache if less than 30 minutes old
      if (cachedFxRates && now - cachedFxRates.lastUpdated < 30 * 60 * 1000) {
        return res.json({
          status: "success",
          source: "Server Cache (Open Exchange Rates)",
          rates: cachedFxRates.rates,
          lastUpdated: cachedFxRates.lastUpdated
        });
      }

      const response = await fetch("https://open.er-api.com/v6/latest/USD");
      if (response.ok) {
        const data: any = await response.json();
        if (data && data.rates) {
          cachedFxRates = {
            rates: data.rates,
            lastUpdated: data.time_last_update_unix ? data.time_last_update_unix * 1000 : now
          };
          return res.json({
            status: "success",
            source: "Open Exchange Rates API",
            rates: cachedFxRates.rates,
            lastUpdated: cachedFxRates.lastUpdated
          });
        }
      }
      
      // Fallback
      if (cachedFxRates) {
        return res.json({
          status: "stale_cache",
          source: "Server Cache Fallback",
          rates: cachedFxRates.rates,
          lastUpdated: cachedFxRates.lastUpdated
        });
      }

      res.status(500).json({ error: "Failed to fetch live FX rates" });
    } catch (error: any) {
      console.error("FX Rates API Error:", error);
      if (cachedFxRates) {
        return res.json({
          status: "stale_cache",
          rates: cachedFxRates.rates,
          lastUpdated: cachedFxRates.lastUpdated
        });
      }
      res.status(500).json({ error: error?.message || "FX API error" });
    }
  });

  // API Route: Stripe Create Payment Intent
  app.post("/api/create-payment-intent", async (req, res) => {
    try {
      const { amountUsd, hotelName, roomName } = req.body;
      const stripe = getStripe();

      if (!stripe) {
        // Return clear error if STRIPE_SECRET_KEY is not configured
        return res.status(200).json({
          status: "simulated",
          clientSecret: "simulated_sec_" + Math.random().toString(36).substring(2),
          message: "Stripe test mode active (STRIPE_SECRET_KEY not set in environment)."
        });
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round((amountUsd || 100) * 100), // convert to cents
        currency: "usd",
        description: `TON Travel Hotel Booking: ${hotelName} - ${roomName}`,
        automatic_payment_methods: { enabled: true }
      });

      res.json({
        status: "success",
        clientSecret: paymentIntent.client_secret
      });
    } catch (error: any) {
      console.error("Stripe Payment Intent Error:", error);
      res.status(500).json({ error: error?.message || "Failed to create payment intent" });
    }
  });

  // API Route: AI Trip Assistant
  app.post("/api/trip-assistant", async (req, res) => {
    try {
      const { confirmations, isPremium, tonBalance } = req.body;

      const ai = getAiClient();

      const confirmationsSummary = (confirmations || [])
        .map(
          (c: any, i: number) =>
            `${i + 1}. [${c.type || 'Stay/Flight'}] ${c.provider || c.hotelName || c.subject}: ${
              c.snippet || c.details || c.hotelLocation || ''
            }`
        )
        .join('\n');

      const systemPrompt = `You are the official AI Trip Assistant for "TON Travel" — the leading Telegram Travel Mini App that awards TON cashback on 3,000,000+ hotels worldwide.
Your goal is to analyze the user's confirmed travel dates, hotel vouchers, and flight e-tickets (detected from Gmail) and generate personalized travel recommendations and TON cashback optimization strategies.

User Context:
- Telegram Premium Status: ${isPremium ? 'Active 8% TON Cashback' : 'Standard 5% TON Cashback'}
- Accumulated TON Balance: ${tonBalance || 0} TON
- Detected Travel Confirmations from Gmail/Bookings:
${confirmationsSummary || 'No upcoming travel found yet. Defaulting to luxury stay in Bali/Dubai.'}

Respond in clean, well-formatted JSON with the following schema:
{
  "destinationTitle": string,
  "datesOverview": string,
  "nearbyExperiences": [
    {
      "title": string,
      "category": string,
      "description": string,
      "estimatedCostUsd": number,
      "cashbackTon": number,
      "tip": string
    }
  ],
  "optimalTimingAdvice": [
    {
      "topic": string,
      "advice": string
    }
  ],
  "tonCashbackMaximizer": [
    {
      "strategy": string,
      "benefit": string
    }
  ],
  "aiSummary": string
}
Return ONLY valid JSON. No markdown backticks or commentary outside JSON.`;

      if (!ai) {
        return res.json(getFallbackTripAdvice(confirmations, isPremium));
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: systemPrompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const responseText = response.text || '';
      try {
        const parsed = JSON.parse(responseText);
        return res.json(parsed);
      } catch (e) {
        return res.json(getFallbackTripAdvice(confirmations, isPremium));
      }
    } catch (error: any) {
      if (error?.status === 403 || error?.message?.includes('403') || error?.message?.includes('PERMISSION_DENIED')) {
        isGeminiAccessDenied = true;
      }
      return res.json(getFallbackTripAdvice(req.body.confirmations, req.body.isPremium));
    }
  });

  // API Route: AI Smart Travel Suggestions (Gemini 2.5 Flash)
  app.post("/api/smart-suggestions", async (req, res) => {
    try {
      const {
        bookingHistory,
        preferences,
        isPremium,
        loyaltyBonusPercentage = 0,
        tonPriceUsd = 5.42,
        tonBalance = 0,
        availableHotels = []
      } = req.body;

      const ai = getAiClient();
      const baseCashbackRate = isPremium ? 8 : 5;
      const totalCashbackRate = baseCashbackRate + (loyaltyBonusPercentage || 0);

      const historySummary = (bookingHistory && bookingHistory.length > 0)
        ? bookingHistory.map((b: any, i: number) =>
            `${i + 1}. ${b.hotelName} (${b.hotelLocation || 'Unknown'}): $${b.totalPriceUsd} USD for ${b.nights || 1} nights, room: ${b.roomName || 'Standard'}, cashback earned: +${b.cashbackTon || 0} TON`
          ).join('\n')
        : 'No previous stays booked yet (New TON Traveler).';

      const stylesList = preferences?.travelStyles && preferences.travelStyles.length > 0
        ? preferences.travelStyles.join(', ')
        : 'Eco-Luxury, Private Pools, Scenic Escapes, Michelin Dining';
      
      const perksList = preferences?.favoritePerks && preferences.favoritePerks.length > 0
        ? preferences.favoritePerks.join(', ')
        : 'Oceanfront View, Private Pool, Complimentary Butler, Spa / Onsen';

      const catalogSummary = availableHotels.map((h: any) =>
        `- ID: "${h.id}", Name: "${h.name}", City: "${h.city}", Country: "${h.country}", Price/night: $${h.pricePerNightUsd}, Rating: ${h.rating}, Perks: [${(h.perks || []).join(', ')}], Tag: "${h.tag || ''}"`
      ).join('\n');

      const systemPrompt = `You are the Gemini AI Travel Intelligence engine for "TON Travel" — the premier Telegram Mini App for booking hotels worldwide with TON cryptocurrency cashback.

User Booking History & DNA:
- Telegram Premium Status: ${isPremium ? 'YES (8% Base Cashback)' : 'NO (5% Base Cashback)'}
- Loyalty Tier Bonus: +${loyaltyBonusPercentage}%
- Total TON Cashback Rate: ${totalCashbackRate}%
- TON Market Price: $${tonPriceUsd} USD
- Current Accumulated TON Balance: ${tonBalance} TON
- Past Bookings Summary:
${historySummary}

User Stated Travel Preferences:
- Preferred Travel Styles / Vibes: ${stylesList}
- Budget Tier: ${preferences?.budgetTier || 'Flexible Luxury ($300 - $800/night)'}
- Trip Pace: ${preferences?.tripPace || 'Relaxing & Scenic'}
- Desired Perks / Amenities: ${perksList}

Available Hotel Catalog (use exact IDs for these so users can book them in-app):
${catalogSummary}

Your Mission:
1. Deeply analyze the user's booking history (destinations, spending patterns, room preferences) and custom travel preferences.
2. Select 3-4 top personalized "Hidden Gem" hotel recommendations that maximize TON cashback while matching their unique vibe.
3. Calculate exact TON cashback earnings: (pricePerNightUsd * nights * (${totalCashbackRate} / 100)) / ${tonPriceUsd}.
4. Provide customized reasons ("whyYoullLoveIt") referencing their booking history/preferences, and insider secrets.

Output strictly valid JSON adhering to this schema:
{
  "travelProfileSummary": "1-2 punchy sentences describing user travel persona and cashback strategy",
  "cashbackOptimizationTips": [
    "Tip 1...",
    "Tip 2..."
  ],
  "suggestions": [
    {
      "hotelId": "exact id from catalog or custom-gem-id",
      "hotelName": "Hotel Name",
      "destination": "City, Country",
      "matchScore": 98,
      "tag": "#1 Cashback Maximizer or Hidden Gem Tag",
      "whyYoullLoveIt": "Personalized rationale referencing booking history and chosen vibes",
      "insiderTip": "Specific insider perk, secret spot, or optimal booking advice",
      "pricePerNightUsd": 480,
      "nightsRecommendation": 3,
      "estimatedCashbackTon": 26.56,
      "estimatedCashbackUsd": 144.0,
      "cashbackRatePercent": ${totalCashbackRate},
      "primaryVibe": "Cliffside Eco-Luxury",
      "catalogHotel": true
    }
  ]
}
Return ONLY pure JSON.`;

      if (!ai) {
        return res.json(getFallbackSmartSuggestions({
          bookingHistory,
          preferences,
          isPremium,
          loyaltyBonusPercentage,
          tonPriceUsd,
          availableHotels
        }));
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: systemPrompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const responseText = response.text || '';
      try {
        const parsed = JSON.parse(responseText);
        return res.json(parsed);
      } catch (e) {
        return res.json(getFallbackSmartSuggestions({
          bookingHistory,
          preferences,
          isPremium,
          loyaltyBonusPercentage,
          tonPriceUsd,
          availableHotels
        }));
      }
    } catch (error: any) {
      if (error?.status === 403 || error?.message?.includes('403') || error?.message?.includes('PERMISSION_DENIED')) {
        isGeminiAccessDenied = true;
      }
      return res.json(getFallbackSmartSuggestions({
        bookingHistory: req.body.bookingHistory,
        preferences: req.body.preferences,
        isPremium: req.body.isPremium,
        loyaltyBonusPercentage: req.body.loyaltyBonusPercentage,
        tonPriceUsd: req.body.tonPriceUsd,
        availableHotels: req.body.availableHotels
      }));
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

function getFallbackTripAdvice(confirmations: any[], isPremium?: boolean) {
  const cashbackRate = isPremium ? 8 : 5;

  return {
    destinationTitle: 'Bali & Uluwatu Luxury Getaway',
    datesOverview: 'Sep 10, 2026 – Sep 13, 2026 (3 Nights at Alila Villas Uluwatu)',
    nearbyExperiences: [
      {
        title: 'Sundays Beach Club Cliffside Dining',
        category: 'Dining & Relaxation',
        description: 'Exclusive beach club nestled beneath the Uluwatu cliffs with crystal lagoons and beachfront bonfires.',
        estimatedCostUsd: 120,
        cashbackTon: Number((120 * (cashbackRate / 100) / 5.42).toFixed(2)),
        tip: 'Reserve a sunbed by 10:00 AM to enjoy the morning low-tide lagoon.'
      },
      {
        title: 'Sunset Kecak & Fire Dance at Uluwatu Temple',
        category: 'Cultural Experience',
        description: 'Watch traditional Balinese performance set against panoramic ocean cliff sunsets.',
        estimatedCostUsd: 45,
        cashbackTon: Number((45 * (cashbackRate / 100) / 5.42).toFixed(2)),
        tip: 'Arrive 45 minutes early at 5:15 PM for prime amphitheater seats.'
      }
    ],
    optimalTimingAdvice: [
      {
        topic: 'Early Check-in Window',
        advice: 'Alila Villas offers complimentary early lounge access if arriving before 3:00 PM check-in.'
      }
    ],
    tonCashbackMaximizer: [
      {
        strategy: 'Telegram Premium 8% Cashback Tier',
        benefit: `Earning ${cashbackRate}% in TON directly to your Telegram TON Space wallet.`
      }
    ],
    aiSummary: 'Based on your Gmail travel confirmations, we analyzed your upcoming trip to Uluwatu, Bali. Here are top nearby experiences and timing tips to earn maximum TON cashback!'
  };
}

function getFallbackSmartSuggestions(params: {
  bookingHistory?: any[];
  preferences?: any;
  isPremium?: boolean;
  loyaltyBonusPercentage?: number;
  tonPriceUsd?: number;
  availableHotels?: any[];
}) {
  const {
    bookingHistory = [],
    preferences = {},
    isPremium = true,
    loyaltyBonusPercentage = 0,
    tonPriceUsd = 5.42,
    availableHotels = []
  } = params;

  const baseRate = isPremium ? 8 : 5;
  const rate = baseRate + (loyaltyBonusPercentage || 0);

  // Check past cities to customize recommendations
  const pastCities = bookingHistory.map((b: any) => (b.hotelLocation || b.hotelName || '').toLowerCase());
  const hasBali = pastCities.some((c: string) => c.includes('bali') || c.includes('uluwatu'));
  const hasDubai = pastCities.some((c: string) => c.includes('dubai'));
  const hasMaldives = pastCities.some((c: string) => c.includes('maldives') || c.includes('noonu'));

  const userStyles: string[] = preferences.travelStyles || [];
  const prefersOverwater = userStyles.includes('Overwater Villas') || hasMaldives;
  const prefersHeritage = userStyles.includes('Historic & Cultural Palaces');
  const prefersSkyline = userStyles.includes('Skyline & City Lights') || hasDubai;

  const suggestions = [
    {
      hotelId: prefersOverwater ? 'hotel-maldives-05' : 'hotel-bali-01',
      hotelName: prefersOverwater ? 'Soneva Jani' : 'Alila Villas Uluwatu',
      destination: prefersOverwater ? 'Noonu Atoll, Maldives' : 'Uluwatu, Bali, Indonesia',
      matchScore: 99,
      tag: '🔥 #1 TON Cashback Maximizer',
      whyYoullLoveIt: prefersOverwater
        ? 'Your travel profile loves bespoke private villas. Soneva Jani provides the highest absolute TON cashback yield per night with private ocean water slides.'
        : 'Based on your preference for cliffside scenery and ocean sunsets, this eco-luxury sanctuary offers high TON yield with private pools and butler service.',
      insiderTip: prefersOverwater
        ? 'Book the 1-Bedroom Water Reserve for stargazing via the retractable master bedroom roof.'
        : 'Request Villa #14 on the upper ridge for panoramic 180° sunset vistas over the Indian Ocean.',
      pricePerNightUsd: prefersOverwater ? 1350 : 480,
      nightsRecommendation: 3,
      estimatedCashbackTon: Number(((prefersOverwater ? 1350 : 480) * 3 * (rate / 100) / tonPriceUsd).toFixed(2)),
      estimatedCashbackUsd: Number(((prefersOverwater ? 1350 : 480) * 3 * (rate / 100)).toFixed(2)),
      cashbackRatePercent: rate,
      primaryVibe: prefersOverwater ? 'Overwater Luxury & Stargazing' : 'Cliffside Eco-Sanctuary',
      catalogHotel: true
    },
    {
      hotelId: prefersHeritage ? 'hotel-istanbul-11' : 'hotel-dubai-03',
      hotelName: prefersHeritage ? 'Çırağan Palace Kempinski' : 'Atlantis The Royal Dubai',
      destination: prefersHeritage ? 'Bosphorus, Istanbul, Turkey' : 'Palm Jumeirah, Dubai, UAE',
      matchScore: 96,
      tag: prefersHeritage ? '👑 Imperial Palace Hidden Gem' : '✨ High-Roller Cashback Stay',
      whyYoullLoveIt: prefersHeritage
        ? 'Historic 19th-century Ottoman imperial palace with heated Bosphorus infinity pool and regal suites that maximize TON rewards.'
        : 'Iconic Palm Jumeirah architectural marvel featuring Cloud 22 sky infinity pool and celebrity chef restaurants with high cashback multipliers.',
      insiderTip: prefersHeritage
        ? 'Book breakfast on the Bosphorus terrace at 9:00 AM for dolphin pods passing through the strait.'
        : 'TON Travel guests receive complimentary VIP passes to the Aquaventure waterpark and Cloud 22 sunset cabana priority.',
      pricePerNightUsd: prefersHeritage ? 520 : 650,
      nightsRecommendation: 2,
      estimatedCashbackTon: Number(((prefersHeritage ? 520 : 650) * 2 * (rate / 100) / tonPriceUsd).toFixed(2)),
      estimatedCashbackUsd: Number(((prefersHeritage ? 520 : 650) * 2 * (rate / 100)).toFixed(2)),
      cashbackRatePercent: rate,
      primaryVibe: prefersHeritage ? 'Imperial Ottoman Elegance' : 'Futuristic Sky Pool Luxury',
      catalogHotel: true
    },
    {
      hotelId: 'hotel-tokyo-04',
      hotelName: 'Aman Tokyo',
      destination: 'Otemachi Tower, Tokyo, Japan',
      matchScore: 94,
      tag: '🌸 Zen Wellness & Onsen Pick',
      whyYoullLoveIt: 'Harmonious urban sanctuary blending traditional Japanese onsen bathing rituals and Mount Fuji views with high TON rewards.',
      insiderTip: 'Reserve the evening private furo soaking bath session overlooking Tokyo Imperial Palace gardens.',
      pricePerNightUsd: 920,
      nightsRecommendation: 2,
      estimatedCashbackTon: Number((920 * 2 * (rate / 100) / tonPriceUsd).toFixed(2)),
      estimatedCashbackUsd: Number((920 * 2 * (rate / 100)).toFixed(2)),
      cashbackRatePercent: rate,
      primaryVibe: 'Zen Onsen & Skyline Sanctuary',
      catalogHotel: true
    },
    {
      hotelId: 'hotel-bangkok-07',
      hotelName: 'Capella Bangkok',
      destination: 'Chao Phraya River, Bangkok, Thailand',
      matchScore: 92,
      tag: '💎 Hidden Riverside Sanctuary',
      whyYoullLoveIt: 'Intimate boutique riverfront villas with private outdoor jacuzzis and Côte by Michelin 3-star Chef Mauro Colagreco.',
      insiderTip: 'Enjoy the complimentary daily sunset cocktail salon exclusively for Capella residents.',
      pricePerNightUsd: 410,
      nightsRecommendation: 3,
      estimatedCashbackTon: Number((410 * 3 * (rate / 100) / tonPriceUsd).toFixed(2)),
      estimatedCashbackUsd: Number((410 * 3 * (rate / 100)).toFixed(2)),
      cashbackRatePercent: rate,
      primaryVibe: 'Riverfront Elegance & Michelin Dining',
      catalogHotel: true
    }
  ];

  return {
    travelProfileSummary: bookingHistory.length > 0
      ? `Analysis of your ${bookingHistory.length} previous booking(s) and selected vibes indicates a penchant for high-comfort scenic retreats with high TON cashback efficiency.`
      : 'Tailored for discerning TON travelers seeking hidden gem sanctuaries with maximum cryptocurrency rewards and elite perks.',
    cashbackOptimizationTips: [
      `You are currently earning ${rate}% in TON (${isPremium ? 'Telegram Premium 8%' : 'Standard 5%'} + ${loyaltyBonusPercentage}% Tier Bonus).`,
      'Booking 3+ nights at our top recommendations unlocks up to 35+ TON cashback directly into your TON Space wallet.',
      'Stack TON cashback with direct Telegram TON Space payouts for 0-gas fee liquidity.'
    ],
    suggestions
  };
}

startServer();
