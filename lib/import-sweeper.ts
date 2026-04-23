import { isImportJobStale, resumeQueuedImportSubmission } from "@/lib/import-processing";
import { createAdminClient } from "@/lib/supabase/admin";

type AdminSupabase = NonNullable<ReturnType<typeof createAdminClient>>;

type SweepableImportJob = {
  id: string;
  user_id: string;
  source_artifact_id: string;
  status: "queued" | "processing";
  updated_at: string | null;
};

export const DEFAULT_IMPORT_SWEEP_LIMIT = 25;

export type ImportSweepResult = {
  inspected: number;
  eligible: number;
  resumed: number;
  skippedFresh: number;
  skippedNotResumable: number;
  failed: number;
  missingAdminClient: boolean;
  errors: Array<{
    artifactId: string;
    userId: string;
    message: string;
  }>;
};

export async function resumePendingImportSubmissions(input: {
  supabase?: AdminSupabase | null;
  limit?: number;
  ip?: string;
} = {}): Promise<ImportSweepResult> {
  const supabase = input.supabase ?? createAdminClient();

  if (!supabase) {
    return {
      inspected: 0,
      eligible: 0,
      resumed: 0,
      skippedFresh: 0,
      skippedNotResumable: 0,
      failed: 0,
      missingAdminClient: true,
      errors: []
    };
  }

  const limit = Math.max(1, Math.min(input.limit ?? DEFAULT_IMPORT_SWEEP_LIMIT, 200));
  const { data, error } = await supabase
    .from("import_jobs")
    .select("id, user_id, source_artifact_id, status, updated_at")
    .in("status", ["queued", "processing"])
    .order("updated_at", { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(`Unable to load pending import jobs: ${error.message}`);
  }

  const jobs = (data ?? []) as SweepableImportJob[];
  let resumed = 0;
  let skippedFresh = 0;
  let skippedNotResumable = 0;
  let failed = 0;
  const errors: ImportSweepResult["errors"] = [];

  for (const job of jobs) {
    const shouldResume = job.status === "queued" || isImportJobStale(job.updated_at);

    if (!shouldResume) {
      skippedFresh += 1;
      continue;
    }

    try {
      const didResume = await resumeQueuedImportSubmission({
        supabase: supabase as never,
        user: {
          id: job.user_id
        },
        artifactId: job.source_artifact_id,
        ip: input.ip ?? "sweeper"
      });

      if (didResume) {
        resumed += 1;
      } else {
        skippedNotResumable += 1;
      }
    } catch (resumeError) {
      failed += 1;
      errors.push({
        artifactId: job.source_artifact_id,
        userId: job.user_id,
        message: resumeError instanceof Error ? resumeError.message : String(resumeError)
      });
    }
  }

  return {
    inspected: jobs.length,
    eligible: jobs.length - skippedFresh,
    resumed,
    skippedFresh,
    skippedNotResumable,
    failed,
    missingAdminClient: false,
    errors
  };
}
