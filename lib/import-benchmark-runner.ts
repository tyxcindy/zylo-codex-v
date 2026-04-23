import {
  evaluateImportBenchmark,
  importBenchmarkFixtures,
  type ImportBenchmarkCandidate,
  type ImportBenchmarkEvaluation,
  type ImportBenchmarkFixture
} from "@/lib/import-benchmark";
import { runImportPipeline, type ImportPipelineResult } from "@/lib/import-pipeline";

export type ImportBenchmarkFixtureRun = {
  fixtureId: string;
  sourceUrl: string;
  destinationHint: string;
  candidateCount: number;
  matchedExpectedNames: string[];
  missingExpectedNames: string[];
  unexpectedCandidateNames: string[];
  categoryMismatches: ImportBenchmarkEvaluation["categoryMismatches"];
  success: boolean;
  failureReason: string | null;
  pipelineError: string | null;
  diagnostics: string[];
  travelScore: number | null;
  looksTravelRelated: boolean;
  elapsedMs: number;
};

export type ImportBenchmarkSummary = {
  fixturesRun: number;
  fixturesPassed: number;
  expectedPlaceCount: number;
  matchedExpectedCount: number;
  missingExpectedCount: number;
  unexpectedCandidateCount: number;
  categoryMismatchCount: number;
  candidateCount: number;
  recall: number;
  strictPrecision: number;
  strictFixturePassRate: number;
  blockedSourceCount: number;
  pipelineCrashCount: number;
};

function summarizeError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return JSON.stringify(error);
}

export function selectImportBenchmarkFixtures(input: {
  ids?: string[];
  limit?: number;
} = {}) {
  let fixtures = importBenchmarkFixtures;

  if (input.ids && input.ids.length > 0) {
    const requestedIds = new Set(input.ids);
    fixtures = fixtures.filter((fixture) => requestedIds.has(fixture.id));
  }

  if (input.limit && input.limit > 0) {
    fixtures = fixtures.slice(0, input.limit);
  }

  return fixtures;
}

export function mapPipelineCandidatesToBenchmarkCandidates(result: ImportPipelineResult) {
  return result.candidates.map(
    (candidate) =>
      ({
        name: candidate.name,
        category: candidate.category
      }) satisfies ImportBenchmarkCandidate
  );
}

export function isSuccessfulBenchmarkRun(
  evaluation: Pick<
    ImportBenchmarkFixtureRun,
    "missingExpectedNames" | "unexpectedCandidateNames" | "categoryMismatches"
  >
) {
  return (
    evaluation.missingExpectedNames.length === 0 &&
    evaluation.unexpectedCandidateNames.length === 0 &&
    evaluation.categoryMismatches.length === 0
  );
}

export async function runImportBenchmarkFixture(
  fixture: ImportBenchmarkFixture
): Promise<ImportBenchmarkFixtureRun> {
  const startedAt = Date.now();

  try {
    const pipelineResult = await runImportPipeline({
      type: "url",
      content: fixture.sourceUrl,
      destinationHint: fixture.destinationHint
    });
    const evaluation = evaluateImportBenchmark(
      fixture,
      mapPipelineCandidatesToBenchmarkCandidates(pipelineResult)
    );

    return {
      fixtureId: fixture.id,
      sourceUrl: fixture.sourceUrl,
      destinationHint: fixture.destinationHint,
      candidateCount: pipelineResult.candidates.length,
      matchedExpectedNames: evaluation.matchedExpectedNames,
      missingExpectedNames: evaluation.missingExpectedNames,
      unexpectedCandidateNames: evaluation.unexpectedCandidateNames,
      categoryMismatches: evaluation.categoryMismatches,
      success: isSuccessfulBenchmarkRun(evaluation),
      failureReason: pipelineResult.failureReason ?? null,
      pipelineError: null,
      diagnostics: pipelineResult.diagnostics,
      travelScore: pipelineResult.score.score,
      looksTravelRelated: pipelineResult.score.looksTravelRelated,
      elapsedMs: Date.now() - startedAt
    };
  } catch (error) {
    return {
      fixtureId: fixture.id,
      sourceUrl: fixture.sourceUrl,
      destinationHint: fixture.destinationHint,
      candidateCount: 0,
      matchedExpectedNames: [],
      missingExpectedNames: fixture.expectedPlaces.map((place) => place.name),
      unexpectedCandidateNames: [],
      categoryMismatches: [],
      success: false,
      failureReason: null,
      pipelineError: summarizeError(error),
      diagnostics: [],
      travelScore: null,
      looksTravelRelated: false,
      elapsedMs: Date.now() - startedAt
    };
  }
}

export function summarizeImportBenchmarkRuns(
  runs: ImportBenchmarkFixtureRun[]
): ImportBenchmarkSummary {
  const fixturesRun = runs.length;
  const fixturesPassed = runs.filter((run) => run.success).length;
  const matchedExpectedCount = runs.reduce(
    (count, run) => count + run.matchedExpectedNames.length,
    0
  );
  const missingExpectedCount = runs.reduce(
    (count, run) => count + run.missingExpectedNames.length,
    0
  );
  const unexpectedCandidateCount = runs.reduce(
    (count, run) => count + run.unexpectedCandidateNames.length,
    0
  );
  const categoryMismatchCount = runs.reduce(
    (count, run) => count + run.categoryMismatches.length,
    0
  );
  const candidateCount = runs.reduce((count, run) => count + run.candidateCount, 0);
  const expectedPlaceCount = matchedExpectedCount + missingExpectedCount;
  const precisionDenominator =
    matchedExpectedCount + unexpectedCandidateCount + categoryMismatchCount;

  return {
    fixturesRun,
    fixturesPassed,
    expectedPlaceCount,
    matchedExpectedCount,
    missingExpectedCount,
    unexpectedCandidateCount,
    categoryMismatchCount,
    candidateCount,
    recall: expectedPlaceCount > 0 ? matchedExpectedCount / expectedPlaceCount : 0,
    strictPrecision:
      precisionDenominator > 0 ? matchedExpectedCount / precisionDenominator : 0,
    strictFixturePassRate: fixturesRun > 0 ? fixturesPassed / fixturesRun : 0,
    blockedSourceCount: runs.filter((run) =>
      (run.failureReason ?? "").includes("blocked link extraction")
    ).length,
    pipelineCrashCount: runs.filter((run) => Boolean(run.pipelineError)).length
  };
}
