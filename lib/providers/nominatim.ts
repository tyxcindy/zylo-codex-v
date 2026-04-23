type NominatimSearchResult = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  class?: string;
  type?: string;
  name?: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    county?: string;
    state?: string;
    country?: string;
    suburb?: string;
    city_district?: string;
    neighbourhood?: string;
    road?: string;
  };
};

export type FreePlaceSummary = {
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

export type FreeReverseSummary = {
  name: string;
  city: string;
  country: string;
  district: string;
  region: string;
  formattedAddress: string;
  location: {
    latitude: number;
    longitude: number;
  };
  mapsUrl: string;
  className?: string;
  typeName?: string;
};

let lastNominatimRequestAt = 0;

async function respectPublicNominatimLimit() {
  const elapsed = Date.now() - lastNominatimRequestAt;
  const waitMs = Math.max(0, 1_100 - elapsed);

  if (waitMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }

  lastNominatimRequestAt = Date.now();
}

function resolveCity(address: NominatimSearchResult["address"]) {
  return (
    address?.city ??
    address?.town ??
    address?.village ??
    address?.municipality ??
    address?.county ??
    address?.state ??
    ""
  );
}

function toFreePlaceSummary(result: NominatimSearchResult): FreePlaceSummary | null {
  const city = resolveCity(result.address);
  const country = result.address?.country ?? "";
  const latitude = Number(result.lat);
  const longitude = Number(result.lon);

  if (!city || !country || Number.isNaN(latitude) || Number.isNaN(longitude)) {
    return null;
  }

  return {
    name: result.name?.trim() || result.display_name.split(",")[0]?.trim() || "",
    city,
    country,
    formattedAddress: result.display_name,
    location: {
      latitude,
      longitude
    },
    mapsUrl: `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=17/${latitude}/${longitude}`,
    className: result.class,
    typeName: result.type
  };
}

function resolveDistrict(address: NominatimSearchResult["address"]) {
  return (
    address?.neighbourhood ??
    address?.suburb ??
    address?.city_district ??
    address?.road ??
    ""
  );
}

function toFreeReverseSummary(result: NominatimSearchResult): FreeReverseSummary | null {
  const city = resolveCity(result.address);
  const country = result.address?.country ?? "";
  const district = resolveDistrict(result.address);
  const region = result.address?.state ?? result.address?.county ?? "";
  const latitude = Number(result.lat);
  const longitude = Number(result.lon);

  if (!city || !country || Number.isNaN(latitude) || Number.isNaN(longitude)) {
    return null;
  }

  return {
    name: result.name?.trim() || result.display_name.split(",")[0]?.trim() || city,
    city,
    country,
    district,
    region,
    formattedAddress: result.display_name,
    location: {
      latitude,
      longitude
    },
    mapsUrl: `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=17/${latitude}/${longitude}`,
    className: result.class,
    typeName: result.type
  };
}

export async function lookupPlaceSummaryFree(query: string) {
  await respectPublicNominatimLimit();

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&addressdetails=1&q=${encodeURIComponent(query)}`,
      {
        headers: {
          "User-Agent": "Zylo/0.1 (travel import parser)",
          "Accept-Language": "en-US,en;q=0.9"
        },
        cache: "no-store"
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as NominatimSearchResult[];
    return data[0] ? toFreePlaceSummary(data[0]) : null;
  } catch {
    return null;
  }
}

export async function reverseLookupPlaceSummaryFree(latitude: number, longitude: number) {
  await respectPublicNominatimLimit();

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=16&addressdetails=1&lat=${latitude}&lon=${longitude}`,
      {
        headers: {
          "User-Agent": "Zylo/0.1 (travel map focus lookup)",
          "Accept-Language": "en-US,en;q=0.9"
        },
        cache: "no-store"
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as NominatimSearchResult;
    return toFreeReverseSummary(data);
  } catch {
    return null;
  }
}
