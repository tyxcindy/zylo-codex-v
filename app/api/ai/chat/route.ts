import { NextResponse } from "next/server";

import { generateAiConciergeReply } from "@/lib/ai-concierge";
import { requireApiUser } from "@/lib/auth";
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

  const result = await generateAiConciergeReply({
    supabase,
    userId: user.id,
    ip,
    payload: parsed.data
  });

  return NextResponse.json(result);
}
