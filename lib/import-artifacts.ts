import type { SourceArtifact } from "@/lib/domain";
import type { ImportPipelineInput } from "@/lib/import-pipeline-types";

type SupabaseLike = Awaited<ReturnType<typeof import("@/lib/supabase/server").createClient>>;

export type ImportArtifactRecord = {
  id: string;
  type: "url" | "text" | "image";
  label: string;
  status: string;
  created_at: string;
  extracted_places: number;
};

export type ImportJobRecord = {
  id: string;
  status: string;
  stage?: string;
  stage_detail?: string;
} | null;

export function buildArtifactLabel(type: ImportPipelineInput["type"], title?: string | null) {
  if (type === "url") {
    const normalized =
      title
        ?.replace(/\s+on Instagram:.*$/i, "")
        .replace(/\s+on TikTok:.*$/i, "")
        .split("\n")[0]
        .trim() || "New link import";

    return normalized.slice(0, 160);
  }

  if (type === "image") {
    return "New screenshot import";
  }

  return "New text import";
}

export function createQueuedArtifact(input: { type: ImportPipelineInput["type"] }): SourceArtifact {
  return {
    id: `src_${crypto.randomUUID()}`,
    type: input.type,
    label: buildArtifactLabel(input.type, null),
    status: "queued",
    createdAt: new Date().toISOString(),
    extractedPlaces: 0
  };
}

export async function createImportArtifact(input: {
  supabase: SupabaseLike;
  userId: string;
  payload: ImportPipelineInput;
}) {
  const artifact = createQueuedArtifact({ type: input.payload.type });

  const { data, error } = await input.supabase
    .from("source_artifacts")
    .insert({
      user_id: input.userId,
      type: artifact.type,
      label: artifact.label,
      raw_content: input.payload.content,
      status: "queued",
      extracted_places: 0,
      destination_hint: input.payload.destinationHint ?? ""
    })
    .select("id, type, label, status, created_at, extracted_places")
    .single();

  return { artifact, record: data as ImportArtifactRecord | null, error };
}

export async function createImportJob(input: {
  supabase: SupabaseLike;
  userId: string;
  artifactId: string;
}) {
  const { data } = await input.supabase
    .from("import_jobs")
    .insert({
      user_id: input.userId,
      source_artifact_id: input.artifactId,
      status: "queued",
      stage: "queued",
      stage_detail: "Queued for background processing."
    })
    .select("id, status, stage, stage_detail")
    .single();

  return (data as ImportJobRecord) ?? null;
}

export async function updateImportJobProgress(input: {
  supabase: SupabaseLike;
  userId: string;
  artifactId: string;
  status: "queued" | "processing" | "complete" | "failed";
  stage: "queued" | "extracting" | "persisting" | "complete" | "failed";
  stageDetail: string;
  errorMessage?: string | null;
}) {
  const nowIso = new Date().toISOString();
  const startedAt = input.status === "processing" ? nowIso : undefined;
  const finishedAt = input.status === "complete" || input.status === "failed" ? nowIso : undefined;

  await input.supabase
    .from("source_artifacts")
    .update({
      status:
        input.status === "processing"
          ? "processing"
          : input.status === "complete"
            ? "complete"
            : input.status === "failed"
              ? "failed"
              : "queued"
    })
    .eq("id", input.artifactId)
    .eq("user_id", input.userId);

  await input.supabase
    .from("import_jobs")
    .update({
      status: input.status,
      stage: input.stage,
      stage_detail: input.stageDetail,
      error_message: input.errorMessage ?? null,
      started_at: startedAt,
      finished_at: finishedAt
    })
    .eq("source_artifact_id", input.artifactId)
    .eq("user_id", input.userId);
}

export async function saveImportJobArtifacts(input: {
  supabase: SupabaseLike;
  userId: string;
  artifactId: string;
  analysisPreview: Record<string, unknown>;
  providerRuns?: Array<Record<string, unknown>>;
}) {
  await input.supabase
    .from("import_jobs")
    .update({
      analysis_preview: input.analysisPreview,
      provider_runs: input.providerRuns ?? []
    })
    .eq("source_artifact_id", input.artifactId)
    .eq("user_id", input.userId);
}

export async function updateImportArtifactLabel(input: {
  supabase: SupabaseLike;
  userId: string;
  artifactId: string;
  label: string;
}) {
  await input.supabase
    .from("source_artifacts")
    .update({
      label: input.label
    })
    .eq("id", input.artifactId)
    .eq("user_id", input.userId);
}

export async function markImportFailure(input: {
  supabase: SupabaseLike;
  userId: string;
  artifactId: string;
  message: string;
}) {
  await updateImportJobProgress({
    supabase: input.supabase,
    userId: input.userId,
    artifactId: input.artifactId,
    status: "failed",
    stage: "failed",
    stageDetail: input.message,
    errorMessage: input.message
  });

  await input.supabase
    .from("source_artifacts")
    .update({ extracted_places: 0 })
    .eq("id", input.artifactId)
    .eq("user_id", input.userId);
}

export async function markImportComplete(input: {
  supabase: SupabaseLike;
  userId: string;
  artifactId: string;
  extractedPlaces: number;
}) {
  await updateImportJobProgress({
    supabase: input.supabase,
    userId: input.userId,
    artifactId: input.artifactId,
    status: "complete",
    stage: "complete",
    stageDetail: `Saved ${input.extractedPlaces} verified place(s).`
  });

  await input.supabase
    .from("source_artifacts")
    .update({ extracted_places: input.extractedPlaces })
    .eq("id", input.artifactId)
    .eq("user_id", input.userId);
}
