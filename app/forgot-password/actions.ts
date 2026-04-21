"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";

import { recordAuditEvent } from "@/lib/audit";
import { getAppUrl, getClientIp, maskEmail } from "@/lib/request";
import { applyRateLimit } from "@/lib/security";
import { createClient } from "@/lib/supabase/server";
import {
  parseWithSchema,
  passwordResetRequestSchema
} from "@/lib/validation";

function withMessage(key: "error" | "message", value: string) {
  return `/forgot-password?${key}=${encodeURIComponent(value)}`;
}

export async function requestPasswordResetAction(formData: FormData) {
  const parsed = parseWithSchema(passwordResetRequestSchema, {
    email: formData.get("email")
  });

  if (!parsed.success) {
    redirect(withMessage("error", parsed.errors[0] ?? "Invalid email address."));
  }

  try {
    const headerBag = await headers();
    const ip = getClientIp(headerBag);
    const limiter = applyRateLimit(
      `auth:password-reset:${ip}:${parsed.data.email}`,
      3,
      15 * 60_000
    );

    if (!limiter.allowed) {
      await recordAuditEvent({
        eventType: "security",
        message: "Password reset rate limit triggered",
        severity: "warn",
        metadata: { ip, email: maskEmail(parsed.data.email) }
      });
      redirect(withMessage("error", "Too many reset requests. Try again later."));
    }

    const supabase = await createClient();
    const appUrl = getAppUrl(headerBag);

    await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${appUrl}/auth/confirm?next=/update-password`
    });

    await recordAuditEvent({
      eventType: "auth",
      message: "Password reset requested",
      severity: "info",
      metadata: { ip, email: maskEmail(parsed.data.email) }
    });

    redirect(
      withMessage(
        "message",
        "If that email exists, a password reset link has been sent."
      )
    );
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    console.error("requestPasswordResetAction failed", error);
    redirect(withMessage("error", error instanceof Error ? error.message : "Unable to request a reset link."));
  }
}
