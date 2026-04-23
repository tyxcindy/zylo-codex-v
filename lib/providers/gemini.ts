import type { Locale } from "@/lib/i18n";

import { callGemini, GeminiProviderError } from "@/lib/providers/gemini-client";
import {
  buildConciergePrompt,
  buildPlaceExtractionPrompt,
  buildPlaceTranslationPrompt
} from "@/lib/providers/gemini-prompts";

export { GeminiProviderError } from "@/lib/providers/gemini-client";

export type ExtractedPlaceCandidate = {
  name: string;
  city: string;
  country: string;
  category:
    | "restaurants"
    | "cafes"
    | "bars"
    | "hotels"
    | "activities"
    | "scenic spots"
    | "photo spots";
  description: string;
  tags: string[];
};

export async function extractPlacesWithGemini(input: {
  type: "url" | "text" | "image";
  content: string;
  destinationHint?: string;
}) {
  const raw = await callGemini(buildPlaceExtractionPrompt(input));

  if (!raw) {
    throw new GeminiProviderError("Gemini is not configured for this environment.", 503);
  }

  const parsed = JSON.parse(raw) as { places?: ExtractedPlaceCandidate[] };
  return parsed.places ?? [];
}

export async function askGemini(input: {
  message: string;
  tripTitle?: string;
  tasteProfileSummary: string;
  imageHint?: string;
  replyLocale?: Locale;
}) {
  try {
    const raw = await callGemini(buildConciergePrompt(input));

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as { reply?: string };
    return parsed.reply ?? null;
  } catch {
    return null;
  }
}

export async function translateCandidatesToEnglish(
  candidates: ExtractedPlaceCandidate[]
): Promise<Array<ExtractedPlaceCandidate & { index: number }>> {
  const raw = await callGemini(buildPlaceTranslationPrompt(candidates));

  if (!raw) {
    throw new GeminiProviderError("Gemini is not configured for language normalization.", 503);
  }

  const parsed = JSON.parse(raw) as {
    places?: Array<ExtractedPlaceCandidate & { index: number }>;
  };

  return parsed.places ?? [];
}
