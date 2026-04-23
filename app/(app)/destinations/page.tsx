import { DestinationsGallery } from "@/components/app/destinations-gallery";
import { requirePageUser } from "@/lib/auth";
import { getUserLibrarySnapshot } from "@/lib/app-data";

export default async function DestinationsPage() {
  const { supabase, user } = await requirePageUser();
  const { destinations } = await getUserLibrarySnapshot(supabase, user.id);

  return (
    <section>
      <DestinationsGallery destinations={destinations} />
    </section>
  );
}
