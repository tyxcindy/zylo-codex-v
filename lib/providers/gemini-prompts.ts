import { defaultLocale, type Locale } from "@/lib/i18n";

function formatReplyLocale(locale?: Locale) {
  return locale === "zh-CN" ? "Simplified Chinese" : "English";
}

export function buildPlaceExtractionPrompt(input: {
  type: "url" | "text" | "image";
  content: string;
  destinationHint?: string;
}) {
  return `
You are a travel intelligence extraction engine.
Return strict JSON only with shape { "places": ExtractedPlaceCandidate[] }.

Extract only specific, named, physically visitable places.
Allowed categories: restaurants, cafes, bars, hotels, activities, scenic spots, photo spots.
The source content may be in English, Simplified Chinese, or Traditional Chinese.

Rules:
- Ignore likes, comments, usernames, hashtags, and engagement counts.
- Ignore vague references that are not real visitable places.
- Prefer the business or venue name over generic area names.
- If the content names one concrete attraction, business, museum, hotel, landmark, market, viewpoint, or activity provider, include it.
- It is valid to return one place if that is all the content supports.
- If there are no actionable places, return { "places": [] }.
- Return the fields in concise English whenever possible.
- If the source is Chinese and a common English-facing or romanized venue name exists, use that as the name.
- If the original Chinese venue name would help the user recognize the place, append "Original Chinese name: <name>." to the description.

For each place include:
- name
- city
- country
- category
- description
- tags

Input type: ${input.type}
Destination hint: ${input.destinationHint ?? "none"}
Content:
${input.content}
`.trim();
}

export function buildPlaceTranslationPrompt(candidates: Array<{
  name: string;
  city: string;
  country: string;
  description: string;
  tags: string[];
}>) {
  return `
You normalize travel place candidates for an English-language product.
Return strict JSON only with shape { "places": [{ "index": number, "name": string, "city": string, "country": string, "description": string, "tags": string[] }] }.

Rules:
- Translate or romanize Simplified Chinese and Traditional Chinese into concise English.
- Prefer a commonly used English-facing or romanized venue name over a literal translation.
- Keep city and country in English.
- Keep descriptions short, useful, and English.
- Keep tags short and English.
- Do not invent facts or add places that are not in the input.
- Preserve the order using the provided index values.

Input:
${JSON.stringify(candidates.map((candidate, index) => ({ index, ...candidate })))}
`.trim();
}

export function buildConciergePrompt(input: {
  message: string;
  tripTitle?: string;
  tasteProfileSummary: string;
  imageHint?: string;
  replyLocale?: Locale;
}) {
  const locale = input.replyLocale ?? defaultLocale;

  return `
You are Zylo, a premium travel-planning assistant.
Be concise, practical, and itinerary-aware.
Reply in ${formatReplyLocale(locale)}.
Trip: ${input.tripTitle ?? "No active trip provided"}
Taste profile: ${input.tasteProfileSummary}
Image hint: ${input.imageHint ?? "none"}
User message: ${input.message}
Return JSON with shape { "reply": string }.
`.trim();
}
