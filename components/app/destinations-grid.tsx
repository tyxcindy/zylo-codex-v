import Link from "next/link";
import { MapPinned } from "lucide-react";

import type { Destination } from "@/lib/domain";

export function DestinationsGrid({ destinations }: { destinations: Destination[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {destinations.map((destination, index) => {
        const isLocal = index === 0;

        return (
          <Link
            key={destination.id}
            href={`/destinations/${destination.id}`}
            className="group app-card relative block overflow-hidden p-0"
          >
            <div
              className="h-[220px] bg-cover bg-center transition duration-300 group-hover:scale-[1.02]"
              style={{
                backgroundImage: destination.imageUrl ? `url(${destination.imageUrl})` : undefined
              }}
            />
            <div className="app-image-overlay absolute inset-0" />
            <div className="absolute inset-x-0 bottom-0 p-5 text-white">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    {isLocal ? <MapPinned className="h-4 w-4" /> : null}
                    <p className="text-2xl font-black">{destination.name}</p>
                  </div>
                  <p className="mt-1 text-sm text-white/72">{destination.country}</p>
                </div>
                <div className="rounded-full border border-white/16 bg-[rgba(12,18,32,0.34)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/84 backdrop-blur-xl">
                  {destination.placeCount} places
                </div>
              </div>
              <p className="mt-4 max-w-sm text-sm leading-6 text-white/72">{destination.vibe}</p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
