import { NextResponse } from "next/server";

import { requireApiUser } from "@/lib/auth";
import { recordAuditEvent } from "@/lib/audit";
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

  const updates: Record<string, boolean> = {};
  if (typeof parsed.data.isVisited === "boolean") updates.is_visited = parsed.data.isVisited;
  if (typeof parsed.data.isInTrip === "boolean") updates.is_in_trip = parsed.data.isInTrip;

  const { data: place, error } = await supabase
    .from("places")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id, name, city, country, category, address, description, latitude, longitude, times_seen, source_count, is_visited, is_in_trip, tags")
    .single();

  if (error || !place) {
    return NextResponse.json({ error: "Place not found." }, { status: 404 });
  }

  await recordAuditEvent({
    userId: user.id,
    eventType: "api",
    message: "Place save state updated",
    severity: "info",
    metadata: { ip, placeId: id }
  });

  return NextResponse.json({ place });
}
