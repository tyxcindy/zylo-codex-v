import { recordAuditEvent } from "@/lib/audit";
import { defaultLocale, type Locale } from "@/lib/i18n";
import { askGemini } from "@/lib/providers/gemini";
import type { chatSchema } from "@/lib/validation";

type SupabaseLike = Awaited<ReturnType<typeof import("@/lib/supabase/server").createClient>>;
type ChatInput = import("zod").infer<typeof chatSchema>;

type TripContext = {
  id: string;
  title: string;
} | null;

type TasteProfileContext = {
  priorities?: string[] | null;
  favorite_cuisines?: string[] | null;
  avoids?: string[] | null;
} | null;

export function formatTasteProfileSummary(
  profile: TasteProfileContext,
  locale: Locale = defaultLocale
) {
  const priorities = (profile?.priorities ?? []).join(", ");
  const favoriteCuisines = (profile?.favorite_cuisines ?? []).join(", ");
  const avoids = (profile?.avoids ?? []).join(", ");

  if (locale === "zh-CN") {
    return `${priorities} | 喜欢的料理: ${favoriteCuisines} | 避开: ${avoids}`;
  }

  return `${priorities} | favorite cuisines: ${favoriteCuisines} | avoids: ${avoids}`;
}

export function buildFallbackConciergeReply(input: {
  tripTitle?: string;
  favoriteCuisines?: string[] | null;
  locale?: Locale;
}) {
  if (input.locale === "zh-CN") {
    return `Zylo 会结合${input.tripTitle ? input.tripTitle : "你已保存的地点库"}和你的口味偏好（${(input.favoriteCuisines ?? []).join(", ")}）给出更贴合路线的推荐。`;
  }

  return `Zylo would answer with route-aware recommendations using ${
    input.tripTitle ? input.tripTitle : "your saved library"
  } and your taste profile (${(input.favoriteCuisines ?? []).join(", ")}).`;
}

export async function loadChatTripContext(input: {
  supabase: SupabaseLike;
  userId: string;
  tripId?: string;
}): Promise<TripContext> {
  if (!input.tripId) {
    return null;
  }

  const result = await input.supabase
    .from("trips")
    .select("id, title")
    .eq("id", input.tripId)
    .eq("user_id", input.userId)
    .maybeSingle();

  return result.data ?? null;
}

export async function loadTasteProfileContext(input: {
  supabase: SupabaseLike;
  userId: string;
}): Promise<TasteProfileContext> {
  const result = await input.supabase
    .from("taste_profiles")
    .select("priorities, favorite_cuisines, avoids")
    .eq("user_id", input.userId)
    .maybeSingle();

  return result.data ?? null;
}

export async function generateAiConciergeReply(input: {
  supabase: SupabaseLike;
  userId: string;
  ip: string;
  payload: ChatInput;
}) {
  const trip = await loadChatTripContext({
    supabase: input.supabase,
    userId: input.userId,
    tripId: input.payload.tripId
  });
  const profile = await loadTasteProfileContext({
    supabase: input.supabase,
    userId: input.userId
  });
  const locale = input.payload.locale ?? defaultLocale;

  const liveReply = await askGemini({
    message: input.payload.message,
    tripTitle: trip?.title,
    tasteProfileSummary: formatTasteProfileSummary(profile, locale),
    imageHint: input.payload.imageHint,
    replyLocale: locale
  });

  await recordAuditEvent({
    userId: input.userId,
    eventType: "ai",
    message: "AI concierge response generated",
    severity: "info",
    metadata: { ip: input.ip, tripId: trip?.id ?? null }
  });

  return {
    reply:
      liveReply ??
      buildFallbackConciergeReply({
        tripTitle: trip?.title,
        favoriteCuisines: profile?.favorite_cuisines,
        locale
      }),
    imageHintHandled: Boolean(input.payload.imageHint)
  };
}
