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

const destinationSeeds = [
  {
    id: "dst_local_nyc",
    name: "New York",
    country: "USA",
    vibe: "Your Local board for spots nearby, retries, and places worth testing first.",
    coverTone: "from-emerald-400/24 via-cyan-300/14 to-sky-400/20",
    imageUrl:
      "https://images.unsplash.com/photo-1499092346589-b9b6be3e94b2?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: "dst_tokyo",
    name: "Tokyo",
    country: "Japan",
    vibe: "Neon, food, culture, and side streets worth drifting through.",
    coverTone: "from-violet-500/30 via-indigo-400/12 to-sky-400/24",
    imageUrl:
      "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: "dst_paris",
    name: "Paris",
    country: "France",
    vibe: "Cafe corners, old wood bars, and slow city wandering.",
    coverTone: "from-orange-400/24 via-rose-400/18 to-violet-500/20",
    imageUrl:
      "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: "dst_bali",
    name: "Bali",
    country: "Indonesia",
    vibe: "Beach dinners, warm light, and relaxed photo spots.",
    coverTone: "from-fuchsia-400/24 via-amber-300/16 to-orange-300/24",
    imageUrl:
      "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: "dst_london",
    name: "London",
    country: "UK",
    vibe: "Street markets, museums, and easy all-day routes.",
    coverTone: "from-sky-400/22 via-cyan-300/18 to-indigo-400/20",
    imageUrl:
      "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: "dst_mexico_city",
    name: "Mexico City",
    country: "Mexico",
    vibe: "Design hotels, long lunches, and art-heavy neighborhoods that reward wandering.",
    coverTone: "from-amber-400/24 via-orange-400/18 to-rose-500/24",
    imageUrl:
      "https://images.unsplash.com/photo-1585464231875-d9ef1f5ad396?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: "dst_lisbon",
    name: "Lisbon",
    country: "Portugal",
    vibe: "Viewpoints, tiled streets, and easy café-to-dinner days.",
    coverTone: "from-yellow-300/24 via-orange-300/18 to-sky-400/20",
    imageUrl:
      "https://images.unsplash.com/photo-1513735492246-483525079686?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: "dst_seoul",
    name: "Seoul",
    country: "South Korea",
    vibe: "Late-night food energy, brutalist cafes, and polished skyline hits.",
    coverTone: "from-cyan-300/22 via-blue-400/16 to-indigo-500/22",
    imageUrl:
      "https://images.unsplash.com/photo-1549693578-d683be217e58?auto=format&fit=crop&w=1200&q=80"
  }
];

export const places: Place[] = [
  {
    id: "pl_nyc_dayglow",
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
    id: "pl_nyc_lindustrie",
    destinationId: "dst_local_nyc",
    name: "L'Industrie Pizzeria",
    city: "New York",
    country: "USA",
    category: "restaurants",
    address: "104 Christopher St, New York, NY",
    description: "The kind of West Village slice stop that shows up in three reels and becomes a default dinner move.",
    coordinates: { lat: 40.7337, lng: -74.0027 },
    timesSeen: 6,
    sourceCount: 3,
    isVisited: true,
    isInTrip: false,
    tags: ["#pizza", "#west-village", "#repeat-save"],
    imageUrl:
      "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: "pl_nyc_public_hotel",
    destinationId: "dst_local_nyc",
    name: "PUBLIC Rooftop",
    city: "New York",
    country: "USA",
    category: "bars",
    address: "215 Chrystie St, New York, NY",
    description: "Night-view save for when you want skyline payoff without overthinking the plan.",
    coordinates: { lat: 40.7224, lng: -73.9925 },
    timesSeen: 4,
    sourceCount: 2,
    isVisited: false,
    isInTrip: false,
    tags: ["#rooftop", "#night", "#lower-east-side"],
    imageUrl:
      "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: "pl_nyc_little_island",
    destinationId: "dst_local_nyc",
    name: "Little Island Sunset Loop",
    city: "New York",
    country: "USA",
    category: "scenic spots",
    address: "Pier 55 at Hudson River Park, New York, NY",
    description: "Easy scenic reset for a golden-hour walk before dinner downtown.",
    coordinates: { lat: 40.7420, lng: -74.0106 },
    timesSeen: 5,
    sourceCount: 3,
    isVisited: false,
    isInTrip: false,
    tags: ["#sunset", "#walkable", "#hudson"],
    imageUrl:
      "https://images.unsplash.com/photo-1485871981521-5b1fd3805eee?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: "pl_tokyo_hidden_cafe",
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
    id: "pl_tokyo_sushi_dai",
    destinationId: "dst_tokyo",
    name: "Sushi Dai Outer Market",
    city: "Tokyo",
    country: "Japan",
    category: "restaurants",
    address: "6 Chome-5-1 Toyosu, Tokyo",
    description: "Early morning market counter that keeps resurfacing in every serious Tokyo food list.",
    coordinates: { lat: 35.6453, lng: 139.7846 },
    timesSeen: 11,
    sourceCount: 5,
    isVisited: false,
    isInTrip: true,
    tags: ["#sushi", "#market", "#must-eat"],
    imageUrl:
      "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: "pl_tokyo_teamlab",
    destinationId: "dst_tokyo",
    name: "TeamLab Planets Art",
    city: "Tokyo",
    country: "Japan",
    category: "activities",
    address: "6 Chome-1-16 Toyosu, Tokyo",
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
    id: "pl_tokyo_city_view",
    destinationId: "dst_tokyo",
    name: "Tokyo City View Deck",
    city: "Tokyo",
    country: "Japan",
    category: "photo spots",
    address: "6 Chome-10-1 Roppongi, Tokyo",
    description: "A skyline payoff spot for the classic tower-and-neon reel ending.",
    coordinates: { lat: 35.6605, lng: 139.7293 },
    timesSeen: 7,
    sourceCount: 3,
    isVisited: false,
    isInTrip: true,
    tags: ["#skyline", "#night", "#viewpoint"],
    imageUrl:
      "https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: "pl_tokyo_sg_club",
    destinationId: "dst_tokyo",
    name: "The SG Club",
    city: "Tokyo",
    country: "Japan",
    category: "bars",
    address: "1 Chome-7-8 Jinnan, Tokyo",
    description: "Cocktail bar save for a polished Shibuya night that still feels like a discovery.",
    coordinates: { lat: 35.6647, lng: 139.6989 },
    timesSeen: 4,
    sourceCount: 2,
    isVisited: false,
    isInTrip: false,
    tags: ["#cocktails", "#late-night", "#shibuya"],
    imageUrl:
      "https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: "pl_paris_croissant",
    destinationId: "dst_paris",
    name: "Le Marais Croissant",
    city: "Paris",
    country: "France",
    category: "cafes",
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
    id: "pl_paris_septime_cave",
    destinationId: "dst_paris",
    name: "Septime La Cave",
    city: "Paris",
    country: "France",
    category: "bars",
    address: "3 Rue Basfroi, Paris",
    description: "Natural wine stop that rounds out an East Paris dinner crawl without feeling tourist-scripted.",
    coordinates: { lat: 48.8530, lng: 2.3787 },
    timesSeen: 5,
    sourceCount: 2,
    isVisited: false,
    isInTrip: false,
    tags: ["#wine", "#bistro", "#date-night"],
    imageUrl:
      "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: "pl_paris_palais_royal",
    destinationId: "dst_paris",
    name: "Jardin du Palais Royal",
    city: "Paris",
    country: "France",
    category: "scenic spots",
    address: "8 Rue de Montpensier, Paris",
    description: "Quiet courtyard save for a slower midday loop between cafes, shops, and gallery stops.",
    coordinates: { lat: 48.8638, lng: 2.3372 },
    timesSeen: 4,
    sourceCount: 2,
    isVisited: true,
    isInTrip: false,
    tags: ["#garden", "#quiet-luxury", "#stroll"],
    imageUrl:
      "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: "pl_paris_hotel_national",
    destinationId: "dst_paris",
    name: "Hotel National des Arts et Metiers",
    city: "Paris",
    country: "France",
    category: "hotels",
    address: "243 Rue Saint-Martin, Paris",
    description: "Boutique stay pick with the kind of rooftop and room styling that dominates Paris travel moodboards.",
    coordinates: { lat: 48.8663, lng: 2.3553 },
    timesSeen: 3,
    sourceCount: 2,
    isVisited: false,
    isInTrip: false,
    tags: ["#boutique-stay", "#rooftop", "#marais"],
    imageUrl:
      "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: "pl_bali_temple_view",
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
    id: "pl_bali_the_lawn",
    destinationId: "dst_bali",
    name: "The Lawn Canggu",
    city: "Bali",
    country: "Indonesia",
    category: "bars",
    address: "Jl. Pura Dalem, Canggu, Bali",
    description: "Beach-club reel favorite for a sunset drink that still feels easy to actually use.",
    coordinates: { lat: -8.6625, lng: 115.1304 },
    timesSeen: 7,
    sourceCount: 4,
    isVisited: false,
    isInTrip: false,
    tags: ["#beach-club", "#sunset", "#canggu"],
    imageUrl:
      "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: "pl_bali_zali",
    destinationId: "dst_bali",
    name: "Zali Uluwatu",
    city: "Bali",
    country: "Indonesia",
    category: "restaurants",
    address: "Jl. Pantai Suluban, Uluwatu, Bali",
    description: "Mediterranean dinner save with strong interiors and a reliable post-beach route fit.",
    coordinates: { lat: -8.8168, lng: 115.0996 },
    timesSeen: 5,
    sourceCount: 3,
    isVisited: false,
    isInTrip: false,
    tags: ["#dinner", "#interiors", "#uluwatu"],
    imageUrl:
      "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: "pl_bali_potato_head",
    destinationId: "dst_bali",
    name: "Potato Head Suites",
    city: "Bali",
    country: "Indonesia",
    category: "hotels",
    address: "Jl. Petitenget, Seminyak, Bali",
    description: "Design-led stay with the kind of pool and beach framing that sells a full Bali reset.",
    coordinates: { lat: -8.6793, lng: 115.1529 },
    timesSeen: 6,
    sourceCount: 3,
    isVisited: false,
    isInTrip: true,
    tags: ["#stay", "#design-hotel", "#seminyak"],
    imageUrl:
      "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: "pl_london_portobello",
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
    id: "pl_london_jolene",
    destinationId: "dst_london",
    name: "Jolene Newington Green",
    city: "London",
    country: "UK",
    category: "restaurants",
    address: "21 Newington Grn, London",
    description: "Bakery-to-dinner crossover spot that keeps showing up in East London food saves.",
    coordinates: { lat: 51.5516, lng: -0.0854 },
    timesSeen: 5,
    sourceCount: 3,
    isVisited: false,
    isInTrip: false,
    tags: ["#bakery", "#dinner", "#east-london"],
    imageUrl:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: "pl_london_bar_crispin",
    destinationId: "dst_london",
    name: "Bar Crispin",
    city: "London",
    country: "UK",
    category: "bars",
    address: "19 Kingly St, London",
    description: "Small-room Soho wine bar for when a shopping loop wants a sharp stop at the end.",
    coordinates: { lat: 51.5130, lng: -0.1393 },
    timesSeen: 3,
    sourceCount: 2,
    isVisited: false,
    isInTrip: false,
    tags: ["#wine-bar", "#soho", "#small-plates"],
    imageUrl:
      "https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: "pl_london_primrose",
    destinationId: "dst_london",
    name: "Primrose Hill Sunrise",
    city: "London",
    country: "UK",
    category: "photo spots",
    address: "Primrose Hill Rd, London",
    description: "Classic skyline view that still works because it slots cleanly into a Regent's Park morning.",
    coordinates: { lat: 51.5390, lng: -0.1533 },
    timesSeen: 4,
    sourceCount: 2,
    isVisited: true,
    isInTrip: false,
    tags: ["#skyline", "#morning", "#viewpoint"],
    imageUrl:
      "https://images.unsplash.com/photo-1529655683826-aba9b3e77383?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: "pl_cdmx_pendulo",
    destinationId: "dst_mexico_city",
    name: "Cafebreria El Pendulo",
    city: "Mexico City",
    country: "Mexico",
    category: "cafes",
    address: "Av. Nuevo Leon 115, Condesa, CDMX",
    description: "Bookstore cafe save that makes a remote-work morning feel more cinematic than performative.",
    coordinates: { lat: 19.4104, lng: -99.1710 },
    timesSeen: 5,
    sourceCount: 3,
    isVisited: false,
    isInTrip: false,
    tags: ["#bookstore", "#condesa", "#slow-morning"],
    imageUrl:
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: "pl_cdmx_contramar",
    destinationId: "dst_mexico_city",
    name: "Contramar Lunch",
    city: "Mexico City",
    country: "Mexico",
    category: "restaurants",
    address: "Durango 200, Roma Norte, CDMX",
    description: "High-signal lunch reservation that belongs in any CDMX food-heavy save stack.",
    coordinates: { lat: 19.4193, lng: -99.1673 },
    timesSeen: 8,
    sourceCount: 4,
    isVisited: false,
    isInTrip: true,
    tags: ["#seafood", "#roma-norte", "#reservation"],
    imageUrl:
      "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: "pl_cdmx_casa_pedregal",
    destinationId: "dst_mexico_city",
    name: "Casa Pedregal",
    city: "Mexico City",
    country: "Mexico",
    category: "activities",
    address: "Av. San Jeronimo 369, CDMX",
    description: "Architecture stop for a design-driven afternoon outside the usual Roma-Condesa loop.",
    coordinates: { lat: 19.3213, lng: -99.2130 },
    timesSeen: 3,
    sourceCount: 2,
    isVisited: false,
    isInTrip: false,
    tags: ["#architecture", "#design", "#hidden-gem"],
    imageUrl:
      "https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: "pl_cdmx_terraza",
    destinationId: "dst_mexico_city",
    name: "Terraza Cha Cha Cha",
    city: "Mexico City",
    country: "Mexico",
    category: "bars",
    address: "Av. de la Republica 157, Tabacalera, CDMX",
    description: "Rooftop save with the Monumento backdrop that instantly sells the city at golden hour.",
    coordinates: { lat: 19.4361, lng: -99.1543 },
    timesSeen: 6,
    sourceCount: 3,
    isVisited: false,
    isInTrip: false,
    tags: ["#rooftop", "#sunset", "#city-view"],
    imageUrl:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: "pl_lisbon_dear_breakfast",
    destinationId: "dst_lisbon",
    name: "Dear Breakfast Alfama",
    city: "Lisbon",
    country: "Portugal",
    category: "cafes",
    address: "R. do Vigario 17, Lisbon",
    description: "A bright breakfast save that works as a soft start before a heavy walking day.",
    coordinates: { lat: 38.7121, lng: -9.1290 },
    timesSeen: 4,
    sourceCount: 2,
    isVisited: false,
    isInTrip: false,
    tags: ["#breakfast", "#alfama", "#bright-interiors"],
    imageUrl:
      "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: "pl_lisbon_prado",
    destinationId: "dst_lisbon",
    name: "Prado",
    city: "Lisbon",
    country: "Portugal",
    category: "restaurants",
    address: "Tv. Pedras Negras 2, Lisbon",
    description: "Produce-forward dinner spot that makes old-town Lisbon feel current, not just nostalgic.",
    coordinates: { lat: 38.7097, lng: -9.1366 },
    timesSeen: 5,
    sourceCount: 3,
    isVisited: false,
    isInTrip: true,
    tags: ["#seasonal", "#dinner", "#baixa"],
    imageUrl:
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: "pl_lisbon_miradouro",
    destinationId: "dst_lisbon",
    name: "Miradouro da Senhora do Monte",
    city: "Lisbon",
    country: "Portugal",
    category: "photo spots",
    address: "Largo Monte, Lisbon",
    description: "Viewpoint save with enough elevation and space to earn the uphill detour.",
    coordinates: { lat: 38.7193, lng: -9.1325 },
    timesSeen: 7,
    sourceCount: 3,
    isVisited: false,
    isInTrip: false,
    tags: ["#viewpoint", "#sunset", "#city-panorama"],
    imageUrl:
      "https://images.unsplash.com/photo-1513735492246-483525079686?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: "pl_lisbon_santa_clara",
    destinationId: "dst_lisbon",
    name: "Santa Clara 1728",
    city: "Lisbon",
    country: "Portugal",
    category: "hotels",
    address: "Campo de Santa Clara 172, Lisbon",
    description: "Minimal stay pick that feels aligned with Lisbon's slower, design-forward side.",
    coordinates: { lat: 38.7147, lng: -9.1234 },
    timesSeen: 3,
    sourceCount: 2,
    isVisited: false,
    isInTrip: false,
    tags: ["#boutique-stay", "#minimal", "#alfama"],
    imageUrl:
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: "pl_seoul_anthracite",
    destinationId: "dst_seoul",
    name: "Anthracite Hapjeong",
    city: "Seoul",
    country: "South Korea",
    category: "cafes",
    address: "357-6 Seogyo-dong, Mapo-gu, Seoul",
    description: "Industrial cafe save for a Seoul morning that leans more design-world than tourist checklist.",
    coordinates: { lat: 37.5508, lng: 126.9145 },
    timesSeen: 6,
    sourceCount: 3,
    isVisited: false,
    isInTrip: false,
    tags: ["#industrial", "#coffee", "#hapjeong"],
    imageUrl:
      "https://images.unsplash.com/photo-1445116572660-236099ec97a0?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: "pl_seoul_gwangjang",
    destinationId: "dst_seoul",
    name: "Gwangjang Market Bindaetteok",
    city: "Seoul",
    country: "South Korea",
    category: "restaurants",
    address: "88 Changgyeonggung-ro, Jongno-gu, Seoul",
    description: "High-energy market food stop that feels essential once Seoul food reels start piling up.",
    coordinates: { lat: 37.5704, lng: 126.9998 },
    timesSeen: 9,
    sourceCount: 4,
    isVisited: false,
    isInTrip: true,
    tags: ["#market", "#street-food", "#jongno"],
    imageUrl:
      "https://images.unsplash.com/photo-1553163147-622ab57be1c7?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: "pl_seoul_forest",
    destinationId: "dst_seoul",
    name: "Seoul Forest Evening Loop",
    city: "Seoul",
    country: "South Korea",
    category: "activities",
    address: "273 Ttukseom-ro, Seongdong-gu, Seoul",
    description: "Walkable reset that pairs well with nearby cafe stops and softer evening city footage.",
    coordinates: { lat: 37.5444, lng: 127.0374 },
    timesSeen: 4,
    sourceCount: 2,
    isVisited: false,
    isInTrip: false,
    tags: ["#park", "#walk", "#golden-hour"],
    imageUrl:
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: "pl_seoul_bar81",
    destinationId: "dst_seoul",
    name: "Bar 81 at Signiel",
    city: "Seoul",
    country: "South Korea",
    category: "bars",
    address: "300 Olympic-ro, Songpa-gu, Seoul",
    description: "Skyline cocktail save for a cleaner, more polished version of the Seoul night-out reel.",
    coordinates: { lat: 37.5130, lng: 127.1028 },
    timesSeen: 3,
    sourceCount: 2,
    isVisited: false,
    isInTrip: false,
    tags: ["#skyline", "#cocktails", "#lotte-world-tower"],
    imageUrl:
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80"
  }
];

export const destinations: Destination[] = destinationSeeds.map((destination) => {
  const destinationPlaces = places.filter((place) => place.destinationId === destination.id);

  return {
    ...destination,
    placeCount: destinationPlaces.length,
    spotlightTags: Array.from(new Set(destinationPlaces.flatMap((place) => place.tags))).slice(0, 3)
  };
});

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
            placeId: "pl_tokyo_hidden_cafe",
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
            placeId: "pl_tokyo_sushi_dai",
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
            placeId: "pl_tokyo_teamlab",
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
            placeId: "pl_tokyo_sg_club",
            time: "04:30 PM",
            note: "Drinks"
          }
        ]
      },
      {
        id: "day_5",
        title: "Tokyo Tower Sunset",
        stops: [
          {
            id: "stop_5",
            placeId: "pl_tokyo_city_view",
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
    status: "coming-soon",
    summary: "Taste-profile enrichment scaffold only in v1. Use manual import for now."
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
