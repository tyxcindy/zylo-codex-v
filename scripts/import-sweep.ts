import { DEFAULT_IMPORT_SWEEP_LIMIT, resumePendingImportSubmissions } from "../lib/import-sweeper";

function parseArgs(argv: string[]) {
  const options: {
    limit: number;
    ip: string;
    help: boolean;
  } = {
    limit: DEFAULT_IMPORT_SWEEP_LIMIT,
    ip: "cli-sweep",
    help: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    if (argument === "--help" || argument === "-h") {
      options.help = true;
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

    if (argument === "--ip") {
      const value = argv[index + 1]?.trim();
      if (!value) {
        throw new Error("--ip expects a non-empty value.");
      }
      options.ip = value;
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${argument}`);
  }

  return options;
}

function printHelp() {
  console.log("Usage: npm run imports:sweep -- [--limit 25] [--ip cli-sweep]");
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    printHelp();
    process.exit(0);
  }

  const result = await resumePendingImportSubmissions({
    limit: options.limit,
    ip: options.ip
  });

  if (result.missingAdminClient) {
    console.error("Missing Supabase admin credentials. Configure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
    process.exit(1);
  }

  console.log(
    `Inspected ${result.inspected} job(s). Eligible: ${result.eligible}. Resumed: ${result.resumed}. Fresh skips: ${result.skippedFresh}. Not resumable: ${result.skippedNotResumable}. Failed: ${result.failed}.`
  );

  for (const error of result.errors) {
    console.error(
      `Resume failed for artifact ${error.artifactId} (user ${error.userId}): ${error.message}`
    );
  }

  if (result.failed > 0) {
    process.exitCode = 1;
  }
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
