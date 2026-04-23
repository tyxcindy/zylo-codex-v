import { recordAuditEvent } from "@/lib/audit";
import { ensureProfileForUser } from "@/lib/database";
import {
  buildArtifactLabel,
  createImportArtifact,
  createImportJob,
  markImportComplete,
  markImportFailure,
  saveImportJobArtifacts,
  updateImportArtifactLabel,
  updateImportJobProgress,
  type ImportArtifactRecord,
  type ImportJobRecord
} from "@/lib/import-artifacts";
import { appendImportLog } from "@/lib/import-logger";
import {
  buildImportEnrichmentPreview,
  buildImportImagePreview,
  persistImportCandidates
} from "@/lib/import-place-persistence";
import { runImportPipeline, type ImportPipelineInput, type ImportPipelineResult } from "@/lib/import-pipeline";
import { getProviderStatus } from "@/lib/provider-status";

type SupabaseLike = Awaited<ReturnType<typeof import("@/lib/supabase/server").createClient>>;

type ImportUser = {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown>;
};

export type ProcessImportSubmissionResult = {
  status: 201 | 422 | 500 | 503;
  body: Record<string, unknown>;
};

export type QueueImportSubmissionResult = {
  status: 202 | 500;
  body: Record<string, unknown>;
};

type QueuedImportContext = {
  artifactRecord: ImportArtifactRecord;
  importJobRecord: ImportJobRecord;
};

declare global {
  var __zyloActiveImportRuns: Set<string> | undefined;
}

export const STALE_IMPORT_JOB_MS = 2 * 60_000;

function getActiveImportRuns() {
  if (!globalThis.__zyloActiveImportRuns) {
    globalThis.__zyloActiveImportRuns = new Set<string>();
  }

  return globalThis.__zyloActiveImportRuns;
}

export function isImportJobStale(updatedAt: string | null | undefined) {
  if (!updatedAt) {
    return false;
  }

  const updatedAtMs = Date.parse(updatedAt);
  if (Number.isNaN(updatedAtMs)) {
    return false;
  }

  return Date.now() - updatedAtMs > STALE_IMPORT_JOB_MS;
}

function buildNoResultsMessage(input: {
  analysisFailureReason?: string;
  type: ImportPipelineInput["type"];
}) {
  return (
    input.analysisFailureReason ??
    (input.type === "url"
      ? "No actionable places were extracted from that reel link."
      : "No actionable places were found in that import.")
  );
}

function buildAnalysisPreview(
  analysis: ImportPipelineResult,
  persistenceFailures: Array<{ candidateName: string; error: string }> = []
) {
  return {
    travelScore: analysis.score.score,
    looksTravelRelated: analysis.score.looksTravelRelated,
    positiveSignals: analysis.score.positiveSignals,
    negativeSignals: analysis.score.negativeSignals,
    diagnostics: analysis.diagnostics,
    stages: analysis.stages,
    extractedCandidateNames: analysis.candidates.map((candidate) => candidate.name),
    skippedCandidateNames: persistenceFailures.map((item) => item.candidateName),
    failureReason: analysis.failureReason ?? null,
    evidencePreview: analysis.evidencePreview
  };
}

async function createQueuedSubmission(input: {
  supabase: SupabaseLike;
  user: ImportUser;
  payload: ImportPipelineInput;
}) {
  await ensureProfileForUser(input.supabase, input.user);

  const { record: artifactRecord, error: artifactError } = await createImportArtifact({
    supabase: input.supabase,
    userId: input.user.id,
    payload: input.payload
  });

  if (artifactError || !artifactRecord) {
    await recordAuditEvent({
      userId: input.user.id,
      eventType: "api",
      message: "Failed to create source artifact",
      severity: "critical",
      metadata: { reason: artifactError?.message ?? "Unknown artifact insert failure." }
    });

    return {
      ok: false as const,
      result: {
        status: 500,
        body: { error: "Unable to create import artifact." }
      } as const
    };
  }

  const importJobRecord = await createImportJob({
    supabase: input.supabase,
    userId: input.user.id,
    artifactId: artifactRecord.id
  });

  return {
    ok: true as const,
    context: {
      artifactRecord,
      importJobRecord
    } satisfies QueuedImportContext
  };
}

async function runQueuedImportSubmission(input: {
  supabase: SupabaseLike;
  user: ImportUser;
  payload: ImportPipelineInput;
  ip: string;
  artifactRecord: ImportArtifactRecord;
  importJobRecord: ImportJobRecord;
}): Promise<ProcessImportSubmissionResult> {
  await updateImportJobProgress({
    supabase: input.supabase,
    userId: input.user.id,
    artifactId: input.artifactRecord.id,
    status: "processing",
    stage: "extracting",
    stageDetail: "Recovering transcript, subtitles, OCR, and metadata."
  });

  let analysis: ImportPipelineResult;
  try {
    analysis = await runImportPipeline(input.payload);
  } catch (error) {
    const message = "Zylo could not analyze that import right now.";

    await appendImportLog({
      userId: input.user.id,
      artifactId: input.artifactRecord.id,
      importJobId: input.importJobRecord?.id ?? null,
      type: input.payload.type,
      label: input.artifactRecord.label,
      sourceContent: input.payload.content,
      destinationHint: input.payload.destinationHint,
      status: "failure",
      message,
      candidateCount: 0,
      ip: input.ip,
      error: error instanceof Error ? error.message : String(error),
      analysis: null
    });

    await markImportFailure({
      supabase: input.supabase,
      userId: input.user.id,
      artifactId: input.artifactRecord.id,
      message
    });

    return {
      status: 503,
      body: { error: message }
    } satisfies ProcessImportSubmissionResult;
  }

  const resolvedLabel =
    input.artifactRecord.label === "New link import" && analysis.evidencePreview.title
      ? buildArtifactLabel(input.payload.type, analysis.evidencePreview.title)
      : input.artifactRecord.label;

  if (resolvedLabel !== input.artifactRecord.label) {
    await updateImportArtifactLabel({
      supabase: input.supabase,
      userId: input.user.id,
      artifactId: input.artifactRecord.id,
      label: resolvedLabel
    });
  }

  const analysisPreview = buildAnalysisPreview(analysis);
  await saveImportJobArtifacts({
    supabase: input.supabase,
    userId: input.user.id,
    artifactId: input.artifactRecord.id,
    analysisPreview,
    providerRuns: [
      {
        provider: "local-free",
        stages: analysis.stages
      }
    ]
  });

  if (analysis.candidates.length === 0) {
    const message = buildNoResultsMessage({
      analysisFailureReason: analysis.failureReason,
      type: input.payload.type
    });

    await appendImportLog({
      userId: input.user.id,
      artifactId: input.artifactRecord.id,
      importJobId: input.importJobRecord?.id ?? null,
      type: input.payload.type,
      label: resolvedLabel,
      sourceContent: input.payload.content,
      destinationHint: input.payload.destinationHint,
      status: "failure",
      message,
      candidateCount: 0,
      ip: input.ip,
      analysis
    });

    await markImportFailure({
      supabase: input.supabase,
      userId: input.user.id,
      artifactId: input.artifactRecord.id,
      message
    });

    return {
      status: 422,
      body: { error: message }
    } satisfies ProcessImportSubmissionResult;
  }

  await updateImportJobProgress({
    supabase: input.supabase,
    userId: input.user.id,
    artifactId: input.artifactRecord.id,
    status: "processing",
    stage: "persisting",
    stageDetail: `Saving ${analysis.candidates.length} verified candidate(s).`
  });

  const firstCandidate = analysis.candidates[0];
  const imagePreview = await buildImportImagePreview(analysis.candidates);

  const { persistedPlaces, failures: persistenceFailures } = await persistImportCandidates({
    supabase: input.supabase,
    userId: input.user.id,
    artifactId: input.artifactRecord.id,
    candidates: analysis.candidates
  });

  if (persistedPlaces.length === 0) {
    const message = "Zylo could not save the extracted places.";
    await saveImportJobArtifacts({
      supabase: input.supabase,
      userId: input.user.id,
      artifactId: input.artifactRecord.id,
      analysisPreview: buildAnalysisPreview(analysis, persistenceFailures),
      providerRuns: [
        {
          provider: "local-free",
          stages: analysis.stages
        }
      ]
    });

    await appendImportLog({
      userId: input.user.id,
      artifactId: input.artifactRecord.id,
      importJobId: input.importJobRecord?.id ?? null,
      type: input.payload.type,
      label: resolvedLabel,
      sourceContent: input.payload.content,
      destinationHint: input.payload.destinationHint,
      status: "failure",
      message,
      candidateCount: analysis.candidates.length,
      ip: input.ip,
      error: persistenceFailures.map((item) => `${item.candidateName}: ${item.error}`).join(" | "),
      analysis,
      persistenceFailures
    });

    await markImportFailure({
      supabase: input.supabase,
      userId: input.user.id,
      artifactId: input.artifactRecord.id,
      message
    });

    return {
      status: 500,
      body: { error: message }
    } satisfies ProcessImportSubmissionResult;
  }

  await saveImportJobArtifacts({
    supabase: input.supabase,
    userId: input.user.id,
    artifactId: input.artifactRecord.id,
    analysisPreview: buildAnalysisPreview(analysis, persistenceFailures),
    providerRuns: [
      {
        provider: "local-free",
        stages: analysis.stages
      }
    ]
  });

  await markImportComplete({
    supabase: input.supabase,
    userId: input.user.id,
    artifactId: input.artifactRecord.id,
    extractedPlaces: persistedPlaces.length
  });

  await recordAuditEvent({
    userId: input.user.id,
    eventType: "import",
    message: "Import processed",
    severity: "info",
    metadata: {
      ip: input.ip,
      extractedPlaces: persistedPlaces.length,
      travelScore: analysis.score.score,
      looksTravelRelated: analysis.score.looksTravelRelated
    }
  });

  await appendImportLog({
    userId: input.user.id,
    artifactId: input.artifactRecord.id,
    importJobId: input.importJobRecord?.id ?? null,
    type: input.payload.type,
    label: resolvedLabel,
    sourceContent: input.payload.content,
    destinationHint: input.payload.destinationHint,
    status: "success",
    message:
      persistenceFailures.length > 0
        ? `Import processed with ${persistenceFailures.length} skipped candidate(s).`
        : "Import processed successfully.",
    candidateCount: persistedPlaces.length,
    ip: input.ip,
    analysis,
    persistenceFailures
  });

  return {
    status: 201,
    body: {
      job: {
        id: input.artifactRecord.id,
        type: input.artifactRecord.type,
        label: resolvedLabel,
        status: "complete",
        createdAt: input.artifactRecord.created_at,
        extractedPlaces: persistedPlaces.length
      },
      importJob: {
        id: input.importJobRecord?.id ?? null,
        status: "complete",
        stage: "complete",
        stageDetail: `Saved ${persistedPlaces.length} verified place(s).`
      },
      statusUrl: `/api/imports/${input.artifactRecord.id}`,
      providerStatus: getProviderStatus(),
      extractionPreview: persistedPlaces.slice(0, 3),
      enrichmentPreview: buildImportEnrichmentPreview(firstCandidate),
      imagePreview,
      analysisPreview: buildAnalysisPreview(analysis, persistenceFailures)
    }
  } satisfies ProcessImportSubmissionResult;
}

function scheduleQueuedImportSubmission(input: {
  supabase: SupabaseLike;
  user: ImportUser;
  payload: ImportPipelineInput;
  ip: string;
  artifactRecord: ImportArtifactRecord;
  importJobRecord: ImportJobRecord;
}) {
  const activeImportRuns = getActiveImportRuns();
  const runKey = input.artifactRecord.id;

  if (activeImportRuns.has(runKey)) {
    return false;
  }

  activeImportRuns.add(runKey);
  setTimeout(() => {
    void runQueuedImportSubmission(input).finally(() => {
      activeImportRuns.delete(runKey);
    });
  }, 0);

  return true;
}

export async function processImportSubmission(input: {
  supabase: SupabaseLike;
  user: ImportUser;
  payload: ImportPipelineInput;
  ip: string;
}): Promise<ProcessImportSubmissionResult> {
  const queued = await createQueuedSubmission(input);

  if (!queued.ok) {
    return queued.result;
  }

  return runQueuedImportSubmission({
    ...input,
    ...queued.context
  });
}

export async function queueImportSubmission(input: {
  supabase: SupabaseLike;
  user: ImportUser;
  payload: ImportPipelineInput;
  ip: string;
}): Promise<QueueImportSubmissionResult> {
  const queued = await createQueuedSubmission(input);

  if (!queued.ok) {
    return queued.result;
  }

  const { artifactRecord, importJobRecord } = queued.context;
  const backgroundStarted = scheduleQueuedImportSubmission({
    ...input,
    artifactRecord,
    importJobRecord
  });

  return {
    status: 202,
    body: {
      job: {
        id: artifactRecord.id,
        type: artifactRecord.type,
        label: artifactRecord.label,
        status: "queued",
        createdAt: artifactRecord.created_at,
        extractedPlaces: artifactRecord.extracted_places
      },
      importJob: {
        id: importJobRecord?.id ?? null,
        status: "queued",
        stage: "queued",
        stageDetail: backgroundStarted
          ? "Queued for background processing."
          : "Queued, but background processing did not start."
      },
      statusUrl: `/api/imports/${artifactRecord.id}`,
      providerStatus: getProviderStatus()
    }
  } satisfies QueueImportSubmissionResult;
}

export async function resumeQueuedImportSubmission(input: {
  supabase: SupabaseLike;
  user: ImportUser;
  artifactId: string;
  ip?: string;
}) {
  const { data: artifact } = await input.supabase
    .from("source_artifacts")
    .select("id, type, label, status, raw_content, destination_hint, created_at, extracted_places")
    .eq("id", input.artifactId)
    .eq("user_id", input.user.id)
    .maybeSingle();

  const { data: importJob } = await input.supabase
    .from("import_jobs")
    .select("id, status, stage, stage_detail, updated_at")
    .eq("source_artifact_id", input.artifactId)
    .eq("user_id", input.user.id)
    .maybeSingle();

  if (!artifact || !importJob) {
    return false;
  }

  if (artifact.status === "complete" || artifact.status === "failed") {
    return false;
  }

  if (importJob.status === "complete" || importJob.status === "failed") {
    return false;
  }

  if (importJob.status === "processing" && !isImportJobStale(importJob.updated_at)) {
    return false;
  }

  const activeImportRuns = getActiveImportRuns();
  if (activeImportRuns.has(input.artifactId)) {
    return false;
  }

  activeImportRuns.add(input.artifactId);
  try {
    await runQueuedImportSubmission({
      supabase: input.supabase,
      user: input.user,
      payload: {
        type: artifact.type as ImportPipelineInput["type"],
        content: artifact.raw_content as string,
        destinationHint:
          typeof artifact.destination_hint === "string" && artifact.destination_hint.length > 0
            ? artifact.destination_hint
            : undefined
      },
      ip: input.ip ?? "resume",
      artifactRecord: artifact as ImportArtifactRecord,
      importJobRecord: importJob as ImportJobRecord
    });
    return true;
  } finally {
    activeImportRuns.delete(input.artifactId);
  }
}
