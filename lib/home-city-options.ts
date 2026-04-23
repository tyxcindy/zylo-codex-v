export type HomeCityOption = {
  value: string;
  label: string;
  country: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  aliases?: string[];
};

export const homeCityOptions: HomeCityOption[] = [
  { value: "New York", label: "New York, USA", country: "USA", coordinates: { lat: 40.7128, lng: -74.006 }, aliases: ["new york city", "nyc", "manhattan"] },
  { value: "Los Angeles", label: "Los Angeles, USA", country: "USA", coordinates: { lat: 34.0522, lng: -118.2437 }, aliases: ["la", "los angeles city"] },
  { value: "San Francisco", label: "San Francisco, USA", country: "USA", coordinates: { lat: 37.7749, lng: -122.4194 }, aliases: ["sf", "san fran"] },
  { value: "Chicago", label: "Chicago, USA", country: "USA", coordinates: { lat: 41.8781, lng: -87.6298 } },
  { value: "London", label: "London, UK", country: "UK", coordinates: { lat: 51.5072, lng: -0.1276 } },
  { value: "Paris", label: "Paris, France", country: "France", coordinates: { lat: 48.8566, lng: 2.3522 } },
  { value: "Tokyo", label: "Tokyo, Japan", country: "Japan", coordinates: { lat: 35.6762, lng: 139.6503 } },
  { value: "Seoul", label: "Seoul, South Korea", country: "South Korea", coordinates: { lat: 37.5665, lng: 126.978 } },
  { value: "Bali", label: "Bali, Indonesia", country: "Indonesia", coordinates: { lat: -8.4095, lng: 115.1889 } },
  { value: "Mexico City", label: "Mexico City, Mexico", country: "Mexico", coordinates: { lat: 19.4326, lng: -99.1332 }, aliases: ["cdmx", "ciudad de mexico"] },
  { value: "Lisbon", label: "Lisbon, Portugal", country: "Portugal", coordinates: { lat: 38.7223, lng: -9.1393 } },
  { value: "Barcelona", label: "Barcelona, Spain", country: "Spain", coordinates: { lat: 41.3874, lng: 2.1686 } },
  { value: "Madrid", label: "Madrid, Spain", country: "Spain", coordinates: { lat: 40.4168, lng: -3.7038 } },
  { value: "Rome", label: "Rome, Italy", country: "Italy", coordinates: { lat: 41.9028, lng: 12.4964 } },
  { value: "Milan", label: "Milan, Italy", country: "Italy", coordinates: { lat: 45.4642, lng: 9.19 } },
  { value: "Berlin", label: "Berlin, Germany", country: "Germany", coordinates: { lat: 52.52, lng: 13.405 } },
  { value: "Amsterdam", label: "Amsterdam, Netherlands", country: "Netherlands", coordinates: { lat: 52.3676, lng: 4.9041 } },
  { value: "Sydney", label: "Sydney, Australia", country: "Australia", coordinates: { lat: -33.8688, lng: 151.2093 } },
  { value: "Melbourne", label: "Melbourne, Australia", country: "Australia", coordinates: { lat: -37.8136, lng: 144.9631 } },
  { value: "Singapore", label: "Singapore", country: "Singapore", coordinates: { lat: 1.3521, lng: 103.8198 } },
  { value: "Hong Kong", label: "Hong Kong", country: "Hong Kong", coordinates: { lat: 22.3193, lng: 114.1694 } },
  { value: "Bangkok", label: "Bangkok, Thailand", country: "Thailand", coordinates: { lat: 13.7563, lng: 100.5018 } }
];

export function normalizeHomeCityInput(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function resolveHomeCityOption(value: string) {
  const normalized = normalizeHomeCityInput(value);

  if (!normalized) {
    return null;
  }

  return (
    homeCityOptions.find((option) => {
      const candidates = [option.value, option.label, ...(option.aliases ?? [])];
      return candidates.some((candidate) => normalizeHomeCityInput(candidate) === normalized);
    }) ?? null
  );
}

export function getHomeCityDisplayLabel(value: string) {
  return resolveHomeCityOption(value)?.label ?? value;
}

export function filterHomeCityOptions(query: string) {
  const normalized = normalizeHomeCityInput(query);

  if (!normalized) {
    return homeCityOptions;
  }

  return homeCityOptions.filter((option) => {
    const candidates = [option.value, option.label, option.country, ...(option.aliases ?? [])];
    return candidates.some((candidate) => normalizeHomeCityInput(candidate).includes(normalized));
  });
}
