import { getServerEnv } from "@/lib/env";

export type ProviderStatus = {
  gemini: "configured" | "missing";
  googleMaps: "configured" | "missing";
  unsplash: "configured" | "missing";
  supabase: "configured" | "missing";
  resend: "configured" | "missing";
};

export function getProviderStatus(env = getServerEnv()): ProviderStatus {
  return {
    gemini: env.geminiApiKey ? "configured" : "missing",
    googleMaps: env.googleMapsApiKey ? "configured" : "missing",
    unsplash: env.unsplashAccessKey && env.unsplashSecretKey ? "configured" : "missing",
    supabase:
      env.supabaseUrl && env.supabasePublicKey && env.supabaseServiceRoleKey
        ? "configured"
        : "missing",
    resend: env.resendApiKey ? "configured" : "missing"
  };
}
