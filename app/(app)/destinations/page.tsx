import { DestinationsGrid } from "@/components/app/destinations-grid";
import { SectionIntro } from "@/components/app/section-intro";
import { requirePageUser } from "@/lib/auth";
import { getUserLibrarySnapshot } from "@/lib/app-data";

export default async function DestinationsPage() {
  const { supabase, user } = await requirePageUser();
  const { destinations } = await getUserLibrarySnapshot(supabase, user.id);

  return (
    <section>
      <SectionIntro
        eyebrow="Destinations"
        title="Your travel saves, grouped by city first."
        description="Zylo starts with destinations, then organizes the actual spots inside each one so trip planning feels like moving forward instead of sorting a pile."
      />
      <DestinationsGrid destinations={destinations} />
    </section>
  );
}
