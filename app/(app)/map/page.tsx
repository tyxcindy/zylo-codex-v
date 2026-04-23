import { MapPanel } from "@/components/app/map-panel";
import { getUserLibrarySnapshot } from "@/lib/app-data";
import { requirePageUser } from "@/lib/auth";

export default async function MapPage() {
  const { supabase, user } = await requirePageUser();
  const snapshot = await getUserLibrarySnapshot(supabase, user.id);

  return <MapPanel destinations={snapshot.destinations} places={snapshot.places} homeCity={snapshot.profile.homeCity} />;
}
