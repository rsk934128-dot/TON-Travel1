import { Hotel } from '../types';

export const HOTELS: Hotel[] = [
  {
    id: 'hotel-bali-01',
    name: 'Alila Villas Uluwatu',
    location: 'Uluwatu, Bali',
    city: 'Bali',
    country: 'Indonesia',
    category: 'Luxury',
    categoryTags: ['Luxury', 'Resort', 'Eco-Villa'],
    rating: 4.95,
    reviewCount: 382,
    stars: 5,
    images: [
      'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1200&q=80'
    ],
    pricePerNightUsd: 480,
    discountUsd: 520,
    perks: ['Oceanfront Pool', 'Free Breakfast', 'Full Spa', 'Airport Transfer', 'TON VIP Perks'],
    latitude: -8.8452,
    longitude: 115.1328,
    description: 'Perched high on dramatic limestone cliffs overlooking the Indian Ocean, Alila Villas Uluwatu offers open-plan eco-luxury villas with private infinity pools, dedicated butler service, and world-class dining.',
    popular: true,
    tag: 'Top Pick for TON Stays',
    rooms: [
      {
        id: 'r1',
        name: 'One-Bedroom Ocean Pool Villa',
        pricePerNightUsd: 480,
        bedType: '1 King Bed',
        capacity: '2 Adults',
        features: ['Private Infinity Pool', 'Ocean View Cabana', 'Espresso Machine', '24/7 Butler']
      },
      {
        id: 'r2',
        name: 'Cliff Edge Sunset Sanctuary',
        pricePerNightUsd: 720,
        bedType: '1 Super King Bed',
        capacity: '2 Adults, 1 Child',
        features: ['Panoramic Cliff View', 'Plunge Pool', 'Free Spa Treatment', 'Helipad Access']
      }
    ]
  },
  {
    id: 'hotel-paris-02',
    name: 'Hôtel Plaza Athénée Paris',
    location: 'Avenue Montaigne, Paris',
    city: 'Paris',
    country: 'France',
    category: 'Luxury',
    categoryTags: ['Luxury', 'Boutique'],
    rating: 4.92,
    reviewCount: 512,
    stars: 5,
    images: [
      'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80'
    ],
    pricePerNightUsd: 890,
    perks: ['Eiffel Tower View', 'Dior Spa', 'Michelin Dining', 'Concierge Service'],
    latitude: 48.8661,
    longitude: 2.3048,
    description: 'Located on Haute Couture avenue Montaigne, Hôtel Plaza Athénée offers luxury Parisian living with iconic red geranium windows, Eiffel Tower views, and haute cuisine.',
    popular: true,
    tag: 'Eiffel Tower View',
    rooms: [
      {
        id: 'r1',
        name: 'Deluxe Eiffel Tower View Room',
        pricePerNightUsd: 890,
        bedType: '1 King Bed',
        capacity: '2 Guests',
        features: ['Eiffel Tower Balcony', 'Marble Bathroom', 'Dior Toiletries', 'Champagne Welcome']
      },
      {
        id: 'r2',
        name: 'Haute Couture Prestige Suite',
        pricePerNightUsd: 1450,
        bedType: '1 King + Sofa Bed',
        capacity: '3 Guests',
        features: ['Louis XVI Decor', 'Private Lounge', 'Personal Concierge', 'Limousine Transfer']
      }
    ]
  },
  {
    id: 'hotel-dubai-03',
    name: 'Atlantis The Royal Dubai',
    location: 'Palm Jumeirah, Dubai',
    city: 'Dubai',
    country: 'UAE',
    category: 'Luxury',
    categoryTags: ['Luxury', 'Resort'],
    rating: 4.98,
    reviewCount: 890,
    stars: 5,
    images: [
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80'
    ],
    pricePerNightUsd: 650,
    discountUsd: 710,
    perks: ['Cloud 22 Sky Pool', 'Nobu Restaurant', 'Aquaventure Park Access', 'Helipad'],
    latitude: 25.1382,
    longitude: 55.1294,
    description: 'Dubai’s newest architectural marvel on the Palm Jumeirah features 90 swimming pools, celebrity chef restaurants, and panoramic views of the Arabian Sea.',
    popular: true,
    tag: 'Highest Cashback Stay',
    rooms: [
      {
        id: 'r1',
        name: 'Palm Landscape Room',
        pricePerNightUsd: 650,
        bedType: '1 King Bed',
        capacity: '2 Adults',
        features: ['Private Balcony', 'Sea & Skyline View', 'Free Waterpark Access', 'Smart Controls']
      },
      {
        id: 'r2',
        name: 'Sky Pool Villa',
        pricePerNightUsd: 1200,
        bedType: '1 Super King Bed',
        capacity: '2 Adults',
        features: ['Private Sky Infinity Pool', 'Hermès Amenities', '24h Personal Butler']
      }
    ]
  },
  {
    id: 'hotel-tokyo-04',
    name: 'Aman Tokyo',
    location: 'Otemachi Tower, Tokyo',
    city: 'Tokyo',
    country: 'Japan',
    category: 'Luxury',
    categoryTags: ['Luxury', 'Boutique'],
    rating: 4.96,
    reviewCount: 410,
    stars: 5,
    images: [
      'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1200&q=80'
    ],
    pricePerNightUsd: 920,
    perks: ['Mount Fuji View', 'Traditional Onsen Bath', '30m Sky Pool', 'Tea Ceremony Lounge'],
    latitude: 35.6865,
    longitude: 139.7634,
    description: 'Occupying the top six floors of Otemachi Tower, Aman Tokyo harmonizes urban dynamism with traditional Japanese aesthetics, featuring washi paper lanterns and cedar soak tubs.',
    popular: true,
    rooms: [
      {
        id: 'r1',
        name: 'Deluxe Suite with Imperial Garden View',
        pricePerNightUsd: 920,
        bedType: '1 King Bed',
        capacity: '2 Adults',
        features: ['Furo Soaking Tub', 'Shoji Screens', 'Bose Sound System', 'Custom Green Tea Bar']
      }
    ]
  },
  {
    id: 'hotel-maldives-05',
    name: 'Soneva Jani',
    location: 'Noonu Atoll',
    city: 'Maldives',
    country: 'Maldives',
    category: 'Luxury',
    categoryTags: ['Luxury', 'Resort', 'Eco-Villa'],
    rating: 4.99,
    reviewCount: 290,
    stars: 5,
    images: [
      'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80'
    ],
    pricePerNightUsd: 1350,
    discountUsd: 1500,
    perks: ['Water Slide into Ocean', 'Retractable Roof for Stargazing', 'Private Lagoon', 'Barefoot Butler'],
    latitude: 5.6186,
    longitude: 73.2844,
    description: 'Famous for overwater villas with private water slides straight into the turquoise lagoon and retractable roofs in master bedrooms for stargazing in bed.',
    popular: true,
    tag: 'Overwater Slide Villa',
    rooms: [
      {
        id: 'r1',
        name: '1-Bedroom Water Reserve with Slide',
        pricePerNightUsd: 1350,
        bedType: '1 King Bed',
        capacity: '2 Adults + 2 Kids',
        features: ['Water Slide to Ocean', 'Retractable Bedroom Roof', 'Private Pool', 'Unlimited Ice Cream Parlor Access']
      }
    ]
  },
  {
    id: 'hotel-ny-06',
    name: 'The Standard High Line',
    location: 'Meatpacking District, New York',
    city: 'New York',
    country: 'USA',
    category: 'Boutique',
    categoryTags: ['Boutique', 'Luxury'],
    rating: 4.82,
    reviewCount: 740,
    stars: 4,
    images: [
      'https://images.unsplash.com/photo-1568084680786-a84f91d1153c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1541971875076-8f970d573be6?auto=format&fit=crop&w=1200&q=80'
    ],
    pricePerNightUsd: 340,
    perks: ['Hudson River Floor-to-Ceiling Windows', 'Rooftop Bar Le Bain', 'Free Bicycles', 'Pet Friendly'],
    latitude: 40.7411,
    longitude: -74.0080,
    description: 'Hovering directly over the High Line park in Manhattan’s vibrant Meatpacking District, every room features sweeping views of the Hudson River and NYC skyline.',
    popular: false,
    rooms: [
      {
        id: 'r1',
        name: 'Standard Queen Hudson View',
        pricePerNightUsd: 340,
        bedType: '1 Queen Bed',
        capacity: '2 Guests',
        features: ['Floor-to-Ceiling Windows', 'Rain Shower', 'Italian Linens']
      }
    ]
  },
  {
    id: 'hotel-bangkok-07',
    name: 'Capella Bangkok',
    location: 'Charoenkrung Road, Bangkok',
    city: 'Bangkok',
    country: 'Thailand',
    category: 'Luxury',
    categoryTags: ['Luxury', 'Resort', 'Boutique'],
    rating: 4.94,
    reviewCount: 310,
    stars: 5,
    images: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80'
    ],
    pricePerNightUsd: 410,
    perks: ['Chao Phraya Riverfront', 'Michelin Côte by Mauro Colagreco', 'Riverside Villas', 'Aromatherapy Spa'],
    latitude: 13.7135,
    longitude: 100.5108,
    description: 'An urban sanctuary along the legendary Chao Phraya River with private plunge pools, world-class dining, and tailored cultural experiences.',
    popular: false,
    rooms: [
      {
        id: 'r1',
        name: 'Riverfront Premier Room',
        pricePerNightUsd: 410,
        bedType: '1 King Bed',
        capacity: '2 Guests',
        features: ['Balcony over River', 'Marble Bath', 'Personal Culturist Service']
      }
    ]
  },
  {
    id: 'hotel-rome-08',
    name: 'Hotel Eden - Dorchester Collection',
    location: 'Via Ludovisi, Rome',
    city: 'Rome',
    country: 'Italy',
    category: 'Luxury',
    categoryTags: ['Luxury', 'Boutique'],
    rating: 4.89,
    reviewCount: 420,
    stars: 5,
    images: [
      'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80'
    ],
    pricePerNightUsd: 590,
    perks: ['Rooftop View of St. Peter’s Dome', 'Valmont Spa', 'Fine Italian Wine Cellar'],
    latitude: 41.9059,
    longitude: 12.4878,
    description: 'Moments from the Spanish Steps, Hotel Eden offers authentic Roman grandeur, unmatched rooftop panoramas across the Eternal City, and Michelin-starred dining.',
    popular: false,
    rooms: [
      {
        id: 'r1',
        name: 'Classic Roman Deluxe Room',
        pricePerNightUsd: 590,
        bedType: '1 King Bed',
        capacity: '2 Guests',
        features: ['High Ceilings', 'Carrara Marble Bath', 'City Panoramas']
      }
    ]
  },
  {
    id: 'hotel-london-09',
    name: 'The Ned London',
    location: 'City of London, London',
    city: 'London',
    country: 'UK',
    category: 'Boutique',
    categoryTags: ['Boutique', 'Luxury'],
    rating: 4.86,
    reviewCount: 650,
    stars: 5,
    images: [
      'https://images.unsplash.com/photo-1517840901100-8179e982acb7?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80'
    ],
    pricePerNightUsd: 390,
    perks: ['Rooftop Pool & Bar', '10 Restaurants under 1 Roof', 'Former Bank Vault Lounge', 'Ned’s Club Gym'],
    latitude: 51.5132,
    longitude: -0.0890,
    description: 'Housed in Sir Edwin Lutyens’ historic former bank building, featuring 10 distinctive restaurants, a rooftop pool with views of St Paul’s Cathedral, and Ned’s Club Spa.',
    popular: false,
    rooms: [
      {
        id: 'r1',
        name: 'Heritage Medium Room',
        pricePerNightUsd: 390,
        bedType: '1 King Bed',
        capacity: '2 Guests',
        features: ['1920s Vintage Design', 'Walk-in Rainforest Shower', 'Cowshed Products']
      }
    ]
  },
  {
    id: 'hotel-barcelona-10',
    name: 'W Barcelona',
    location: 'Barceloneta Beach, Barcelona',
    city: 'Barcelona',
    country: 'Spain',
    category: 'Resort',
    categoryTags: ['Resort', 'Luxury', 'Boutique'],
    rating: 4.80,
    reviewCount: 920,
    stars: 5,
    images: [
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80'
    ],
    pricePerNightUsd: 320,
    perks: ['Direct Beach Access', 'WET Deck Pool', 'Eclipsi Rooftop Lounge', 'Bliss Spa'],
    latitude: 41.3688,
    longitude: 2.1901,
    description: 'Designed by world-renowned architect Ricardo Bofill, W Barcelona rises above Barceloneta beach with floor-to-ceiling glass windows and vibrant Mediterranean energy.',
    popular: false,
    rooms: [
      {
        id: 'r1',
        name: 'Fabulous Mediterranean View Room',
        pricePerNightUsd: 320,
        bedType: '1 King Bed',
        capacity: '2 Guests',
        features: ['Sea View Glass Wall', 'Mood Lighting', 'Munchie Box']
      }
    ]
  },
  {
    id: 'hotel-istanbul-11',
    name: 'Çırağan Palace Kempinski',
    location: 'Bosphorus Strait, Istanbul',
    city: 'Istanbul',
    country: 'Turkey',
    category: 'Luxury',
    categoryTags: ['Luxury', 'Boutique', 'Resort'],
    rating: 4.91,
    reviewCount: 580,
    stars: 5,
    images: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1200&q=80'
    ],
    pricePerNightUsd: 520,
    perks: ['Ottoman Palace Architecture', 'Heated Bosphorus Infinity Pool', 'Helipad Access', 'Imperial Turkish Bath'],
    latitude: 41.0436,
    longitude: 29.0163,
    description: 'A former 19th-century Ottoman imperial palace sitting directly on the shores of the Bosphorus, offering sovereign luxury, heated infinity pools, and authentic royal hospitality.',
    popular: false,
    rooms: [
      {
        id: 'r1',
        name: 'Bosphorus View Grand Room',
        pricePerNightUsd: 520,
        bedType: '1 King Bed',
        capacity: '2 Guests',
        features: ['Bosphorus Balcony', 'Ottoman Decor', '24h Butler Service']
      }
    ]
  },
  {
    id: 'hotel-sydney-12',
    name: 'Park Hyatt Sydney',
    location: 'The Rocks, Sydney',
    city: 'Sydney',
    country: 'Australia',
    category: 'Luxury',
    categoryTags: ['Luxury', 'Boutique'],
    rating: 4.93,
    reviewCount: 460,
    stars: 5,
    images: [
      'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80'
    ],
    pricePerNightUsd: 780,
    perks: ['Unobstructed Opera House View', 'Rooftop Pool & Spa', 'Private Boardwalk Access'],
    latitude: -33.8568,
    longitude: 151.2093,
    description: 'Seated directly on the edge of Sydney Harbour in historic The Rocks, Park Hyatt Sydney features unobstructed views of the iconic Sydney Opera House.',
    popular: false,
    rooms: [
      {
        id: 'r1',
        name: 'Opera Harbour View Room',
        pricePerNightUsd: 780,
        bedType: '1 King Bed',
        capacity: '2 Guests',
        features: ['Opera House Balcony', 'Marble Bathroom', 'Aēsop Toiletries']
      }
    ]
  },
  {
    id: 'hotel-ny-budget-13',
    name: 'Pod 39 Hotel Midtown',
    location: 'Murray Hill, New York',
    city: 'New York',
    country: 'USA',
    category: 'Budget',
    categoryTags: ['Budget', 'Boutique'],
    rating: 4.65,
    reviewCount: 810,
    stars: 3,
    images: [
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80'
    ],
    pricePerNightUsd: 135,
    discountUsd: 160,
    perks: ['Rooftop Empire View', 'Free High-Speed WiFi', 'Ping Pong Lounge', 'Subway 2 Min'],
    latitude: 40.7495,
    longitude: -73.9772,
    description: 'Smart modern micro-hotel in vibrant Murray Hill featuring cozy designer pods, a lively rooftop bar with brick arches, and social communal spaces.',
    popular: false,
    tag: 'Budget Favorite',
    rooms: [
      {
        id: 'r1',
        name: 'Full Pod Room',
        pricePerNightUsd: 135,
        bedType: '1 Full Bed',
        capacity: '2 Guests',
        features: ['Dimmer Mood Lighting', 'Rain Shower', 'Climate Control', 'Desk Space']
      }
    ]
  },
  {
    id: 'hotel-paris-budget-14',
    name: 'CitizenM Paris Gare de Lyon',
    location: '12th Arrondissement, Paris',
    city: 'Paris',
    country: 'France',
    category: 'Budget',
    categoryTags: ['Budget', 'Boutique'],
    rating: 4.78,
    reviewCount: 640,
    stars: 4,
    images: [
      'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1200&q=80'
    ],
    pricePerNightUsd: 145,
    discountUsd: 175,
    perks: ['CloudM Sky Bar', 'Superfast WiFi', 'XL King Beds', 'Rainforest Shower'],
    latitude: 48.8443,
    longitude: 2.3735,
    description: 'Affordable luxury boutique design with XL king beds, MoodPad tablet controls, power rain showers, and a chic sky lounge overlooking Paris.',
    popular: false,
    tag: 'Best Value Paris',
    rooms: [
      {
        id: 'r1',
        name: 'King City View Room',
        pricePerNightUsd: 145,
        bedType: '1 XL King Bed',
        capacity: '2 Guests',
        features: ['iPad Room Automation', 'Wall-to-Wall Window', 'Ambient Lighting']
      }
    ]
  },
  {
    id: 'hotel-bali-boutique-15',
    name: 'Komaneka at Monkey Forest Ubud',
    location: 'Ubud, Bali',
    city: 'Bali',
    country: 'Indonesia',
    category: 'Boutique',
    categoryTags: ['Boutique', 'Resort', 'Eco-Villa'],
    rating: 4.88,
    reviewCount: 490,
    stars: 4,
    images: [
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1200&q=80'
    ],
    pricePerNightUsd: 165,
    discountUsd: 195,
    perks: ['Garden Infinity Pool', 'Balinese Afternoon Tea', 'Spa & Yoga', 'Central Ubud Access'],
    latitude: -8.5135,
    longitude: 115.2608,
    description: 'An intimate sanctuary nestled in lush tropical gardens in central Ubud, showcasing authentic contemporary Balinese wood art, pool, and fine dining.',
    popular: false,
    tag: 'Top Boutique Retreat',
    rooms: [
      {
        id: 'r1',
        name: 'Garden Pool Suite',
        pricePerNightUsd: 165,
        bedType: '1 King Bed',
        capacity: '2 Guests',
        features: ['Garden Balcony', 'Sunken Bathtub', 'Daily Free High Tea']
      }
    ]
  },
  {
    id: 'hotel-tokyo-budget-16',
    name: 'The Knot Tokyo Shinjuku',
    location: 'Shinjuku, Tokyo',
    city: 'Tokyo',
    country: 'Japan',
    category: 'Budget',
    categoryTags: ['Budget', 'Boutique'],
    rating: 4.72,
    reviewCount: 715,
    stars: 3,
    images: [
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80'
    ],
    pricePerNightUsd: 125,
    discountUsd: 145,
    perks: ['Park View Balconies', 'Morethan Bakery & Grill', 'Tokyo City Bikes', 'Subway 3 Min'],
    latitude: 35.6896,
    longitude: 139.6917,
    description: 'Trendy lifestyle hotel directly opposite Shinjuku Central Park with an artisanal bakery, tea salon, and modern Japanese minimalist rooms.',
    popular: false,
    tag: 'Tokyo Smart Value',
    rooms: [
      {
        id: 'r1',
        name: 'Standard Double Park View',
        pricePerNightUsd: 125,
        bedType: '1 Queen Bed',
        capacity: '2 Guests',
        features: ['Park Views', 'Air Purifier', 'Cast TV', 'Specialty Drip Coffee']
      }
    ]
  }
];
