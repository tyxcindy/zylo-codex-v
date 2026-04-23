import fixtures from "@/lib/import-benchmark-fixtures.json";
import { normalizeComparablePlaceName } from "@/lib/place-quality";
import type { PlaceCategory } from "@/lib/domain";

export type ImportBenchmarkExpectedPlace = {
  name: string;
  aliases?: string[];
  acceptableCategories: PlaceCategory[];
  address?: string;
};

export type ImportBenchmarkFixture = {
  id: string;
  sourceUrl: string;
  destinationHint: string;
  expectedPlaces: ImportBenchmarkExpectedPlace[];
};

export type ImportBenchmarkCandidate = {
  name: string;
  category: PlaceCategory;
};

export type ImportBenchmarkEvaluation = {
  matchedExpectedNames: string[];
  missingExpectedNames: string[];
  unexpectedCandidateNames: string[];
  categoryMismatches: Array<{
    expectedName: string;
    candidateName: string;
    actualCategory: PlaceCategory;
    acceptableCategories: PlaceCategory[];
  }>;
};

export const importBenchmarkFixtures = fixtures as ImportBenchmarkFixture[];

function normalizeForBenchmark(value: string) {
  return normalizeComparablePlaceName(value)
    .normalize("NFD")
    .replace(/\p{M}+/gu, "")
    .replace(/\bsaint\b/g, "st")
    .replace(/\bstreet\b/g, "st")
    .trim();
}

function namesLookEquivalent(left: string, right: string) {
  const normalizedLeft = normalizeForBenchmark(left);
  const normalizedRight = normalizeForBenchmark(right);

  if (!normalizedLeft || !normalizedRight) {
    return false;
  }

  if (normalizedLeft === normalizedRight) {
    return true;
  }

  if (normalizedLeft.includes(normalizedRight) || normalizedRight.includes(normalizedLeft)) {
    return true;
  }

  const leftTokens = normalizedLeft.split(" ").filter(Boolean);
  const rightTokens = normalizedRight.split(" ").filter(Boolean);
  const sharedTokens = leftTokens.filter((token) => rightTokens.includes(token));
  const requiredShared = Math.min(2, leftTokens.length, rightTokens.length);

  return sharedTokens.length >= requiredShared && sharedTokens.length >= 1;
}

function matchExpectedPlace(
  expectedPlace: ImportBenchmarkExpectedPlace,
  candidate: ImportBenchmarkCandidate
) {
  const names = [expectedPlace.name, ...(expectedPlace.aliases ?? [])];
  return names.some((name) => namesLookEquivalent(name, candidate.name));
}

export function summarizeImportBenchmarkFixtures() {
  return {
    fixtureCount: importBenchmarkFixtures.length,
    expectedPlaceCount: importBenchmarkFixtures.reduce(
      (count, fixture) => count + fixture.expectedPlaces.length,
      0
    )
  };
}

export function evaluateImportBenchmark(
  fixture: ImportBenchmarkFixture,
  candidates: ImportBenchmarkCandidate[]
): ImportBenchmarkEvaluation {
  const matchedExpectedNames: string[] = [];
  const missingExpectedNames: string[] = [];
  const unexpectedCandidateNames: string[] = [];
  const categoryMismatches: ImportBenchmarkEvaluation["categoryMismatches"] = [];
  const matchedCandidateIndexes = new Set<number>();

  for (const expectedPlace of fixture.expectedPlaces) {
    const candidateIndex = candidates.findIndex((candidate, index) => {
      if (matchedCandidateIndexes.has(index)) {
        return false;
      }

      return matchExpectedPlace(expectedPlace, candidate);
    });

    if (candidateIndex === -1) {
      missingExpectedNames.push(expectedPlace.name);
      continue;
    }

    matchedCandidateIndexes.add(candidateIndex);
    const candidate = candidates[candidateIndex];

    if (!expectedPlace.acceptableCategories.includes(candidate.category)) {
      categoryMismatches.push({
        expectedName: expectedPlace.name,
        candidateName: candidate.name,
        actualCategory: candidate.category,
        acceptableCategories: expectedPlace.acceptableCategories
      });
    } else {
      matchedExpectedNames.push(expectedPlace.name);
    }
  }

  candidates.forEach((candidate, index) => {
    if (!matchedCandidateIndexes.has(index)) {
      unexpectedCandidateNames.push(candidate.name);
    }
  });

  return {
    matchedExpectedNames,
    missingExpectedNames,
    unexpectedCandidateNames,
    categoryMismatches
  };
}
