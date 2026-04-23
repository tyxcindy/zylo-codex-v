import InteractiveBentoGallery, {
  type MediaItemType
} from "@/components/blocks/interactive-bento-gallery";
import type { Destination } from "@/lib/domain";

export function DestinationsGallery({ destinations }: { destinations: Destination[] }) {
  const mediaItems: MediaItemType[] = destinations.map((destination) => ({
    id: destination.id,
    type: "image",
    title: destination.name,
    country: destination.country,
    placeCount: destination.placeCount,
    desc: destination.vibe,
    url:
      destination.imageUrl ??
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80",
    span: "",
    href: `/destinations/${destination.id}`
  }));

  return (
    <InteractiveBentoGallery
      mediaItems={mediaItems}
      title="Your travel saves, grouped by city first."
      description="Zylo starts with destinations, then organizes the actual spots inside each one so trip planning feels like moving forward instead of sorting a pile."
      interactionMode="link"
    />
  );
}
