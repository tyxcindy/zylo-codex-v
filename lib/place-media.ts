import type { Place, PlaceCategory } from "@/lib/domain";

export const placeFallbackImages: Record<PlaceCategory, string> = {
  cafes:
    "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=900&q=80",
  restaurants:
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80",
  bars:
    "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=900&q=80",
  hotels:
    "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=900&q=80",
  activities:
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
  "photo spots":
    "https://images.unsplash.com/photo-1504609773096-104ff2c73ba4?auto=format&fit=crop&w=900&q=80",
  "scenic spots":
    "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=900&q=80"
};

export function resolvePlaceImageUrl(input: Pick<Place, "category" | "imageUrl">) {
  return input.imageUrl ?? placeFallbackImages[input.category] ?? placeFallbackImages.activities;
}
