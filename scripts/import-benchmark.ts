import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  runImportBenchmarkFixture,
  selectImportBenchmarkFixtures,
  summarizeImportBenchmarkRuns
} from "../lib/import-benchmark-runner";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseFixtureIds(value: string) {
  return value
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

function parseArgs(argv: string[]) {
  const options: {
    ids: string[];
    limit?: number;
    delayMs: number;
    output?: string;
    help: boolean;
  } = {
    ids: [],
    limit: undefined,
    delayMs: 1500,
    output: undefined,
    help: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    if (argument === "--help" || argument === "-h") {
      options.help = true;
      continue;
    }

    if (argument === "--id") {
      const value = argv[index + 1];
      if (!value) {
        throw new Error("--id expects a fixture id or comma-separated ids.");
      }
      options.ids.push(...parseFixtureIds(value));
      index += 1;
      continue;
    }

    if (argument === "--limit") {
      const value = Number(argv[index + 1]);
      if (!Number.isFinite(value) || value <= 0) {
        throw new Error("--limit expects a positive number.");
      }
      options.limit = value;
      index += 1;
      continue;
    }

    if (argument === "--delay-ms") {
      const value = Number(argv[index + 1]);
      if (!Number.isFinite(value) || value < 0) {
        throw new Error("--delay-ms expects a non-negative number.");
      }
      options.delayMs = value;
      index += 1;
      continue;
    }

    if (argument === "--output") {
      const value = argv[index + 1]?.trim();
      if (!value) {
        throw new Error("--output expects a file path.");
      }
      options.output = value;
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${argument}`);
  }

  return options;
}

function printHelp() {
  console.log(
    "Usage: npm run imports:benchmark -- [--id fixture-1,fixture-2] [--limit 5] [--delay-ms 1500] [--output reports/import-benchmark.json]"
  );
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    printHelp();
    process.exit(0);
  }

  const fixtures = selectImportBenchmarkFixtures({
    ids: options.ids,
    limit: options.limit
  });

  if (fixtures.length === 0) {
    console.error("No benchmark fixtures matched the requested filters.");
    process.exit(1);
  }

  console.log(
    `Running ${fixtures.length} import benchmark fixture(s) with a ${options.delayMs}ms delay between runs.`
  );

  const runs = [];

  for (const [index, fixture] of fixtures.entries()) {
    console.log(`\n[${index + 1}/${fixtures.length}] ${fixture.id}`);
    console.log(`URL: ${fixture.sourceUrl}`);

    const run = await runImportBenchmarkFixture(fixture);
    runs.push(run);

    console.log(
      `${run.success ? "PASS" : "FAIL"} matched ${run.matchedExpectedNames.length}/${fixture.expectedPlaces.length}, missing ${run.missingExpectedNames.length}, unexpected ${run.unexpectedCandidateNames.length}, category mismatches ${run.categoryMismatches.length}, candidates ${run.candidateCount}, elapsed ${run.elapsedMs}ms`
    );

    if (run.failureReason) {
      console.log(`Failure reason: ${run.failureReason}`);
    }

    if (run.pipelineError) {
      console.log(`Pipeline error: ${run.pipelineError}`);
    }

    if (options.delayMs > 0 && index < fixtures.length - 1) {
      await sleep(options.delayMs);
    }
  }

  const summary = summarizeImportBenchmarkRuns(runs);

  console.log("\nSummary");
  console.log(
    `Fixtures passed ${summary.fixturesPassed}/${summary.fixturesRun}. Expected places matched ${summary.matchedExpectedCount}/${summary.expectedPlaceCount}.`
  );
  console.log(
    `Recall ${summary.recall.toFixed(3)}. Strict precision ${summary.strictPrecision.toFixed(3)}. Strict fixture pass rate ${summary.strictFixturePassRate.toFixed(3)}.`
  );
  console.log(
    `Unexpected candidates ${summary.unexpectedCandidateCount}. Category mismatches ${summary.categoryMismatchCount}. Blocked sources ${summary.blockedSourceCount}. Pipeline crashes ${summary.pipelineCrashCount}.`
  );

  if (options.output) {
    const outputPath = path.resolve(process.cwd(), options.output);
    await mkdir(path.dirname(outputPath), { recursive: true });
    await writeFile(
      outputPath,
      JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          summary,
          runs
        },
        null,
        2
      )
    );
    console.log(`Saved report to ${outputPath}`);
  }

  if (summary.fixturesPassed !== summary.fixturesRun) {
    process.exitCode = 1;
  }
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
