import { NextResponse } from "next/server";

import { requireApiUser } from "@/lib/auth";
import { getClientIp } from "@/lib/request";
import { applyRateLimit } from "@/lib/security";
import { createTrip } from "@/lib/trip-creation";
import { parseWithSchema, tripSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const { supabase, user } = await requireApiUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  const parsed = parseWithSchema(tripSchema, payload);

  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.errors }, { status: 400 });
  }

  const ip = getClientIp(request);
  const limiter = applyRateLimit(`trips:${ip}:${user.id}`, 12, 60_000);
  if (!limiter.allowed) {
    return NextResponse.json({ error: "Too many trip requests." }, { status: 429 });
  }

  const result = await createTrip({
    supabase,
    userId: user.id,
    ip,
    payload: parsed.data
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ trip: result.trip }, { status: result.status });
}
