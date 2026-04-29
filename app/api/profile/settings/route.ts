import { NextResponse } from "next/server";
import { z } from "zod";

import { requireApiUser } from "@/lib/auth";
import { saveProfileSettings } from "@/lib/profile-settings";

const profileSettingsSchema = z.object({
  displayName: z.string().trim().min(1).max(120),
  homeCity: z.string().trim().min(1).max(120)
});

export async function POST(request: Request) {
  const { supabase, user } = await requireApiUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  const parsed = profileSettingsSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Display name and home city must be between 1 and 120 characters." },
      { status: 400 }
    );
  }

  const result = await saveProfileSettings({
    supabase,
    userId: user.id,
    email: user.email,
    displayName: parsed.data.displayName,
    homeCity: parsed.data.homeCity
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ ok: true, profile: result.profile });
}
