import { PlacesGrid } from "@/components/app/places-grid";
import { SectionIntro } from "@/components/app/section-intro";

export default function PlacesPage() {
  return (
    <section>
      <SectionIntro
        eyebrow="Places"
        title="One library for everything worth going back to."
        description="Places are deduplicated, tagged, destination-aware, and ready for map views, itinerary flows, and future personalization layers."
      />
      <PlacesGrid />
    </section>
  );
}
