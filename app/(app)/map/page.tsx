import { MapPanel } from "@/components/app/map-panel";
import { SectionIntro } from "@/components/app/section-intro";
import { getUserLibrarySnapshot } from "@/lib/app-data";
import { requirePageUser } from "@/lib/auth";

export default async function MapPage() {
  const { supabase, user } = await requirePageUser();
  const snapshot = await getUserLibrarySnapshot(supabase, user.id);

  return (
    <section>
      <SectionIntro
        eyebrow="Exploration map"
        title="See where your travel reels actually land."
        description="Zylo groups saved travel content by city, pins the real spots, and lets you build the itinerary while the map is still open."
      />
      <MapPanel
        destinations={snapshot.destinations}
        places={snapshot.places}
        homeCity={snapshot.profile.homeCity}
      />
    </section>
  );
}
