import { notFound } from "next/navigation";

import { DestinationDetail } from "@/components/app/destination-detail";
import { getUserLibrarySnapshot } from "@/lib/app-data";
import { requirePageUser } from "@/lib/auth";

export default async function DestinationDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, user } = await requirePageUser();
  const { destinations, places } = await getUserLibrarySnapshot(supabase, user.id);
  const destination = destinations.find((item) => item.id === id);

  if (!destination) {
    notFound();
  }

  return (
    <DestinationDetail
      destination={destination}
      places={places.filter((place) => place.destinationId === destination.id)}
    />
  );
}
