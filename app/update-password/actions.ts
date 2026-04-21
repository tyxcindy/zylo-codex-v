"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";

import { recordAuditEvent } from "@/lib/audit";
import { getClientIp } from "@/lib/request";
import { applyRateLimit } from "@/lib/security";
import { createClient } from "@/lib/supabase/server";
import {
  parseWithSchema,
  passwordUpdateSchema
} from "@/lib/validation";

function withMessage(key: "error" | "message", value: string) {
  return `/update-password?${key}=${encodeURIComponent(value)}`;
}

export async function updatePasswordAction(formData: FormData) {
  const parsed = parseWithSchema(passwordUpdateSchema, {
    password: formData.get("password")
  });

  if (!parsed.success) {
    redirect(withMessage("error", parsed.errors[0] ?? "Invalid password."));
  }

  try {
    const headerBag = await headers();
    const ip = getClientIp(headerBag);
    const limiter = applyRateLimit(`auth:update-password:${ip}`, 5, 15 * 60_000);

    if (!limiter.allowed) {
      redirect(withMessage("error", "Too many attempts. Try again later."));
    }

    const supabase = await createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      redirect(withMessage("error", "Your recovery session has expired. Request a new reset link."));
    }

    const { error } = await supabase.auth.updateUser({ password: parsed.data.password });

    if (error) {
      await recordAuditEvent({
        userId: user.id,
        eventType: "auth",
        message: "Password update failed",
        severity: "warn",
        metadata: { ip, reason: error.message }
      });
      redirect(withMessage("error", error.message || "Unable to update your password."));
    }

    await recordAuditEvent({
      userId: user.id,
      eventType: "auth",
      message: "Password updated",
      severity: "info",
      metadata: { ip }
    });

    redirect("/sign-in?message=Password updated. Sign in with your new password.");
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    console.error("updatePasswordAction failed", error);
    redirect(withMessage("error", error instanceof Error ? error.message : "Unable to update your password."));
  }
}
