import { SectionIntro } from "@/components/app/section-intro";
import { TripsBoard } from "@/components/app/trips-board";
import { requirePageUser } from "@/lib/auth";
import { getUserLibrarySnapshot } from "@/lib/app-data";

export default async function TripsPage() {
  const { supabase, user } = await requirePageUser();
  const snapshot = await getUserLibrarySnapshot(supabase, user.id);

  return (
    <section>
      <SectionIntro
        eyebrow="Trips"
        title="Build the itinerary from the places you already wanted."
        description="Trips stay editable, AI-assisted, and grounded in your actual save history instead of another blank planning template."
      />
      <TripsBoard initialPlannerNotes={snapshot.profile.plannerNotes} />
    </section>
  );
}
