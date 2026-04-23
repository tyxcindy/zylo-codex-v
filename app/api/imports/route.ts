import { NextResponse } from "next/server";

import { requireApiUser } from "@/lib/auth";
import { recordAuditEvent } from "@/lib/audit";
import { queueImportSubmission } from "@/lib/import-processing";
import { getClientIp } from "@/lib/request";
import { applyRateLimit } from "@/lib/security";
import { importSchema, parseWithSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { supabase, user } = await requireApiUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  const parsed = parseWithSchema(importSchema, payload);

  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.errors }, { status: 400 });
  }

  const ip = getClientIp(request);
  const limiter = applyRateLimit(`imports:${ip}:${user.id}`, 10, 60_000);

  if (!limiter.allowed) {
    await recordAuditEvent({
      userId: user.id,
      eventType: "security",
      message: "Import rate limit triggered",
      severity: "warn",
      metadata: { ip }
    });
    return NextResponse.json(
      { error: "Too many import attempts. Try again shortly." },
      { status: 429 }
    );
  }

  const result = await queueImportSubmission({
    supabase,
    user,
    payload: parsed.data,
    ip
  });

  return NextResponse.json(result.body, { status: result.status });
}
