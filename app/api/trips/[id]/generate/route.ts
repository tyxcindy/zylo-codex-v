import { NextResponse } from "next/server";

import { requireApiUser } from "@/lib/auth";
import { recordAuditEvent } from "@/lib/audit";
import { getClientIp } from "@/lib/request";
import { applyRateLimit } from "@/lib/security";
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

  const { data: trip } = await supabase
    .from("trips")
    .select("id, destination_id, title, status")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!trip) {
    return NextResponse.json({ error: "Trip not found." }, { status: 404 });
  }

  const { data: existingDays } = await supabase
    .from("trip_days")
    .select("id")
    .eq("trip_id", trip.id)
    .eq("user_id", user.id)
    .limit(1);

  if (!existingDays?.length) {
    await supabase.from("trip_days").insert({
      user_id: user.id,
      trip_id: trip.id,
      title: "Generated day 1",
      sort_order: 1
    });
  }

  await supabase
    .from("trips")
    .update({ status: "ready" })
    .eq("id", trip.id)
    .eq("user_id", user.id);

  await recordAuditEvent({
    userId: user.id,
    eventType: "ai",
    message: "Trip generation requested",
    severity: "info",
    metadata: { ip, tripId: trip.id }
  });

  return NextResponse.json({
    trip: {
      ...trip,
      status: "ready"
    },
    message:
      "Trip draft generated. This beta route creates a first itinerary day and marks the trip ready."
  });
}
