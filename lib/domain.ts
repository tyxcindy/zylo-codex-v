export type PlaceCategory =
  | "restaurants"
  | "cafes"
  | "bars"
  | "hotels"
  | "activities"
  | "scenic spots"
  | "photo spots";

export interface User {
  id: string;
  email: string;
  displayName: string;
  homeCity: string;
  joinedAt: string;
}

export interface UserProfileSummary {
  displayName: string;
  email: string;
  homeCity: string;
  plannerNotes: string;
}

export interface TasteProfile {
  userId: string;
  priorities: string[];
  favoriteCuisines: string[];
  avoids: string[];
}

export interface Destination {
  id: string;
  name: string;
  country: string;
  vibe: string;
  placeCount: number;
  coverTone: string;
  imageUrl?: string;
  spotlightTags?: string[];
}

export interface Place {
  id: string;
  destinationId: string;
  name: string;
  city: string;
  country: string;
  category: PlaceCategory;
  address: string;
  description: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  timesSeen: number;
  sourceCount: number;
  isVisited: boolean;
  isInTrip: boolean;
  tags: string[];
  imageUrl?: string;
}

export interface SourceArtifact {
  id: string;
  type: "url" | "text" | "image" | "manual";
  label: string;
  status: "queued" | "processing" | "complete" | "failed";
  createdAt: string;
  extractedPlaces: number;
  errorMessage?: string;
}

export interface TripStop {
  id: string;
  placeId: string;
  time: string;
  note: string;
}

export interface TripDay {
  id: string;
  title: string;
  stops: TripStop[];
}

export interface Trip {
  id: string;
  title: string;
  destinationId: string;
  status: "draft" | "ready" | "upcoming" | "past";
  vibe: string;
  travelers: number;
  days: TripDay[];
  plannerNotes?: string;
  imageUrl?: string;
  dateRange?: string;
}

export interface PlatformConnection {
  id: string;
  platform: "Instagram" | "TikTok" | "Beli";
  status: "coming-soon" | "planned" | "connected";
  summary: string;
  username?: string;
}

export interface AuditEvent {
  id: string;
  type: "auth" | "import" | "security" | "ai";
  message: string;
  timestamp: string;
  severity: "info" | "warn" | "critical";
}
