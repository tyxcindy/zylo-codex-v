import { NextResponse } from "next/server";

import { recordAuditEvent } from "@/lib/audit";
import { signUpWithEmail } from "@/lib/auth-sign-up";
import { getAppUrl, getClientIp, maskEmail } from "@/lib/request";
import { applyRateLimit } from "@/lib/security";
import { authSignUpSchema, parseWithSchema } from "@/lib/validation";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = parseWithSchema(authSignUpSchema, body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.errors[0] ?? "Invalid request." },
      { status: 400 }
    );
  }

  const ip = getClientIp(request);
  const limiter = applyRateLimit(`auth:sign-up:${ip}:${parsed.data.email}`, 3, 15 * 60_000);

  if (!limiter.allowed) {
    await recordAuditEvent({
      eventType: "security",
      message: "Signup rate limit triggered",
      severity: "warn",
      metadata: { ip, email: maskEmail(parsed.data.email) }
    });

    return NextResponse.json(
      { error: "Too many sign-up attempts. Try again later." },
      { status: 429 }
    );
  }

  try {
    const result = await signUpWithEmail({
      appUrl: getAppUrl(request.headers),
      displayName: parsed.data.displayName,
      email: parsed.data.email,
      password: parsed.data.password
    });

    if (!result.ok) {
      await recordAuditEvent({
        eventType: "auth",
        message: "Failed sign-up attempt",
        severity: "warn",
        metadata: {
          ip,
          email: maskEmail(parsed.data.email),
          reason: result.message
        }
      });

      return NextResponse.json({ error: result.message }, { status: result.status });
    }

    await recordAuditEvent({
      userId: result.userId,
      eventType: "auth",
      message: "User signed up",
      severity: "info",
      metadata: { ip, email: maskEmail(parsed.data.email) }
    });

    return NextResponse.json({ message: result.message }, { status: result.status });
  } catch (error) {
    console.error("POST /api/auth/sign-up failed", error);

    return NextResponse.json({ error: "Unable to create account." }, { status: 500 });
  }
}
