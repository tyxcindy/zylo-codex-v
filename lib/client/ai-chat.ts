import type { Locale } from "@/lib/i18n";

import { postJson } from "@/lib/client/api";

export type AiChatRequest = {
  message: string;
  imageHint?: string;
  tripId?: string;
  locale?: Locale;
};

export type AiChatResponse = {
  reply: string;
  imageHintHandled: boolean;
};

export function sendAiChatRequest(payload: AiChatRequest) {
  return postJson<AiChatResponse>("/api/ai/chat", payload);
}
