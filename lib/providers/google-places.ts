import { getServerEnv } from "@/lib/env";

type GooglePlaceSummary = {
  formattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
  displayName?: { text?: string };
  googleMapsUri?: string;
};

export async function lookupPlaceSummary(query: string) {
  const { googleMapsApiKey } = getServerEnv();

  if (!googleMapsApiKey) {
    return null;
  }

  try {
    const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": googleMapsApiKey,
        "X-Goog-FieldMask":
          "places.displayName,places.formattedAddress,places.location,places.googleMapsUri"
      },
      body: JSON.stringify({
        textQuery: query,
        pageSize: 1
      }),
      cache: "no-store"
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as { places?: GooglePlaceSummary[] };
    return data.places?.[0] ?? null;
  } catch {
    return null;
  }
}
