"use client";

import Link from "next/link";

import { Logo } from "@/components/ui/logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-[color:var(--line)] bg-[color:var(--glass-bg)]/70 py-12 backdrop-blur-2xl">
      <div className="page-shell flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <div className="glass-panel max-w-md px-6 py-5">
          <Logo />
          <p className="mt-4 text-sm leading-7 text-[color:var(--text-soft)]">
            A personal space that filters your saved reels, isolates the travel ones, and turns them into places worth remembering.
          </p>
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-[color:var(--text-soft)]">
          <Link href="/#how-it-works">How It Works</Link>
          <Link href="/sign-in">Sign in</Link>
          <Link href="/dashboard">Open app</Link>
        </div>
      </div>
    </footer>
  );
}
