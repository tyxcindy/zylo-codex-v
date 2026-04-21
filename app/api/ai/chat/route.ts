import { NextResponse } from "next/server";

import { requireApiUser } from "@/lib/auth";
import { recordAuditEvent } from "@/lib/audit";
import { askGemini } from "@/lib/providers/gemini";
import { getClientIp } from "@/lib/request";
import { applyRateLimit } from "@/lib/security";
import { chatSchema, parseWithSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const { supabase, user } = await requireApiUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  const parsed = parseWithSchema(chatSchema, payload);

  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.errors }, { status: 400 });
  }

  const ip = getClientIp(request);
  const limiter = applyRateLimit(`ai-chat:${ip}:${user.id}`, 20, 60_000);
  if (!limiter.allowed) {
    return NextResponse.json({ error: "AI request limit reached." }, { status: 429 });
  }

  const trip = parsed.data.tripId
    ? await supabase
        .from("trips")
        .select("id, title")
        .eq("id", parsed.data.tripId)
        .eq("user_id", user.id)
        .maybeSingle()
        .then((result) => result.data)
    : undefined;
  const { data: profile } = await supabase
    .from("taste_profiles")
    .select("priorities, favorite_cuisines, avoids")
    .eq("user_id", user.id)
    .maybeSingle();
  const liveReply = await askGemini({
    message: parsed.data.message,
    tripTitle: trip?.title,
    tasteProfileSummary: `${(profile?.priorities ?? []).join(", ")} | favorite cuisines: ${(profile?.favorite_cuisines ?? []).join(", ")} | avoids: ${(profile?.avoids ?? []).join(", ")}`,
    imageHint: parsed.data.imageHint
  });

  await recordAuditEvent({
    userId: user.id,
    eventType: "ai",
    message: "AI concierge response generated",
    severity: "info",
    metadata: { ip, tripId: trip?.id ?? null }
  });

  return NextResponse.json({
    reply:
      liveReply ??
      `Zylo would answer with route-aware recommendations using ${
        trip ? trip.title : "your saved library"
      } and your taste profile (${(profile?.favorite_cuisines ?? []).join(", ")}).`,
    imageHintHandled: Boolean(parsed.data.imageHint)
  });
}
