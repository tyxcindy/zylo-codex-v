import { NextResponse } from "next/server";

import type { SourceArtifact } from "@/lib/domain";
import { ensureProfileForUser, upsertDestination, upsertPlace } from "@/lib/database";
import { lookupPlaceSummary } from "@/lib/providers/google-places";
import { extractPlacesWithGemini, GeminiProviderError } from "@/lib/providers/gemini";
import { searchUnsplashImage } from "@/lib/providers/unsplash";
import { getProviderStatus } from "@/lib/provider-status";
import { getClientIp } from "@/lib/request";
import { fetchUrlMetadata } from "@/lib/url-metadata";
import { requireApiUser } from "@/lib/auth";
import { recordAuditEvent } from "@/lib/audit";
import { applyRateLimit } from "@/lib/security";
import { importSchema, parseWithSchema } from "@/lib/validation";

function buildArtifactLabel(type: "url" | "text" | "image", title?: string | null) {
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

export async function POST(request: Request) {
  const { supabase, user } = await requireApiUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  const parsed = parseWithSchema(importSchema, payload);

  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.errors }, { status: 400 });
  }

  const ip = getClientIp(request);
  const limiter = applyRateLimit(`imports:${ip}:${user.id}`, 10, 60_000);

  if (!limiter.allowed) {
    await recordAuditEvent({
      userId: user.id,
      eventType: "security",
      message: "Import rate limit triggered",
      severity: "warn",
      metadata: { ip }
    });
    return NextResponse.json(
      { error: "Too many import attempts. Try again shortly." },
      { status: 429 }
    );
  }

  const resolvedUrlMetadata =
    parsed.data.type === "url" ? await fetchUrlMetadata(parsed.data.content) : null;

  if (parsed.data.type === "url" && !resolvedUrlMetadata?.rawText) {
    return NextResponse.json(
      {
        error:
          "That reel link did not expose readable text. Paste the caption text directly for now."
      },
      { status: 422 }
    );
  }

  await ensureProfileForUser(supabase, user);

  const newArtifact: SourceArtifact = {
    id: `src_${crypto.randomUUID()}`,
    type: parsed.data.type,
    label: buildArtifactLabel(parsed.data.type, resolvedUrlMetadata?.title),
    status: "queued" as const,
    createdAt: new Date().toISOString(),
    extractedPlaces: 0
  };

  const { data: artifactRecord, error: artifactError } = await supabase
    .from("source_artifacts")
    .insert({
      user_id: user.id,
      type: newArtifact.type,
      label: newArtifact.label,
      raw_content: parsed.data.content,
      status: "processing",
      extracted_places: 0
    })
    .select("id, type, label, status, created_at, extracted_places")
    .single();

  if (artifactError) {
    await recordAuditEvent({
      userId: user.id,
      eventType: "api",
      message: "Failed to create source artifact",
      severity: "critical",
      metadata: { reason: artifactError.message }
    });
    return NextResponse.json({ error: "Unable to create import artifact." }, { status: 500 });
  }

  const { data: importJobRecord } = await supabase
    .from("import_jobs")
    .insert({
      user_id: user.id,
      source_artifact_id: artifactRecord.id,
      status: "processing"
    })
    .select("id, status")
    .single();

  const extractionInput = {
    ...parsed.data,
    content: parsed.data.type === "url" ? resolvedUrlMetadata?.rawText ?? parsed.data.content : parsed.data.content
  };

  let candidates;
  try {
    candidates = await extractPlacesWithGemini(extractionInput);
  } catch (error) {
    const message =
      error instanceof GeminiProviderError
        ? error.message
        : "Zylo could not analyze that import right now.";

    await supabase
      .from("source_artifacts")
      .update({ status: "failed", extracted_places: 0 })
      .eq("id", artifactRecord.id)
      .eq("user_id", user.id);

    await supabase
      .from("import_jobs")
      .update({ status: "failed", error_message: message })
      .eq("source_artifact_id", artifactRecord.id)
      .eq("user_id", user.id);

    return NextResponse.json(
      {
        error: message
      },
      { status: error instanceof GeminiProviderError ? error.statusCode : 503 }
    );
  }

  if (candidates.length === 0) {
    const noResultsMessage =
      parsed.data.type === "url"
        ? "No actionable places were extracted from that reel link. Paste the caption text directly."
        : "No actionable places were found in that import.";

    await supabase
      .from("source_artifacts")
      .update({ status: "failed", extracted_places: 0 })
      .eq("id", artifactRecord.id)
      .eq("user_id", user.id);

    await supabase
      .from("import_jobs")
      .update({ status: "failed", error_message: noResultsMessage })
      .eq("source_artifact_id", artifactRecord.id)
      .eq("user_id", user.id);

    return NextResponse.json({ error: noResultsMessage }, { status: 422 });
  }

  const firstCandidate = candidates[0];
  const verifiedPlace = firstCandidate
    ? await lookupPlaceSummary(
        `${firstCandidate.name}, ${firstCandidate.city}, ${firstCandidate.country}`
      )
    : null;
  const fallbackImage = firstCandidate
    ? await searchUnsplashImage(`${firstCandidate.name} ${firstCandidate.city} travel`)
    : null;

  const persistedPlaces = [];

  try {
    for (const candidate of candidates) {
      const verified = await lookupPlaceSummary(
        `${candidate.name}, ${candidate.city}, ${candidate.country}`
      );
      const destinationId = await upsertDestination(supabase, {
        userId: user.id,
        name: candidate.city,
        country: candidate.country
      });
      const place = await upsertPlace(supabase, {
        userId: user.id,
        destinationId,
        sourceArtifactId: artifactRecord.id,
        googlePlaceId: null,
        name: candidate.name,
        city: candidate.city,
        country: candidate.country,
        category: candidate.category,
        address: verified?.formattedAddress ?? "",
        description: candidate.description,
        latitude: verified?.location?.latitude ?? null,
        longitude: verified?.location?.longitude ?? null,
        tags: candidate.tags
      });
      persistedPlaces.push(place);
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Zylo could not save the extracted places.";

    await supabase
      .from("source_artifacts")
      .update({ status: "failed", extracted_places: 0 })
      .eq("id", artifactRecord.id)
      .eq("user_id", user.id);

    await supabase
      .from("import_jobs")
      .update({ status: "failed", error_message: message })
      .eq("source_artifact_id", artifactRecord.id)
      .eq("user_id", user.id);

    return NextResponse.json({ error: message }, { status: 500 });
  }

  if (candidates.length > 0) {
    await supabase
      .from("source_artifacts")
      .update({ status: "complete", extracted_places: candidates.length })
      .eq("id", artifactRecord.id)
      .eq("user_id", user.id);

    await supabase
      .from("import_jobs")
      .update({ status: "complete" })
      .eq("source_artifact_id", artifactRecord.id)
      .eq("user_id", user.id);
  }

  await recordAuditEvent({
    userId: user.id,
    eventType: "import",
    message: "Import processed",
    severity: "info",
    metadata: { ip, extractedPlaces: candidates.length }
  });

  return NextResponse.json(
    {
      job: {
        id: artifactRecord.id,
        type: artifactRecord.type,
        label: artifactRecord.label,
        status: candidates.length > 0 ? "complete" : artifactRecord.status,
        createdAt: artifactRecord.created_at,
        extractedPlaces: candidates.length
      },
      importJob: importJobRecord,
      statusUrl: `/api/imports/${artifactRecord.id}`,
      providerStatus: getProviderStatus(),
      extractionPreview: persistedPlaces.slice(0, 3),
      enrichmentPreview: verifiedPlace
        ? {
            name: verifiedPlace.displayName?.text ?? firstCandidate?.name,
            address: verifiedPlace.formattedAddress,
            coordinates: verifiedPlace.location,
            mapsUrl: verifiedPlace.googleMapsUri
          }
        : null,
      imagePreview: fallbackImage
    },
    { status: 201 }
  );
}
