"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";

import { recordAuditEvent } from "@/lib/audit";
import { signUpWithEmail, SIGN_UP_SUCCESS_MESSAGE } from "@/lib/auth-sign-up";
import { getAppUrl, getBaseUrl, getClientIp, maskEmail, safeRedirectPath } from "@/lib/request";
import { applyRateLimit } from "@/lib/security";
import { createClient } from "@/lib/supabase/server";
import {
  authSignInSchema,
  authSignUpSchema,
  parseWithSchema
} from "@/lib/validation";

function encodeMessage(pathname: string, key: "error" | "message", value: string) {
  return `${pathname}?${key}=${encodeURIComponent(value)}`;
}

function getAuthErrorMessage(error: unknown, mode: "sign-in" | "sign-up") {
  const message = error instanceof Error ? error.message : "";
  const normalized = message.toLowerCase();

  if (normalized.includes("email not confirmed")) {
    return "Check your email and verify your address before signing in.";
  }

  if (
    normalized.includes("redirect") &&
    (normalized.includes("allow") || normalized.includes("invalid"))
  ) {
    return "Auth redirect URL is not allowed for this deployment. Add this Zylo URL to Supabase Auth redirect URLs or set NEXT_PUBLIC_APP_URL.";
  }

  if (mode === "sign-in") {
    return "Invalid email or password.";
  }

  return message || "Unable to create account.";
}

export async function signInAction(formData: FormData) {
  const parsed = parseWithSchema(authSignInSchema, {
    email: formData.get("email"),
    password: formData.get("password")
  });

  if (!parsed.success) {
    redirect(encodeMessage("/sign-in", "error", parsed.errors[0] ?? "Invalid request."));
  }

  try {
    const headerBag = await headers();
    const ip = getClientIp(headerBag);
    const limiter = applyRateLimit(
      `auth:sign-in:${ip}:${parsed.data.email}`,
      5,
      15 * 60_000
    );

    if (!limiter.allowed) {
      await recordAuditEvent({
        eventType: "security",
        message: "Login rate limit triggered",
        severity: "warn",
        metadata: { ip, email: maskEmail(parsed.data.email) }
      });
      redirect(encodeMessage("/sign-in", "error", "Too many sign-in attempts. Try again later."));
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword(parsed.data);

    if (error || !data.user) {
      await recordAuditEvent({
        eventType: "auth",
        message: "Failed sign-in attempt",
        severity: "warn",
        metadata: { ip, email: maskEmail(parsed.data.email), reason: error?.message }
      });
      redirect(
        encodeMessage(
          "/sign-in",
          "error",
          getAuthErrorMessage(error ?? new Error("Invalid email or password."), "sign-in")
        )
      );
    }

    await recordAuditEvent({
      userId: data.user.id,
      eventType: "auth",
      message: "User signed in",
      severity: "info",
      metadata: { ip }
    });

    const next = safeRedirectPath(String(formData.get("next") ?? ""), "/dashboard");
    redirect(next);
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    console.error("signInAction failed", error);
    redirect(encodeMessage("/sign-in", "error", getAuthErrorMessage(error, "sign-in")));
  }
}

export async function signUpAction(formData: FormData) {
  const parsed = parseWithSchema(authSignUpSchema, {
    email: formData.get("email"),
    password: formData.get("password"),
    displayName: formData.get("displayName")
  });

  if (!parsed.success) {
    redirect(encodeMessage("/sign-in", "error", parsed.errors[0] ?? "Invalid request."));
  }

  try {
    const headerBag = await headers();
    const ip = getClientIp(headerBag);
    const limiter = applyRateLimit(
      `auth:sign-up:${ip}:${parsed.data.email}`,
      3,
      15 * 60_000
    );

    if (!limiter.allowed) {
      await recordAuditEvent({
        eventType: "security",
        message: "Signup rate limit triggered",
        severity: "warn",
        metadata: { ip, email: maskEmail(parsed.data.email) }
      });
      redirect(encodeMessage("/sign-in", "error", "Too many sign-up attempts. Try again later."));
    }

    const appUrl = getAppUrl(headerBag);
    const result = await signUpWithEmail({
      appUrl,
      displayName: parsed.data.displayName,
      email: parsed.data.email,
      password: parsed.data.password
    });

    if (!result.ok) {
      await recordAuditEvent({
        eventType: "auth",
        message: "Failed sign-up attempt",
        severity: "warn",
        metadata: { ip, email: maskEmail(parsed.data.email), reason: result.message }
      });
      redirect(encodeMessage("/sign-in", "error", result.message));
    }

    await recordAuditEvent({
      userId: result.userId,
      eventType: "auth",
      message: "User signed up",
      severity: "info",
      metadata: { ip, email: maskEmail(parsed.data.email) }
    });

    redirect(encodeMessage("/sign-in", "message", SIGN_UP_SUCCESS_MESSAGE));
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    console.error("signUpAction failed", error);
    redirect(encodeMessage("/sign-in", "error", getAuthErrorMessage(error, "sign-up")));
  }
}
