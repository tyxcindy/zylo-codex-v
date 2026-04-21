import { ShieldCheck } from "lucide-react";
import Link from "next/link";

import { SignInPanels } from "@/components/auth/sign-in-panels";
import { getOptionalUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export default async function SignInPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; message?: string; next?: string }>;
}) {
  const user = await getOptionalUser();
  const params = await searchParams;

  if (user) {
    return (
      <div className="page-shell py-12">
        <div className="glass-panel mx-auto max-w-2xl p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[color:var(--text-soft)]">
            Already inside
          </p>
          <h1 className="mt-4 text-4xl">You’re already signed in.</h1>
          <p className="mt-4 text-sm leading-7 text-[color:var(--text-soft)]">
            Jump back into the app instead of creating a second session.
          </p>
          <div className="mt-6">
            <Button asChild variant="app">
              <Link href="/dashboard">Open dashboard</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell py-12">
      <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="auth-hero overflow-hidden rounded-[34px] border border-[color:var(--line)] p-8 text-white shadow-[var(--shadow)]">
          <p className="text-sm uppercase tracking-[0.22em] text-white/70">Welcome back</p>
          <h1 className="mt-4 text-5xl">Sign in to Zylo.</h1>
          <p className="mt-5 max-w-md text-sm leading-7 text-white/80">
            Pick up your saved spots, trip drafts, and map view without digging
            back through your camera roll or bookmarks.
          </p>
          <div className="mt-8 flex items-center gap-3 rounded-3xl border border-white/15 bg-black/10 p-4 text-sm text-white/80 backdrop-blur">
            <ShieldCheck className="h-5 w-5" />
            Email verification, password reset, and server-side session checks are live.
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {[
              "Fast sign in",
              "Real session checks",
              "Reset flow ready",
              "Dark mode synced"
            ].map((item) => (
              <div
                key={item}
                className="rounded-[22px] border border-white/15 bg-white/10 px-4 py-3 text-sm font-medium text-white/85 backdrop-blur"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-6">
          <SignInPanels
            initialError={params.error}
            initialMessage={params.message}
            next={params.next ?? "/dashboard"}
          />
        </div>
      </div>
    </div>
  );
}
