import { notFound } from "next/navigation";

import { SectionIntro } from "@/components/app/section-intro";
import { TripsBoard } from "@/components/app/trips-board";
import { requirePageUser } from "@/lib/auth";
import { getUserLibrarySnapshot } from "@/lib/app-data";

export default async function TripPlannerPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, user } = await requirePageUser();
  const snapshot = await getUserLibrarySnapshot(supabase, user.id);

  if (!id) {
    notFound();
  }

  return (
    <section>
      <SectionIntro
        eyebrow="Trip Planner"
        title="Edit One Itinerary Deeply."
        description="This view stays focused on a single itinerary so the route, day structure, and saved-place choices are not competing with the rest of your trip gallery."
      />
      <TripsBoard
        initialPlannerNotes={snapshot.profile.plannerNotes}
        destinations={snapshot.destinations}
        places={snapshot.places}
        plannerOnly
        initialTripId={id}
      />
    </section>
  );
}
