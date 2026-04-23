type PlaceIdentity = {
  name: string;
  city?: string | null;
  country?: string | null;
  allowGenericLocation?: boolean | null;
};

const platformPrefixPattern = /^(instagram|tiktok|reel|post|video(?:\s+by)?)\b[\s:.-]*/i;
const headlineActionPattern =
  /^(explore|discover|visit|spend|start|stop|see|plan|guide|itinerary)\b[\s:.-]*/i;
const trailingActionPattern =
  /(?:[.!?]\s+|\s[-–—]\s+)(take|ride|visit|explore|try|step|hop|cruise|tag|book|go|head|then|watch|see)\b.*$/i;
const headlinePhrasePattern =
  /\b(?:hours?\s+in|day itinerary|one day itinerary|travel guide|things to do|where to eat|where to stay)\b/i;

export function sanitizePlaceName(name: string) {
  return name
    .trim()
    .replace(platformPrefixPattern, "")
    .replace(trailingActionPattern, "")
    .replace(/\s+[|/]\s+.*$/g, "")
    .replace(/[.,!?:;\-–—]+$/g, "")
    .trim();
}

export function normalizeComparablePlaceName(value: string | null | undefined) {
  return sanitizePlaceName(value ?? "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function looksLikeHeadlineOrNoise(name: string) {
  const normalized = sanitizePlaceName(name);
  const comparable = normalizeComparablePlaceName(normalized);
  const tokens = comparable.split(" ").filter(Boolean);

  if (tokens.length === 0) {
    return true;
  }

  if (headlinePhrasePattern.test(normalized)) {
    return true;
  }

  if (headlineActionPattern.test(normalized) && tokens.length <= 3) {
    return true;
  }

  if (tokens.length > 7) {
    return true;
  }

  if (tokens.length === 2 && /^(explore|discover|visit|spend|guide|itinerary)$/.test(tokens[0] ?? "") && /^\d+$/.test(tokens[1] ?? "")) {
    return true;
  }

  return false;
}

export function isGenericGeographicPlace(input: PlaceIdentity) {
  const normalizedName = normalizeComparablePlaceName(input.name);
  const normalizedCity = normalizeComparablePlaceName(input.city);
  const normalizedCountry = normalizeComparablePlaceName(input.country);

  if (!normalizedName) {
    return true;
  }

  if (normalizedName === normalizedCity || normalizedName === normalizedCountry) {
    return true;
  }

  return false;
}

export function normalizeSavedPlace<T extends PlaceIdentity>(place: T) {
  const sanitizedName = sanitizePlaceName(place.name);

  if (!sanitizedName) {
    return null;
  }

  if (looksLikeHeadlineOrNoise(sanitizedName)) {
    return null;
  }

  const normalizedPlace = {
    ...place,
    name: sanitizedName
  };

  if (isGenericGeographicPlace(normalizedPlace) && !normalizedPlace.allowGenericLocation) {
    return null;
  }

  return normalizedPlace;
}
