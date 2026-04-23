import { upsertDestination, upsertPlace } from "@/lib/database";
import { resolvePlaceImageUrl } from "@/lib/place-media";
import { normalizeSavedPlace } from "@/lib/place-quality";
import { searchUnsplashImage } from "@/lib/providers/unsplash";
import type { PipelineCandidate } from "@/lib/import-pipeline-types";

type SupabaseLike = Awaited<ReturnType<typeof import("@/lib/supabase/server").createClient>>;

export async function persistImportCandidates(input: {
  supabase: SupabaseLike;
  userId: string;
  artifactId: string;
  candidates: PipelineCandidate[];
}) {
  const persistedPlaces = [];
  const failures: Array<{ candidateName: string; error: string }> = [];

  for (const candidate of input.candidates) {
    try {
      const normalizedCandidate = normalizeSavedPlace(candidate);

      if (!normalizedCandidate) {
        failures.push({
          candidateName: candidate.name,
          error: "Rejected as a generic or malformed place candidate."
        });
        continue;
      }

      if (!normalizedCandidate.city.trim() || !normalizedCandidate.country.trim()) {
        failures.push({
          candidateName: candidate.name,
          error: "Rejected candidate with incomplete city or country context."
        });
        continue;
      }

      const imageResult = await searchUnsplashImage(
        `${normalizedCandidate.name} ${normalizedCandidate.city} ${normalizedCandidate.country} travel`
      );
      const destinationId = await upsertDestination(input.supabase, {
        userId: input.userId,
        name: normalizedCandidate.city,
        country: normalizedCandidate.country
      });
      const place = await upsertPlace(input.supabase, {
        userId: input.userId,
        destinationId,
        sourceArtifactId: input.artifactId,
        googlePlaceId: null,
        name: normalizedCandidate.name,
        city: normalizedCandidate.city,
        country: normalizedCandidate.country,
        category: normalizedCandidate.category,
        address: normalizedCandidate.address ?? "",
        description: normalizedCandidate.description,
        latitude: normalizedCandidate.latitude ?? null,
        longitude: normalizedCandidate.longitude ?? null,
        imageUrl: imageResult?.imageUrl ?? null,
        tags: normalizedCandidate.tags
      });
      persistedPlaces.push({
        ...place,
        image_url:
          place.image_url ??
          imageResult?.imageUrl ??
          resolvePlaceImageUrl({
            category: normalizedCandidate.category,
            imageUrl: undefined
          })
      });
    } catch (error) {
      failures.push({
        candidateName: candidate.name,
        error:
          error instanceof Error
            ? error.message
            : typeof error === "string"
              ? error
              : JSON.stringify(error)
      });
    }
  }

  return {
    persistedPlaces,
    failures
  };
}

export async function buildImportImagePreview(candidates: PipelineCandidate[]) {
  const firstCandidate = candidates[0];
  if (!firstCandidate) {
    return null;
  }

  return searchUnsplashImage(`${firstCandidate.name} ${firstCandidate.city} travel`);
}

export function buildImportEnrichmentPreview(candidate: PipelineCandidate | undefined) {
  if (!candidate) {
    return null;
  }

  return {
    name: candidate.name,
    address: candidate.address ?? "",
    coordinates:
      candidate.latitude != null && candidate.longitude != null
        ? {
            latitude: candidate.latitude,
            longitude: candidate.longitude
          }
        : null,
    mapsUrl: candidate.mapsUrl ?? null
  };
}
