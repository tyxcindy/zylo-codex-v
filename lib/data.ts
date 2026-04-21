import type {
  AuditEvent,
  Destination,
  Place,
  PlatformConnection,
  SourceArtifact,
  TasteProfile,
  Trip,
  User
} from "@/lib/domain";

export const demoUser: User = {
  id: "user_demo_01",
  email: "alex@zylo.app",
  displayName: "Alex Explorer",
  homeCity: "New York",
  joinedAt: "2026-04-14"
};

export const tasteProfile: TasteProfile = {
  userId: demoUser.id,
  priorities: ["walkability", "hidden gems", "design-forward spaces"],
  favoriteCuisines: ["Japanese", "Coffee", "Mediterranean"],
  avoids: ["heavy chain restaurants"]
};

export const destinations: Destination[] = [
  {
    id: "dst_local_nyc",
    name: "New York",
    country: "USA",
    vibe: "Your Local board for spots nearby, retries, and places worth testing first.",
    placeCount: 18,
    coverTone: "from-emerald-400/24 via-cyan-300/14 to-sky-400/20",
    imageUrl:
      "https://images.unsplash.com/photo-1499092346589-b9b6be3e94b2?auto=format&fit=crop&w=1200&q=80",
    spotlightTags: ["Local", "Weeknight", "Fast save"]
  },
  {
    id: "dst_tokyo",
    name: "Tokyo",
    country: "Japan",
    vibe: "Neon, food, culture, and side streets worth drifting through.",
    placeCount: 124,
    coverTone: "from-violet-500/30 via-indigo-400/12 to-sky-400/24",
    imageUrl:
      "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1200&q=80",
    spotlightTags: ["Neon", "Food", "Culture"]
  },
  {
    id: "dst_paris",
    name: "Paris",
    country: "France",
    vibe: "Cafe corners, old wood bars, and slow city wandering.",
    placeCount: 82,
    coverTone: "from-orange-400/24 via-rose-400/18 to-violet-500/20",
    imageUrl:
      "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80",
    spotlightTags: ["Cafe", "Art"]
  },
  {
    id: "dst_bali",
    name: "Bali",
    country: "Indonesia",
    vibe: "Beach dinners, warm light, and relaxed photo spots.",
    placeCount: 45,
    coverTone: "from-fuchsia-400/24 via-amber-300/16 to-orange-300/24",
    imageUrl:
      "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80",
    spotlightTags: ["Beach", "Relax"]
  },
  {
    id: "dst_london",
    name: "London",
    country: "UK",
    vibe: "Street markets, museums, and easy all-day routes.",
    placeCount: 61,
    coverTone: "from-sky-400/22 via-cyan-300/18 to-indigo-400/20",
    imageUrl:
      "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1200&q=80",
    spotlightTags: ["Vintage", "Museums"]
  }
];

export const places: Place[] = [
  {
    id: "pl_0",
    destinationId: "dst_local_nyc",
    name: "Dayglow Coffee",
    city: "New York",
    country: "USA",
    category: "cafes",
    address: "76 E 7th St, New York, NY",
    description: "A sharp coffee stop that fits the Local board: fast, easy, and worth keeping on repeat when a reel turns into a real plan.",
    coordinates: { lat: 40.7276, lng: -73.9865 },
    timesSeen: 3,
    sourceCount: 2,
    isVisited: false,
    isInTrip: false,
    tags: ["#local", "#coffee", "#east-village"],
    imageUrl:
      "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: "pl_1",
    destinationId: "dst_tokyo",
    name: "Hidden Cafe in Shibuya",
    city: "Tokyo",
    country: "Japan",
    category: "cafes",
    address: "Shibuya, Tokyo",
    description: "Design-forward coffee stop found in multiple saves and route-perfect for a slow morning.",
    coordinates: { lat: 35.6595, lng: 139.7004 },
    timesSeen: 9,
    sourceCount: 4,
    isVisited: false,
    isInTrip: true,
    tags: ["#neon", "#aesthetic", "#coffee"],
    imageUrl:
      "https://images.unsplash.com/photo-1554797589-7241bb691973?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: "pl_2",
    destinationId: "dst_paris",
    name: "Le Marais Croissant",
    city: "Paris",
    country: "France",
    category: "restaurants",
    address: "Le Marais, Paris",
    description: "A reel-famous pastry stop that keeps showing up in your Paris folders.",
    coordinates: { lat: 48.8575, lng: 2.3622 },
    timesSeen: 6,
    sourceCount: 3,
    isVisited: false,
    isInTrip: false,
    tags: ["#food", "#hidden-gem", "#morning"],
    imageUrl:
      "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: "pl_3",
    destinationId: "dst_bali",
    name: "Sunset Temple View",
    city: "Bali",
    country: "Indonesia",
    category: "photo spots",
    address: "Canggu, Bali",
    description: "Golden-hour save with an easy dinner follow-up nearby.",
    coordinates: { lat: -8.6478, lng: 115.1385 },
    timesSeen: 8,
    sourceCount: 5,
    isVisited: false,
    isInTrip: false,
    tags: ["#sunset", "#photo", "#beach"],
    imageUrl:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: "pl_4",
    destinationId: "dst_london",
    name: "Portobello Vintage Route",
    city: "London",
    country: "UK",
    category: "activities",
    address: "Notting Hill, London",
    description: "Best stacked into a half-day with coffee and a nearby record shop.",
    coordinates: { lat: 51.5154, lng: -0.2057 },
    timesSeen: 4,
    sourceCount: 2,
    isVisited: true,
    isInTrip: false,
    tags: ["#vintage", "#walkable", "#market"],
    imageUrl:
      "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: "pl_5",
    destinationId: "dst_tokyo",
    name: "TeamLab Planets Art",
    city: "Tokyo",
    country: "Japan",
    category: "activities",
    address: "Toyosu, Tokyo",
    description: "Immersive art stop that fits cleanly into a late-afternoon city loop.",
    coordinates: { lat: 35.6492, lng: 139.7907 },
    timesSeen: 5,
    sourceCount: 4,
    isVisited: false,
    isInTrip: true,
    tags: ["#activity", "#art", "#indoor"],
    imageUrl:
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: "pl_6",
    destinationId: "dst_bali",
    name: "Sauna Stay in Banff",
    city: "Banff",
    country: "Canada",
    category: "hotels",
    address: "Banff Avenue, Banff",
    description: "Cabin-style stay with a saved sauna clip that keeps reappearing in your folders.",
    coordinates: { lat: 51.1784, lng: -115.5708 },
    timesSeen: 3,
    sourceCount: 2,
    isVisited: false,
    isInTrip: false,
    tags: ["#stay", "#sauna", "#winter"],
    imageUrl:
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80"
  }
];

export const sourceArtifacts: SourceArtifact[] = [
  {
    id: "src_1",
    type: "url",
    label: "Tokyo ramen reel",
    status: "complete",
    createdAt: "2026-04-15T08:30:00Z",
    extractedPlaces: 12
  },
  {
    id: "src_2",
    type: "image",
    label: "Bali screenshot dump",
    status: "processing",
    createdAt: "2026-04-16T10:10:00Z",
    extractedPlaces: 0
  },
  {
    id: "src_3",
    type: "text",
    label: "Paris cafe notes",
    status: "queued",
    createdAt: "2026-04-16T10:35:00Z",
    extractedPlaces: 0
  }
];

export const trips: Trip[] = [
  {
    id: "trip_1",
    title: "Tokyo Drift",
    destinationId: "dst_tokyo",
    status: "upcoming",
    vibe: "Foodie",
    travelers: 2,
    dateRange: "Oct 12 - 18",
    imageUrl:
      "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1200&q=80",
    days: [
      {
        id: "day_1",
        title: "Arrival & Shibuya Crossing",
        stops: [
          {
            id: "stop_1",
            placeId: "pl_1",
            time: "10:00 AM",
            note: "Travel"
          }
        ]
      },
      {
        id: "day_2",
        title: "Tsukiji Market Breakfast",
        stops: [
          {
            id: "stop_2",
            placeId: "pl_2",
            time: "08:00 AM",
            note: "Food"
          }
        ]
      },
      {
        id: "day_3",
        title: "TeamLab Planets Art",
        stops: [
          {
            id: "stop_3",
            placeId: "pl_5",
            time: "02:00 PM",
            note: "Activity"
          }
        ]
      },
      {
        id: "day_4",
        title: "Hidden Cafe in Harajuku",
        stops: [
          {
            id: "stop_4",
            placeId: "pl_1",
            time: "04:30 PM",
            note: "Food"
          }
        ]
      },
      {
        id: "day_5",
        title: "Tokyo Tower Sunset",
        stops: [
          {
            id: "stop_5",
            placeId: "pl_3",
            time: "06:00 PM",
            note: "Photo"
          }
        ]
      }
    ]
  }
];

export const platformConnections: PlatformConnection[] = [
  {
    id: "pc_1",
    platform: "Instagram",
    status: "coming-soon",
    summary: "OAuth scaffold only in v1. Use manual link import for now."
  },
  {
    id: "pc_2",
    platform: "TikTok",
    status: "coming-soon",
    summary: "OAuth scaffold only in v1. Use manual link import for now."
  },
  {
    id: "pc_3",
    platform: "Beli",
    status: "planned",
    summary: "Taste-profile enrichment comes later. It is not part of the first beta."
  }
];

export const auditEvents: AuditEvent[] = [
  {
    id: "audit_1",
    type: "security",
    message: "Rate limit engaged for repeated sign-in attempts",
    timestamp: "2026-04-16T09:32:00Z",
    severity: "warn"
  },
  {
    id: "audit_2",
    type: "import",
    message: "URL import completed with 12 verified places",
    timestamp: "2026-04-16T09:45:00Z",
    severity: "info"
  },
  {
    id: "audit_3",
    type: "ai",
    message: "Trip generation request completed in 2.4 seconds",
    timestamp: "2026-04-16T09:49:00Z",
    severity: "info"
  }
];

export const metrics = [
  { label: "Places extracted", value: "328" },
  { label: "Cities found", value: "24" },
  { label: "Itineraries", value: "3" },
  { label: "Upcoming trip", value: "Tokyo" }
];

export const searchCategories = [
  { label: "Food", count: 142, tone: "from-orange-500 to-amber-500" },
  { label: "Coffee", count: 89, tone: "from-amber-700 to-orange-500" },
  { label: "Spots", count: 204, tone: "from-fuchsia-500 to-pink-500" },
  { label: "Stays", count: 32, tone: "from-indigo-500 to-violet-500" },
  { label: "Activity", count: 76, tone: "from-emerald-500 to-teal-400" }
] as const;

export const searchVibes = [
  "#neon",
  "#aesthetic",
  "#hidden-gem",
  "#omakase",
  "#rooftop",
  "#sunset",
  "#vintage",
  "#nature"
];

export const faqs = [
  {
    question: "Can Zylo connect directly to Instagram and TikTok?",
    answer:
      "Public beta focuses on reliable manual import from reel links, pasted captions, screenshots, and travel notes. Direct account sync is roadmap only and will ship later through durable, compliant integrations."
  },
  {
    question: "Does Zylo work on mobile?",
    answer:
      "Yes. The first version is a responsive web app with a PWA shell, mobile-first navigation, large tap targets, and fast page transitions."
  },
  {
    question: "Can I use Zylo for more than travel later?",
    answer:
      "Yes. The underlying data model supports broader saved-content categories, but Zylo launches travel-first to keep the experience sharp."
  }
];

export function getDestinationById(destinationId: string) {
  return destinations.find((destination) => destination.id === destinationId) ?? null;
}

export function getPlacesForDestination(destinationId: string) {
  return places.filter((place) => place.destinationId === destinationId);
}

export const providerChecklist = [
  {
    key: "gemini",
    label: "Gemini",
    note: "AI extraction and itinerary-aware chat"
  },
  {
    key: "googleMaps",
    label: "Google Maps / Places",
    note: "Place enrichment, coordinates, and verified addresses"
  },
  {
    key: "unsplash",
    label: "Unsplash",
    note: "Fallback travel imagery for destinations and places"
  },
  {
    key: "supabase",
    label: "Supabase",
    note: "Auth, database, storage, and server-side security rules"
  },
  {
    key: "resend",
    label: "Resend",
    note: "Verification and reset email delivery"
  }
] as const;
