import { NextResponse } from "next/server";

import { requireApiUser } from "@/lib/auth";
import { getClientIp } from "@/lib/request";
import { applyRateLimit } from "@/lib/security";
import { generateTripDraft } from "@/lib/trip-generation";
import { parseWithSchema, tripGenerateSchema } from "@/lib/validation";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { supabase, user } = await requireApiUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  const parsed = parseWithSchema(tripGenerateSchema, payload);

  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.errors }, { status: 400 });
  }

  const ip = getClientIp(request);
  const limiter = applyRateLimit(`trip-generate:${ip}:${user.id}`, 6, 60_000);
  if (!limiter.allowed) {
    return NextResponse.json({ error: "AI generation rate limit exceeded." }, { status: 429 });
  }

  const result = await generateTripDraft({
    supabase,
    userId: user.id,
    tripId: id,
    ip,
    payload: parsed.data
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json(
    {
      trip: result.trip,
      message: result.message
    },
    { status: result.status }
  );
}
