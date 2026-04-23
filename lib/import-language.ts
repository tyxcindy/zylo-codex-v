import { translateCandidatesToEnglish, type ExtractedPlaceCandidate } from "@/lib/providers/gemini";
import type { PipelineCandidate, PipelineStages } from "@/lib/import-pipeline-types";

const hanPattern = /[\u3400-\u9FFF]/u;

export function containsChineseCharacters(input: string | null | undefined) {
  return Boolean(input && hanPattern.test(input));
}

function shouldNormalizeCandidate(candidate: PipelineCandidate) {
  return [candidate.name, candidate.city, candidate.country, candidate.description, ...candidate.tags].some(
    (value) => containsChineseCharacters(value)
  );
}

export function appendOriginalChineseName(input: {
  description: string;
  translatedName: string;
  originalName: string;
}) {
  const originalName = input.originalName.trim();
  const note = `Original Chinese name: ${originalName}.`;

  if (!containsChineseCharacters(originalName) || input.translatedName.trim() === originalName) {
    return input.description.trim();
  }

  if (input.description.includes(note)) {
    return input.description.trim();
  }

  return input.description.trim() ? `${input.description.trim()} ${note}` : note;
}

function fallbackNormalizeCandidate(candidate: PipelineCandidate) {
  if (!containsChineseCharacters(candidate.name)) {
    return candidate;
  }

  return {
    ...candidate,
    description: appendOriginalChineseName({
      description: candidate.description,
      translatedName: candidate.name,
      originalName: candidate.name
    })
  };
}

function mergeNormalizedCandidate(
  original: PipelineCandidate,
  translated: Partial<ExtractedPlaceCandidate> | undefined
) {
  if (!translated) {
    return fallbackNormalizeCandidate(original);
  }

  const translatedName = translated.name?.trim() || original.name;

  return {
    ...original,
    name: translatedName,
    city: translated.city?.trim() || original.city,
    country: translated.country?.trim() || original.country,
    description: appendOriginalChineseName({
      description: translated.description?.trim() || original.description,
      translatedName,
      originalName: original.name
    }),
    tags: translated.tags?.length ? translated.tags : original.tags
  };
}

export async function normalizeCandidatesForEnglish(input: {
  candidates: PipelineCandidate[];
  diagnostics: string[];
  stages: PipelineStages;
}) {
  const targets = input.candidates
    .map((candidate, index) => ({ candidate, index }))
    .filter(({ candidate }) => shouldNormalizeCandidate(candidate));

  if (!targets.length) {
    input.stages.languageNormalization = {
      status: "skipped",
      detail: "All verified candidates were already English-facing."
    };
    return input.candidates;
  }

  try {
    const translated = await translateCandidatesToEnglish(
      targets.map(({ candidate }) => ({
        name: candidate.name,
        city: candidate.city,
        country: candidate.country,
        category: candidate.category,
        description: candidate.description,
        tags: candidate.tags
      }))
    );

    const translatedByIndex = new Map(translated.map((candidate) => [candidate.index, candidate]));
    const normalized = input.candidates.map((candidate, candidateIndex) => {
      const targetIndex = targets.findIndex((entry) => entry.index === candidateIndex);

      if (targetIndex === -1) {
        return candidate;
      }

      return mergeNormalizedCandidate(candidate, translatedByIndex.get(targetIndex));
    });

    input.stages.languageNormalization = {
      status: "complete",
      detail: `Normalized ${targets.length} candidate name(s) for English presentation.`
    };

    return normalized;
  } catch (error) {
    input.diagnostics.push(
      error instanceof Error ? error.message : "Language normalization failed."
    );
    input.stages.languageNormalization = {
      status: "failed",
      detail: "Language normalization failed. Original verified names were kept."
    };

    return input.candidates.map(fallbackNormalizeCandidate);
  }
}
