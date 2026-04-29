import { recordAuditEvent } from "@/lib/audit";
import { resolveHomeCityOption } from "@/lib/home-city-options";
import { createAdminClient } from "@/lib/supabase/admin";

type SupabaseLike = Awaited<ReturnType<typeof import("@/lib/supabase/server").createClient>>;

export type SaveProfileSettingsResult =
  | {
      ok: true;
      status: 200;
      profile: {
        displayName: string;
        homeCity: string;
      };
    }
  | {
      ok: false;
      status: 400 | 500;
      error: string;
    };

export function normalizeProfileField(value: string) {
  return value.trim().replace(/\s{2,}/g, " ");
}

const CHANGE_WINDOW_DAYS = 14;
const MAX_CHANGES_PER_FIELD = 3;

async function countRecentProfileFieldChanges(userId: string, field: "displayName" | "homeCity") {
  const admin = createAdminClient();

  if (!admin) {
    return 0;
  }

  const since = new Date(Date.now() - CHANGE_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const { data } = await admin
    .from("audit_events")
    .select("metadata")
    .eq("user_id", userId)
    .eq("event_type", "api")
    .eq("message", "Profile setting updated")
    .gte("created_at", since);

  return (data ?? []).filter((row) => {
    const metadata = row.metadata as Record<string, unknown> | null;
    return metadata?.field === field;
  }).length;
}

export async function saveProfileSettings(input: {
  supabase: SupabaseLike;
  userId: string;
  email?: string | null;
  displayName: string;
  homeCity: string;
}): Promise<SaveProfileSettingsResult> {
  const displayName = normalizeProfileField(input.displayName);
  const homeCityOption = resolveHomeCityOption(input.homeCity);
  const homeCity = homeCityOption?.value ?? "";

  if (!displayName || !homeCity) {
    return {
      ok: false,
      status: 400,
      error: "Choose a home city from the list and keep both fields filled in."
    };
  }

  const { data: currentProfile, error: currentProfileError } = await input.supabase
    .from("profiles")
    .select("display_name, home_city")
    .eq("user_id", input.userId)
    .maybeSingle();

  if (currentProfileError) {
    return {
      ok: false,
      status: 500,
      error: "Could not load current profile settings."
    };
  }

  const currentDisplayName = normalizeProfileField(currentProfile?.display_name ?? "");
  const currentHomeCity =
    resolveHomeCityOption(currentProfile?.home_city ?? "")?.value ??
    normalizeProfileField(currentProfile?.home_city ?? "");
  const displayNameChanged = currentDisplayName !== displayName;
  const homeCityChanged = currentHomeCity !== homeCity;

  if (displayNameChanged) {
    const recentDisplayNameChanges = await countRecentProfileFieldChanges(input.userId, "displayName");

    if (recentDisplayNameChanges >= MAX_CHANGES_PER_FIELD) {
      return {
        ok: false,
        status: 400,
        error: "Display name can only be changed 3 times every 14 days."
      };
    }
  }

  if (homeCityChanged) {
    const recentHomeCityChanges = await countRecentProfileFieldChanges(input.userId, "homeCity");

    if (recentHomeCityChanges >= MAX_CHANGES_PER_FIELD) {
      return {
        ok: false,
        status: 400,
        error: "Home city can only be changed 3 times every 14 days."
      };
    }
  }

  let error: { message?: string } | null = null;

  if (currentProfile) {
    const result = await input.supabase
      .from("profiles")
      .update({
        display_name: displayName,
        home_city: homeCity
      })
      .eq("user_id", input.userId);

    error = result.error;
  } else {
    const email = input.email?.trim().toLowerCase() ?? "";

    if (!email) {
      return {
        ok: false,
        status: 500,
        error: "Could not save profile settings."
      };
    }

    const result = await input.supabase.from("profiles").upsert(
      {
        user_id: input.userId,
        email,
        display_name: displayName,
        home_city: homeCity
      },
      { onConflict: "user_id" }
    );

    error = result.error;
  }

  if (error) {
    return {
      ok: false,
      status: 500,
      error: "Could not save profile settings."
    };
  }

  if (displayNameChanged) {
    await recordAuditEvent({
      userId: input.userId,
      eventType: "api",
      message: "Profile setting updated",
      severity: "info",
      metadata: {
        field: "displayName",
        previousValue: currentDisplayName,
        nextValue: displayName
      }
    });
  }

  if (homeCityChanged) {
    await recordAuditEvent({
      userId: input.userId,
      eventType: "api",
      message: "Profile setting updated",
      severity: "info",
      metadata: {
        field: "homeCity",
        previousValue: currentHomeCity,
        nextValue: homeCity
      }
    });
  }

  return {
    ok: true,
    status: 200,
    profile: {
      displayName,
      homeCity
    }
  };
}
