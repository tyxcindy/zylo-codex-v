import { readFile } from "node:fs/promises";
import path from "node:path";

const logPath = path.join(process.cwd(), "logs", "imports.jsonl");

function parseArgs(argv) {
  let limit = 20;
  let failuresOnly = true;
  let match = "";

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if ((arg === "--limit" || arg === "-n") && argv[index + 1]) {
      limit = Math.max(1, Number.parseInt(argv[index + 1], 10) || 20);
      index += 1;
      continue;
    }

    if (arg === "--all") {
      failuresOnly = false;
      continue;
    }

    if (arg === "--failures") {
      failuresOnly = true;
      continue;
    }

    if ((arg === "--match" || arg === "--grep") && argv[index + 1]) {
      match = argv[index + 1];
      index += 1;
    }
  }

  return { limit, failuresOnly, match: match.toLowerCase().trim() };
}

function formatStageSummary(stages) {
  if (!stages || typeof stages !== "object") {
    return "none";
  }

  return Object.entries(stages)
    .map(([name, stage]) => `${name}:${stage?.status ?? "unknown"}`)
    .join(" ");
}

function printEntry(entry) {
  console.log(`Time: ${entry.timestamp}`);
  console.log(`Status: ${entry.status}`);
  console.log(`Type: ${entry.type}`);
  console.log(`Label: ${entry.label}`);
  console.log(`Artifact: ${entry.artifactId}`);
  console.log(`Candidates: ${entry.candidateCount}`);
  if (entry.destinationHint) {
    console.log(`Hint: ${entry.destinationHint}`);
  }
  console.log(`Message: ${entry.message}`);
  if (entry.error) {
    console.log(`Error: ${entry.error}`);
  }
  if (entry.sourceContentPreview) {
    console.log(`Preview: ${entry.sourceContentPreview}`);
  }
  if (entry.sourceUrl) {
    console.log(`URL: ${entry.sourceUrl}`);
  }
  if (entry.analysis?.score) {
    console.log(
      `Score: ${entry.analysis.score.score} travel=${entry.analysis.score.looksTravelRelated}`
    );
  }
  if (entry.analysis?.candidateNames?.length) {
    console.log(`Names: ${entry.analysis.candidateNames.join(", ")}`);
  }
  if (entry.analysis?.failureReason) {
    console.log(`Failure Reason: ${entry.analysis.failureReason}`);
  }
  if (entry.analysis?.stageFailures?.length) {
    console.log(
      `Stage Failures: ${entry.analysis.stageFailures.map((stage) => `${stage.name}=${stage.detail}`).join(" | ")}`
    );
  }
  if (entry.analysis?.diagnostics?.length) {
    console.log(`Diagnostics: ${entry.analysis.diagnostics.join(" | ")}`);
  }
  if (entry.persistenceFailures?.length) {
    console.log(
      `Persistence Failures: ${entry.persistenceFailures
        .map((item) => `${item.candidateName}=${item.error}`)
        .join(" | ")}`
    );
  }
  console.log(`Stages: ${formatStageSummary(entry.analysis?.stages)}`);
  console.log("");
}

async function main() {
  const { limit, failuresOnly, match } = parseArgs(process.argv.slice(2));

  let raw;
  try {
    raw = await readFile(logPath, "utf8");
  } catch {
    console.log("No import troubleshooting log found yet.");
    console.log(`Expected path: ${logPath}`);
    process.exit(0);
  }

  const entries = raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(Boolean);

  const filtered = failuresOnly
    ? entries.filter((entry) => entry.status === "failure")
    : entries;

  const matched = match
    ? filtered.filter((entry) =>
        JSON.stringify(entry).toLowerCase().includes(match)
      )
    : filtered;

  const selected = matched.slice(-limit).reverse();

  if (selected.length === 0) {
    console.log(failuresOnly ? "No failed imports logged yet." : "No imports logged yet.");
    process.exit(0);
  }

  console.log(
    failuresOnly
      ? `Showing ${selected.length} most recent failed import(s):`
      : `Showing ${selected.length} most recent import(s):`
  );
  console.log("");

  for (const entry of selected) {
    printEntry(entry);
  }
}

await main();
