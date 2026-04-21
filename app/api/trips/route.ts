import { NextResponse } from "next/server";

import { requireApiUser } from "@/lib/auth";
import { recordAuditEvent } from "@/lib/audit";
import { getClientIp } from "@/lib/request";
import { applyRateLimit } from "@/lib/security";
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

  const { data: destination } = await supabase
    .from("destinations")
    .select("id")
    .eq("id", parsed.data.destinationId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!destination) {
    return NextResponse.json({ error: "Destination not found." }, { status: 404 });
  }

  const { data: trip, error } = await supabase
    .from("trips")
    .insert({
      user_id: user.id,
      destination_id: parsed.data.destinationId,
      title: parsed.data.title,
      status: "draft",
      vibe: parsed.data.vibe,
      travelers: parsed.data.travelers
    })
    .select("id, destination_id, title, status, vibe, travelers")
    .single();

  if (error) {
    return NextResponse.json({ error: "Unable to create trip." }, { status: 500 });
  }

  await recordAuditEvent({
    userId: user.id,
    eventType: "api",
    message: "Trip created",
    severity: "info",
    metadata: { ip, tripId: trip.id }
  });

  return NextResponse.json({ trip }, { status: 201 });
}
