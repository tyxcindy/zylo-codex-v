import { destinations, places } from "@/lib/data";

export function PlacesGrid() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {places.map((place) => {
        const destination = destinations.find((item) => item.id === place.destinationId);

        return (
          <div key={place.id} className="app-card px-5 py-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--app-text-soft)]">
                  {destination?.name ?? place.city}
                </p>
                <h2 className="mt-2 text-2xl text-[color:var(--app-text)]">{place.name}</h2>
              </div>
              <div className="app-pill px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]">
                {place.category}
              </div>
            </div>
            <p className="mt-4 text-sm leading-7 text-[color:var(--app-text-soft)]">{place.description}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {place.tags.map((tag) => (
                <span
                  key={tag}
                  className="app-pill px-3 py-1 text-xs font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
            <div className="mt-5 flex items-center justify-between text-sm">
              <span className="text-[color:var(--app-text-soft)]">
                {place.city}, {place.country}
              </span>
              <span className="font-semibold text-[color:var(--app-text)]">{place.timesSeen}x saved</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
