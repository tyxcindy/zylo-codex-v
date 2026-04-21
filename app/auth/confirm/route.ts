import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { safeRedirectPath } from "@/lib/request";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  const next = safeRedirectPath(
    url.searchParams.get("next"),
    type === "recovery" ? "/update-password" : "/dashboard"
  );

  const supabase = await createClient();

  let error: { message: string } | null = null;

  if (code) {
    const result = await supabase.auth.exchangeCodeForSession(code);
    error = result.error ? { message: result.error.message } : null;
  } else if (tokenHash && type) {
    const result = await supabase.auth.verifyOtp({
      type: type as "signup" | "recovery" | "email" | "email_change",
      token_hash: tokenHash
    });
    error = result.error ? { message: result.error.message } : null;
  } else {
    error = { message: "Invalid or expired auth link." };
  }

  if (error) {
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (user) {
      return NextResponse.redirect(
        new URL(`${next}?message=${encodeURIComponent("Email verified. You can keep going.")}`, url.origin)
      );
    }

    return NextResponse.redirect(
      new URL("/sign-in?error=Verification link has expired or is invalid.", url.origin)
    );
  }

  return NextResponse.redirect(
    new URL(`${next}?message=${encodeURIComponent("Email verified. You can keep going.")}`, url.origin)
  );
}
