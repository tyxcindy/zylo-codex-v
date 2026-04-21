import { NextRequest, NextResponse } from "next/server";

import { requireApiUser } from "@/lib/auth";

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
    .select("id, status, error_message, created_at, updated_at")
    .eq("source_artifact_id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!artifact) {
    return NextResponse.json({ error: "Import job not found." }, { status: 404 });
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
    importJob
  });
}
