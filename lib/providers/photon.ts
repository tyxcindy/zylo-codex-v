type PhotonFeature = {
  properties?: {
    name?: string;
    street?: string;
    locality?: string;
    district?: string;
    city?: string;
    state?: string;
    country?: string;
    osm_key?: string;
    osm_value?: string;
    type?: string;
  };
  geometry?: {
    coordinates?: [number, number];
  };
};

export type PhotonPlaceSummary = {
  name: string;
  city: string;
  country: string;
  formattedAddress: string;
  location: {
    latitude: number;
    longitude: number;
  };
  mapsUrl: string;
  className?: string;
  typeName?: string;
};

let lastPhotonRequestAt = 0;

async function respectPhotonLimit() {
  const elapsed = Date.now() - lastPhotonRequestAt;
  const waitMs = Math.max(0, 350 - elapsed);

  if (waitMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }

  lastPhotonRequestAt = Date.now();
}

function toPhotonPlaceSummary(feature: PhotonFeature) {
  const coordinates = feature.geometry?.coordinates;
  const latitude = coordinates?.[1];
  const longitude = coordinates?.[0];
  const city = feature.properties?.city ?? feature.properties?.district ?? "";
  const country = feature.properties?.country ?? "";
  const name = feature.properties?.name?.trim() ?? "";

  if (
    !name ||
    !city ||
    !country ||
    typeof latitude !== "number" ||
    typeof longitude !== "number" ||
    Number.isNaN(latitude) ||
    Number.isNaN(longitude)
  ) {
    return null;
  }

  const formattedAddress = [
    name,
    feature.properties?.street,
    feature.properties?.locality,
    feature.properties?.district,
    feature.properties?.city,
    feature.properties?.state,
    feature.properties?.country
  ]
    .filter(Boolean)
    .join(", ");

  return {
    name,
    city,
    country,
    formattedAddress,
    location: {
      latitude,
      longitude
    },
    mapsUrl: `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=17/${latitude}/${longitude}`,
    className: feature.properties?.osm_key,
    typeName: feature.properties?.osm_value ?? feature.properties?.type
  } satisfies PhotonPlaceSummary;
}

export async function lookupPlaceSummaryPhoton(query: string) {
  await respectPhotonLimit();

  try {
    const response = await fetch(
      `https://photon.komoot.io/api/?limit=3&lang=en&q=${encodeURIComponent(query)}`,
      {
        headers: {
          "User-Agent": "Zylo/0.1 (travel import parser)"
        },
        cache: "no-store"
      }
    );

    if (!response.ok) {
      return [];
    }

    const data = (await response.json()) as { features?: PhotonFeature[] };
    return (data.features ?? []).reduce<PhotonPlaceSummary[]>((summaries, feature) => {
      const summary = toPhotonPlaceSummary(feature);

      if (summary) {
        summaries.push(summary);
      }

      return summaries;
    }, []);
  } catch {
    return [];
  }
}
