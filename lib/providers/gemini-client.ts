import { getServerEnv } from "@/lib/env";

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

export function getGeminiEndpoint() {
  const { geminiApiKey } = getServerEnv();

  if (!geminiApiKey) {
    return null;
  }

  return `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`;
}

export async function callGemini(prompt: string) {
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
