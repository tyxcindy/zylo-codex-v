import { extractRuleBasedPlaceSeeds } from "@/lib/import-analysis";
import { containsChineseCharacters } from "@/lib/import-language";
import {
  isGenericGeographicPlace,
  normalizeComparablePlaceName,
  normalizeSavedPlace
} from "@/lib/place-quality";
import {
  extractPlacesWithGemini,
  GeminiProviderError,
  type ExtractedPlaceCandidate
} from "@/lib/providers/gemini";
import { lookupPlaceSummary } from "@/lib/providers/google-places";
import { lookupPlaceSummaryFree, reverseLookupPlaceSummaryFree } from "@/lib/providers/nominatim";
import { lookupPlaceSummaryPhoton } from "@/lib/providers/photon";
import { searchPlaceContextWeb } from "@/lib/providers/web-search";
import type {
  CandidateSeed,
  PipelineCandidate,
  PipelineStages
} from "@/lib/import-pipeline-types";

function withDefaultCategory(
  input: Partial<ExtractedPlaceCandidate> &
    Pick<ExtractedPlaceCandidate, "name"> & { allowGenericLocation?: boolean }
): ExtractedPlaceCandidate & { allowGenericLocation?: boolean } {
  return {
    name: input.name,
    city: input.city ?? "",
    country: input.country ?? "",
    category: input.category ?? "activities",
    description: input.description ?? "",
    tags: input.tags ?? [],
    allowGenericLocation: input.allowGenericLocation
  };
}

function toCandidateSeedFromGemini(
  candidate: ExtractedPlaceCandidate,
  destinationHint?: string
): CandidateSeed {
  return {
    ...withDefaultCategory(candidate),
    queryHint: [candidate.city, candidate.country, destinationHint].filter(Boolean).join(", "),
    evidence: candidate.description ? [candidate.description] : []
  };
}

function mergeSeeds(ruleSeeds: CandidateSeed[], geminiSeeds: CandidateSeed[]) {
  const merged = new Map<string, CandidateSeed>();

  for (const seed of [...ruleSeeds, ...geminiSeeds]) {
    const key = seed.name.trim().toLowerCase();
    const existing = merged.get(key);

    if (!existing) {
      merged.set(key, seed);
      continue;
    }

    merged.set(key, {
      ...existing,
      ...seed,
      city: seed.city || existing.city,
      country: seed.country || existing.country,
      description: seed.description.length > existing.description.length ? seed.description : existing.description,
      tags: Array.from(new Set([...existing.tags, ...seed.tags])).slice(0, 8),
      evidence: Array.from(new Set([...(existing.evidence ?? []), ...(seed.evidence ?? [])])),
      allowGenericLocation: existing.allowGenericLocation || seed.allowGenericLocation
    });
  }

  return Array.from(merged.values()).slice(0, 8);
}

function sanitizeSeed(seed: CandidateSeed) {
  return normalizeSavedPlace(seed);
}

function shouldRejectGenericLocation(
  queryName: string,
  result: Awaited<ReturnType<typeof lookupPlaceSummaryFree>>,
  allowGenericLocation = false
) {
  if (!result) {
    return true;
  }

  const normalizedQuery = queryName.trim().toLowerCase();
  const normalizedName = result.name.trim().toLowerCase();

  if (!normalizedQuery || !normalizedName) {
    return true;
  }

  if (
    !allowGenericLocation &&
    normalizedQuery === normalizedName &&
    (result.typeName === "city" || result.typeName === "town" || result.typeName === "country")
  ) {
    return true;
  }

  return false;
}

const comparisonStopTokens = new Set([
  "the",
  "and",
  "for",
  "with",
  "from",
  "near",
  "street",
  "road",
  "city"
]);

const comparisonDescriptorTokens = new Set([
  "market",
  "markets",
  "garden",
  "gardens",
  "park",
  "parks",
  "country"
]);
const contextFallbackPattern =
  /\b(?:spiral|tower|bridge|lane|plaza|square|market|temple|park|garden|museum|gallery|tram|peak|ferry|buddha|musea)\b/i;
const ignoredContextDomains = new Set([
  "instagram.com",
  "facebook.com",
  "tiktok.com",
  "youtube.com",
  "pinterest.com",
  "x.com",
  "twitter.com"
]);

function tokenizeComparable(value: string | null | undefined) {
  const tokens = normalizeComparablePlaceName(value)
    .split(" ")
    .filter((token) => token.length >= 2 && !comparisonStopTokens.has(token) && !/^\d+$/.test(token));

  const distinctiveTokens = tokens.filter((token) => !comparisonDescriptorTokens.has(token));
  return distinctiveTokens.length > 0 ? distinctiveTokens : tokens;
}

function hasStrongResultMatch(input: {
  seedName: string;
  resultName: string;
  resultAddress: string;
}) {
  const queryTokens = tokenizeComparable(input.seedName);
  const resultHaystack = normalizeComparablePlaceName([input.resultName, input.resultAddress].join(" "));

  if (queryTokens.length === 0 || !resultHaystack) {
    return false;
  }

  const matchedTokenCount = queryTokens.filter((token) => resultHaystack.includes(token)).length;
  const requiredMatches = queryTokens.length >= 4 ? 3 : queryTokens.length >= 2 ? 2 : 1;

  return matchedTokenCount >= requiredMatches;
}

async function resolveLocalityContext(seed: CandidateSeed) {
  const directCity = seed.city.trim();
  const directCountry = seed.country.trim();

  if (directCity && directCountry) {
    return {
      city: directCity,
      country: directCountry,
      address: seed.queryHint?.trim() || "",
      mapsUrl: null
    };
  }

  const queryCandidates = Array.from(
    new Set(
      [
        seed.queryHint?.trim(),
        directCity,
        directCountry,
        seed.queryHint?.split(",").map((part) => part.trim()).at(-1)
      ].filter((value): value is string => Boolean(value))
    )
  );

  for (const query of queryCandidates) {
    const summary = await lookupPlaceSummaryFree(query);
    if (summary) {
      return {
        city: summary.city,
        country: summary.country,
        address: summary.formattedAddress,
        mapsUrl: summary.mapsUrl
      };
    }
  }

  return null;
}

function extractAddressHintFromContext(text: string) {
  return (
    text.match(/\b(?:address|location)[:：]\s*([^.;]+(?:,\s*[^.;]+){0,4})/i)?.[1]?.trim() ??
    ""
  );
}

async function verifyCandidate(seed: CandidateSeed) {
  const normalizedSeed = sanitizeSeed(seed);
  if (!normalizedSeed) {
    return null;
  }

  const latinOnlyName = normalizedSeed.name
    .replace(/[\p{Script=Han}]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
  const queryVariants = Array.from(
    new Set(
      [
        [normalizedSeed.name, normalizedSeed.queryHint].filter(Boolean).join(", "),
        latinOnlyName ? [latinOnlyName, normalizedSeed.queryHint].filter(Boolean).join(", ") : null,
        normalizedSeed.queryHint ? normalizedSeed.name : null,
        latinOnlyName && normalizedSeed.queryHint ? latinOnlyName : null
      ].filter((value): value is string => Boolean(value))
    )
  );

  const seedNameVariants = Array.from(
    new Set([normalizedSeed.name, latinOnlyName].filter((value): value is string => Boolean(value)))
  );

  const refineCategory = (input: {
    currentCategory: PipelineCandidate["category"];
    typeName?: string;
    className?: string;
    name?: string;
    formattedAddress?: string;
  }) => {
    if (input.currentCategory !== "activities") {
      return input.currentCategory;
    }

    const haystack = [
      input.typeName,
      input.className,
      input.name,
      input.formattedAddress
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    if (/(cafe|coffee|bakery)/.test(haystack)) {
      return "cafes" satisfies PipelineCandidate["category"];
    }

    if (/(restaurant|eatery|food|fast_food|bbq|ramen|bistro)/.test(haystack)) {
      return "restaurants" satisfies PipelineCandidate["category"];
    }

    if (/(bar|pub|brewery|cocktail)/.test(haystack)) {
      return "bars" satisfies PipelineCandidate["category"];
    }

    if (/(hotel|hostel|resort|guest_house|motel)/.test(haystack)) {
      return "hotels" satisfies PipelineCandidate["category"];
    }

    if (/(viewpoint|lookout|observation|photo|artwork)/.test(haystack)) {
      return "photo spots" satisfies PipelineCandidate["category"];
    }

    if (/(museum|gallery|temple|shrine|park|garden|market|marketplace|peak|beach|island|historic|tourism|attraction|zoo|theme_park)/.test(haystack)) {
      return "scenic spots" satisfies PipelineCandidate["category"];
    }

    return input.currentCategory;
  };

  const toVerifiedCandidate = (input: {
    seedName: string;
    resultName: string;
    city: string;
    country: string;
    formattedAddress: string;
    latitude: number | null;
    longitude: number | null;
    mapsUrl: string | null;
    verificationSource: PipelineCandidate["verificationSource"];
    typeName?: string;
    className?: string;
  }) => {
    const preferredName =
      containsChineseCharacters(normalizedSeed.name) && input.resultName.trim()
        ? input.resultName.trim()
        : normalizedSeed.name;

    return {
      ...normalizedSeed,
      name: preferredName,
      city: input.city,
      country: input.country,
      category: refineCategory({
        currentCategory: normalizedSeed.category,
        typeName: input.typeName,
        className: input.className,
        name: input.resultName,
        formattedAddress: input.formattedAddress
      }),
      address: input.formattedAddress,
      latitude: input.latitude,
      longitude: input.longitude,
      mapsUrl: input.mapsUrl,
      verificationSource: input.verificationSource
    } satisfies PipelineCandidate;
  };

  for (const query of queryVariants) {
    const freeSummary = query ? await lookupPlaceSummaryFree(query) : null;

    if (
      freeSummary &&
      !shouldRejectGenericLocation(
        normalizedSeed.name,
        freeSummary,
        normalizedSeed.allowGenericLocation === true
      ) &&
      seedNameVariants.some((seedName) =>
        hasStrongResultMatch({
          seedName,
          resultName: freeSummary.name,
          resultAddress: freeSummary.formattedAddress
        })
      )
    ) {
      return toVerifiedCandidate({
        seedName: normalizedSeed.name,
        resultName: freeSummary.name,
        city: freeSummary.city,
        country: freeSummary.country,
        formattedAddress: freeSummary.formattedAddress,
        latitude: freeSummary.location.latitude,
        longitude: freeSummary.location.longitude,
        mapsUrl: freeSummary.mapsUrl,
        verificationSource: "nominatim",
        typeName: freeSummary.typeName,
        className: freeSummary.className
      });
    }
  }

  for (const query of queryVariants) {
    const photonSummaries = query ? await lookupPlaceSummaryPhoton(query) : [];
    const photonMatch = photonSummaries.find(
      (summary) =>
        !shouldRejectGenericLocation(
          normalizedSeed.name,
          summary,
          normalizedSeed.allowGenericLocation === true
        ) &&
        seedNameVariants.some((seedName) =>
          hasStrongResultMatch({
            seedName,
            resultName: summary.name,
            resultAddress: summary.formattedAddress
          })
        )
    );

    if (photonMatch) {
      return toVerifiedCandidate({
        seedName: normalizedSeed.name,
        resultName: photonMatch.name,
        city: photonMatch.city,
        country: photonMatch.country,
        formattedAddress: photonMatch.formattedAddress,
        latitude: photonMatch.location.latitude,
        longitude: photonMatch.location.longitude,
        mapsUrl: photonMatch.mapsUrl,
        verificationSource: "photon",
        typeName: photonMatch.typeName,
        className: photonMatch.className
      });
    }
  }

  const fallbackQuery = [
    normalizedSeed.name,
    normalizedSeed.city,
    normalizedSeed.country,
    normalizedSeed.queryHint
  ]
    .filter(Boolean)
    .join(", ");
  const googleSummary = fallbackQuery ? await lookupPlaceSummary(fallbackQuery) : null;

  if (googleSummary) {
    const reverseSummary =
      googleSummary.location?.latitude != null && googleSummary.location?.longitude != null
        ? await reverseLookupPlaceSummaryFree(
            googleSummary.location.latitude,
            googleSummary.location.longitude
          )
        : null;

    const fallbackAddressSegments = (googleSummary.formattedAddress ?? "")
      .split(",")
      .map((segment) => segment.trim())
      .filter(Boolean);
    const fallbackCountry =
      reverseSummary?.country ||
      normalizedSeed.country ||
      fallbackAddressSegments.at(-1) ||
      "";
    const fallbackCity =
      reverseSummary?.city ||
      normalizedSeed.city ||
      fallbackAddressSegments.at(-2) ||
      "";

    if (fallbackCity && fallbackCountry) {
      return toVerifiedCandidate({
        seedName: normalizedSeed.name,
        resultName: googleSummary.displayName?.text?.trim() || normalizedSeed.name,
        city: fallbackCity,
        country: fallbackCountry,
        formattedAddress: googleSummary.formattedAddress ?? "",
        latitude: googleSummary.location?.latitude ?? null,
        longitude: googleSummary.location?.longitude ?? null,
        mapsUrl: googleSummary.googleMapsUri ?? null,
        verificationSource: "google"
      });
    }
  }

  const localityContext = await resolveLocalityContext(normalizedSeed);
  if (localityContext) {
    const contextResults = await searchPlaceContextWeb(
      [normalizedSeed.name, normalizedSeed.queryHint ?? localityContext.city].filter(Boolean).join(" ")
    );
    const contextMatch = contextResults.find((result) => {
      if (ignoredContextDomains.has(result.domain)) {
        return false;
      }

      const localityHaystack = `${result.title} ${result.snippet}`.toLowerCase();
      return (
        hasStrongResultMatch({
          seedName: normalizedSeed.name,
          resultName: result.title,
          resultAddress: result.snippet
        }) &&
        localityHaystack.includes(localityContext.city.toLowerCase())
      );
    });

    if (contextMatch) {
      return toVerifiedCandidate({
        seedName: normalizedSeed.name,
        resultName: normalizedSeed.name,
        city: localityContext.city,
        country: localityContext.country,
        formattedAddress:
          extractAddressHintFromContext(`${contextMatch.title}. ${contextMatch.snippet}`) ||
          localityContext.address ||
          normalizedSeed.queryHint ||
          "",
        latitude: null,
        longitude: null,
        mapsUrl: localityContext.mapsUrl,
        verificationSource: "context"
      });
    }

    if (
      (contextFallbackPattern.test(normalizedSeed.name) ||
        containsChineseCharacters(normalizedSeed.name) ||
        /pinned travel evidence|labeled reel evidence/i.test(normalizedSeed.description)) &&
      (!isGenericGeographicPlace({
        name: normalizedSeed.name,
        city: localityContext.city,
        country: localityContext.country
      }) ||
        normalizedSeed.allowGenericLocation)
    ) {
      return toVerifiedCandidate({
        seedName: normalizedSeed.name,
        resultName: normalizedSeed.name,
        city: localityContext.city,
        country: localityContext.country,
        formattedAddress: normalizedSeed.queryHint || localityContext.address || "",
        latitude: null,
        longitude: null,
        mapsUrl: localityContext.mapsUrl,
        verificationSource: "context"
      });
    }
  }

  if (
    normalizedSeed.city &&
    normalizedSeed.country &&
    (!isGenericGeographicPlace(normalizedSeed) || normalizedSeed.allowGenericLocation)
  ) {
    return {
      ...normalizedSeed,
      address: "",
      latitude: null,
      longitude: null,
      mapsUrl: null,
      verificationSource: "gemini" as const
    };
  }

  return null;
}

export async function deriveCandidateSeeds(input: {
  combinedText: string;
  destinationHint?: string;
  diagnostics: string[];
  stages: PipelineStages;
}) {
  const ruleSeeds = extractRuleBasedPlaceSeeds({
    text: input.combinedText,
    destinationHint: input.destinationHint,
    maxSeeds: 8
  }).map((seed) => ({
    ...withDefaultCategory(seed),
    queryHint: seed.queryHint,
    evidence: seed.evidence,
    allowGenericLocation: seed.allowGenericLocation
  }));

  let geminiSeeds: CandidateSeed[] = [];
  const shouldRunGeminiRefinement =
    input.combinedText.length >= 24 ||
    (containsChineseCharacters(input.combinedText) && input.combinedText.length >= 8);

  if (shouldRunGeminiRefinement) {
    try {
      const geminiCandidates = await extractPlacesWithGemini({
        type: "text",
        content: input.combinedText.slice(0, 5000),
        destinationHint: input.destinationHint
      });

      geminiSeeds = geminiCandidates.map((candidate) =>
        toCandidateSeedFromGemini(candidate, input.destinationHint)
      );
      input.stages.geminiRefinement = {
        status: "complete",
        detail: geminiCandidates.length
          ? `Gemini suggested ${geminiCandidates.length} candidate places.`
          : "Gemini returned no additional candidates."
      };
    } catch (error) {
      const message =
        error instanceof GeminiProviderError ? error.message : "Gemini refinement failed.";
      input.diagnostics.push(message);
      input.stages.geminiRefinement = {
        status: "failed",
        detail: "Gemini refinement failed. Free parsing continued without it."
      };
    }
  } else {
    input.stages.geminiRefinement = {
      status: "skipped",
      detail: "Evidence text was too thin to justify Gemini refinement."
    };
  }

  return mergeSeeds(ruleSeeds, geminiSeeds);
}

export async function verifyCandidates(seeds: CandidateSeed[]) {
  const verifiedCandidates: PipelineCandidate[] = [];

  for (const seed of seeds) {
    const verified = await verifyCandidate(seed);
    if (verified) {
      verifiedCandidates.push(verified);
    }
  }

  return verifiedCandidates;
}
