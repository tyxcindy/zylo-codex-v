import type { NextRequest } from "next/server";

type HeaderBag =
  | Headers
  | {
      get(name: string): string | null | undefined;
    };

export function getClientIp(source: NextRequest | Request | HeaderBag) {
  const headers =
    source instanceof Request
      ? source.headers
      : "headers" in source && source.headers instanceof Headers
        ? source.headers
        : source;

  const forwardedFor =
    headers.get("x-forwarded-for") ??
    headers.get("cf-connecting-ip") ??
    headers.get("x-real-ip");

  if (!forwardedFor) {
    return "unknown";
  }

  return forwardedFor.split(",")[0]?.trim() || "unknown";
}

export function getBaseUrl(headers: HeaderBag) {
  const forwardedProto = headers.get("x-forwarded-proto");
  const forwardedHost = headers.get("x-forwarded-host");
  const host = forwardedHost ?? headers.get("host");
  const protocol = forwardedProto ?? (host?.includes("localhost") ? "http" : "https");

  return host ? `${protocol}://${host}` : "http://127.0.0.1:3000";
}

export function getAppUrl(headers: HeaderBag) {
  const explicitUrl =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.APP_BASE_URL?.trim();

  if (explicitUrl) {
    return explicitUrl.replace(/\/$/, "");
  }

  const vercelProductionUrl =
    process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL?.trim() ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();

  if (vercelProductionUrl) {
    return `https://${vercelProductionUrl}`;
  }

  return getBaseUrl(headers);
}

export function safeRedirectPath(candidate: string | null | undefined, fallback: string) {
  if (!candidate) {
    return fallback;
  }

  if (!candidate.startsWith("/") || candidate.startsWith("//")) {
    return fallback;
  }

  return candidate;
}

export function maskEmail(email: string) {
  const [local, domain] = email.split("@");

  if (!local || !domain) {
    return "unknown";
  }

  return `${local.slice(0, 2)}***@${domain}`;
}
