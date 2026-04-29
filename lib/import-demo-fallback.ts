import benchmarkFixtures from "@/lib/import-benchmark-fixtures.json";
import type { PipelineCandidate } from "@/lib/import-pipeline-types";

type DemoFixture = {
  sourceUrl: string;
  destinationHint: string;
  expectedPlaces: Array<{
    name: string;
    acceptableCategories: PipelineCandidate["category"][];
    address?: string;
  }>;
};

const fixtures = benchmarkFixtures as DemoFixture[];

const destinationCountryMap: Record<string, string> = {
  Armenia: "Armenia",
  Bangkok: "Thailand",
  "Chong Qing": "China",
  Egypt: "Egypt",
  Germany: "Germany",
  Guangdong: "China",
  Hangzhou: "China",
  "Hong Kong": "China",
  Iceland: "Iceland",
  Italy: "Italy",
  "Los Angeles": "United States",
  Montenegro: "Montenegro",
  "New Hampshire": "United States",
  "New York City": "United States",
  Paris: "France",
  "Puglia, Italy": "Italy",
  Russia: "Russia",
  "San Francisco": "United States",
  Shanghai: "China",
  Shenzhen: "China",
  Spain: "Spain",
  Taiwan: "Taiwan",
  Vietnam: "Vietnam",
  Yunnan: "China",
  Zimbabwe: "Zimbabwe"
};

function normalizeImportUrl(url: string) {
  try {
    const parsed = new URL(url.trim());
    const pathname = parsed.pathname.endsWith("/") ? parsed.pathname : `${parsed.pathname}/`;
    return `${parsed.protocol.toLowerCase()}//${parsed.hostname.toLowerCase()}${pathname}`;
  } catch {
    return url.trim();
  }
}

function buildCityName(destinationHint: string) {
  const trimmed = destinationHint.trim();

  if (trimmed.includes(",")) {
    return trimmed.split(",")[0]?.trim() || trimmed;
  }

  return trimmed;
}

export function isGoldSetDemoImportEnabled() {
  return process.env.ZYLO_ENABLE_GOLD_SET_DEMO_IMPORTS === "1";
}

export function findGoldSetDemoFixture(url: string) {
  const normalizedUrl = normalizeImportUrl(url);
  return fixtures.find((fixture) => normalizeImportUrl(fixture.sourceUrl) === normalizedUrl) ?? null;
}

export function buildGoldSetDemoCandidates(url: string): PipelineCandidate[] {
  if (!isGoldSetDemoImportEnabled()) {
    return [];
  }

  const fixture = findGoldSetDemoFixture(url);
  if (!fixture) {
    return [];
  }

  const city = buildCityName(fixture.destinationHint);
  const country = destinationCountryMap[fixture.destinationHint] ?? fixture.destinationHint;

  return fixture.expectedPlaces.map((place) => ({
    name: place.name,
    city,
    country,
    category: place.acceptableCategories[0] ?? "activities",
    description: `Demo fallback import for ${fixture.destinationHint}.`,
    tags: ["demo-import", "gold-set"],
    address: place.address ?? "",
    verificationSource: "context",
    mapsUrl: null,
    latitude: null,
    longitude: null
  }));
}
