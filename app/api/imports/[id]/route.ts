import { NextRequest, NextResponse } from "next/server";

import { requireApiUser } from "@/lib/auth";
import { isImportJobStale, resumeQueuedImportSubmission } from "@/lib/import-processing";
import { getClientIp } from "@/lib/request";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { supabase, user } = await requireApiUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { data: artifact } = await supabase
    .from("source_artifacts")
    .select("id, type, label, status, created_at, extracted_places")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: importJob } = await supabase
    .from("import_jobs")
    .select(
      "id, status, stage, stage_detail, error_message, created_at, updated_at, started_at, finished_at, analysis_preview"
    )
    .eq("source_artifact_id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!artifact) {
    return NextResponse.json({ error: "Import job not found." }, { status: 404 });
  }

  if (
    artifact.status === "queued" ||
    importJob?.status === "queued" ||
    (importJob?.status === "processing" && isImportJobStale(importJob.updated_at))
  ) {
    await resumeQueuedImportSubmission({
      supabase,
      user,
      artifactId: id,
      ip: getClientIp(_request)
    });

    const [{ data: refreshedArtifact }, { data: refreshedImportJob }] = await Promise.all([
      supabase
        .from("source_artifacts")
        .select("id, type, label, status, created_at, extracted_places")
        .eq("id", id)
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("import_jobs")
        .select(
          "id, status, stage, stage_detail, error_message, created_at, updated_at, started_at, finished_at, analysis_preview"
        )
        .eq("source_artifact_id", id)
        .eq("user_id", user.id)
        .maybeSingle()
    ]);

    return NextResponse.json({
      job: {
        id: refreshedArtifact?.id ?? artifact.id,
        type: refreshedArtifact?.type ?? artifact.type,
        label: refreshedArtifact?.label ?? artifact.label,
        status: refreshedArtifact?.status ?? artifact.status,
        createdAt: refreshedArtifact?.created_at ?? artifact.created_at,
        extractedPlaces: refreshedArtifact?.extracted_places ?? artifact.extracted_places
      },
      importJob: refreshedImportJob
        ? {
            id: refreshedImportJob.id,
            status: refreshedImportJob.status,
            stage: refreshedImportJob.stage,
            stageDetail: refreshedImportJob.stage_detail,
            errorMessage: refreshedImportJob.error_message,
            createdAt: refreshedImportJob.created_at,
            updatedAt: refreshedImportJob.updated_at,
            startedAt: refreshedImportJob.started_at,
            finishedAt: refreshedImportJob.finished_at
          }
        : null,
      analysisPreview:
        refreshedImportJob &&
        refreshedImportJob.analysis_preview &&
        Object.keys(refreshedImportJob.analysis_preview).length > 0
          ? refreshedImportJob.analysis_preview
          : null
    });
  }

  return NextResponse.json({
    job: {
      id: artifact.id,
      type: artifact.type,
      label: artifact.label,
      status: artifact.status,
      createdAt: artifact.created_at,
      extractedPlaces: artifact.extracted_places
    },
    importJob: importJob
      ? {
          id: importJob.id,
          status: importJob.status,
          stage: importJob.stage,
          stageDetail: importJob.stage_detail,
          errorMessage: importJob.error_message,
          createdAt: importJob.created_at,
          updatedAt: importJob.updated_at,
          startedAt: importJob.started_at,
          finishedAt: importJob.finished_at
        }
      : null,
    analysisPreview:
      importJob && importJob.analysis_preview && Object.keys(importJob.analysis_preview).length > 0
        ? importJob.analysis_preview
        : null
  });
}
