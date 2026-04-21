import { getServerEnv } from "@/lib/env";

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

type GeminiTextPart = {
  text: string;
};

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: GeminiTextPart[];
    };
  }>;
  error?: {
    code?: number;
    message?: string;
    status?: string;
  };
};

export class GeminiProviderError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 500) {
    super(message);
    this.name = "GeminiProviderError";
    this.statusCode = statusCode;
  }
}

function getGeminiEndpoint() {
  const { geminiApiKey } = getServerEnv();

  if (!geminiApiKey) {
    return null;
  }

  return `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`;
}

async function callGemini(prompt: string) {
  const endpoint = getGeminiEndpoint();

  if (!endpoint) {
    return null;
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        temperature: 0.3,
        responseMimeType: "application/json"
      }
    }),
    cache: "no-store"
  });

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => null)) as GeminiResponse | null;
    throw new GeminiProviderError(
      errorBody?.error?.message ?? `Gemini request failed with status ${response.status}`,
      response.status
    );
  }

  const data = (await response.json()) as GeminiResponse;
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? null;

  if (!text) {
    throw new GeminiProviderError("Gemini returned no structured extraction output.", 502);
  }

  return text;
}

export async function extractPlacesWithGemini(input: {
  type: "url" | "text" | "image";
  content: string;
  destinationHint?: string;
}) {
  const raw = await callGemini(`
You are a travel intelligence extraction engine.
Return strict JSON only with shape { "places": ExtractedPlaceCandidate[] }.

Extract only specific, named, physically visitable places.
Allowed categories: restaurants, cafes, bars, hotels, activities, scenic spots, photo spots.

Rules:
- Ignore likes, comments, usernames, hashtags, and engagement counts.
- Ignore vague references that are not real visitable places.
- Prefer the business or venue name over generic area names.
- If the content names one concrete attraction, business, museum, hotel, landmark, market, viewpoint, or activity provider, include it.
- It is valid to return one place if that is all the content supports.
- If there are no actionable places, return { "places": [] }.

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
`);

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
}) {
  try {
    const raw = await callGemini(`
You are Zylo, a premium travel-planning assistant.
Be concise, practical, and itinerary-aware.
Trip: ${input.tripTitle ?? "No active trip provided"}
Taste profile: ${input.tasteProfileSummary}
Image hint: ${input.imageHint ?? "none"}
User message: ${input.message}
Return JSON with shape { "reply": string }.
`);

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as { reply?: string };
    return parsed.reply ?? null;
  } catch {
    return null;
  }
}
