import { redirect } from "next/navigation";
import { ArrowRight, Building2, Link2, MapPinned } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { getOptionalUser } from "@/lib/auth";

export default async function OnboardingPage() {
  const user = await getOptionalUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="page-shell py-12">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="glass-panel p-8 sm:p-10">
          <p className="app-kicker text-sm text-[color:var(--text-soft)]">
            Onboarding
          </p>
          <h1 className="app-display-title mt-4 max-w-4xl text-[3.2rem] leading-[0.9] sm:text-[4.8rem]">
            Your saved videos, turned into a trip planner.
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-[color:var(--text-soft)] sm:text-base">
            Zylo v1 is built around manual import that actually works today: paste a reel link,
            drop in a caption, add screenshot text, extract real places, and build the trip from there.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="glass-panel p-8">
            <p className="app-kicker text-xs text-[color:var(--text-soft)]">Step 1</p>
            <h2 className="app-display-title mt-4 text-[2rem] leading-[0.96]">Create your account</h2>
            <p className="mt-4 text-sm leading-7 text-[color:var(--text-soft)]">
              Sign up or log in first. Email verification and reset flows are live.
            </p>
            <div className="mt-6">
              <Button asChild>
                <Link href="/sign-in">
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="glass-panel p-8">
            <div className="flex items-center gap-3">
              <MapPinned className="h-5 w-5 text-[color:var(--brand)]" />
              <p className="app-kicker text-xs text-[color:var(--text-soft)]">Step 2</p>
            </div>
            <h2 className="app-display-title mt-4 text-[2rem] leading-[0.96]">Set your home city</h2>
            <p className="mt-4 text-sm leading-7 text-[color:var(--text-soft)]">
              The first full Local destination flow is next. For now the product ships with a Local board pattern and destination-first layout.
            </p>
            <div className="mt-6 rounded-[22px] border border-[color:var(--line)] bg-[color:var(--card-2)] px-4 py-4 text-sm text-[color:var(--text-soft)]">
              Local destination support is part of the product direction, but manual import is the priority for beta.
            </div>
          </div>

          <div className="glass-panel p-8">
            <div className="flex items-center gap-3">
              <Link2 className="h-5 w-5 text-[color:var(--brand)]" />
              <p className="app-kicker text-xs text-[color:var(--text-soft)]">Step 3</p>
            </div>
            <h2 className="app-display-title mt-4 text-[2rem] leading-[0.96]">Start importing</h2>
            <p className="mt-4 text-sm leading-7 text-[color:var(--text-soft)]">
              Paste travel reel URLs, captions, or screenshot text now. Instagram and TikTok account sync stay visible as roadmap-only scaffolds.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button asChild className="sm:w-auto">
                <Link href="/sign-in">Start with manual import</Link>
              </Button>
              <Button asChild variant="secondary" className="sm:w-auto">
                <Link href="/security">See security</Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="glass-panel p-8 sm:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="app-kicker text-sm text-[color:var(--text-soft)]">
                Phase 2 scaffold
              </p>
              <h2 className="app-display-title mt-4 text-[2.65rem] leading-[0.92] sm:text-[3.3rem]">Connect Instagram and TikTok later.</h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-[color:var(--text-soft)]">
                The buttons exist so the roadmap is visible, but beta avoids brittle scraping and unsupported integrations. Manual import is permanent first-class functionality.
              </p>
            </div>
            <div className="grid w-full gap-3 sm:grid-cols-3 lg:max-w-[34rem]">
              <div className="flex min-h-[5.5rem] items-center rounded-full border border-[color:var(--line)] bg-[color:var(--card)] px-6 py-3 text-sm font-semibold">
                Instagram coming soon
              </div>
              <div className="flex min-h-[5.5rem] items-center rounded-full border border-[color:var(--line)] bg-[color:var(--card)] px-6 py-3 text-sm font-semibold">
                TikTok coming soon
              </div>
              <div className="flex min-h-[5.5rem] items-center rounded-full border border-[color:var(--line)] bg-[color:var(--card)] px-6 py-3 text-sm font-semibold">
                Beli coming soon
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
