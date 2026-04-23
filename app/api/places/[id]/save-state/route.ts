import { NextResponse } from "next/server";

import { requireApiUser } from "@/lib/auth";
import { updatePlaceSaveState } from "@/lib/place-save-state";
import { getClientIp } from "@/lib/request";
import { applyRateLimit } from "@/lib/security";
import { parseWithSchema, saveStateSchema } from "@/lib/validation";

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
  const parsed = parseWithSchema(saveStateSchema, payload);

  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.errors }, { status: 400 });
  }

  const ip = getClientIp(request);
  const limiter = applyRateLimit(`place-state:${ip}:${user.id}`, 30, 60_000);
  if (!limiter.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded." }, { status: 429 });
  }

  const result = await updatePlaceSaveState({
    supabase,
    userId: user.id,
    placeId: id,
    ip,
    isVisited: parsed.data.isVisited,
    isInTrip: parsed.data.isInTrip
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ place: result.place });
}
