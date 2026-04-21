"use server";

import { redirect } from "next/navigation";

import { recordAuditEvent } from "@/lib/audit";
import { createClient } from "@/lib/supabase/server";

export async function signOutAction() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  await supabase.auth.signOut();

  if (user) {
    await recordAuditEvent({
      userId: user.id,
      eventType: "auth",
      message: "User signed out",
      severity: "info"
    });
  }

  redirect("/sign-in?message=Signed out.");
}
