"use client";

import Link from "next/link";

import { useLocale } from "@/components/locale-provider";
import { Logo } from "@/components/ui/logo";

export function SiteFooter() {
  const { messages } = useLocale();

  return (
    <footer className="border-t border-[color:var(--line)] bg-[color:var(--glass-bg)]/70 py-7 backdrop-blur-2xl">
      <div className="page-shell flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div className="glass-panel max-w-md px-5 py-4">
          <Logo />
          <p className="mt-3 text-sm leading-6 text-[color:var(--text-soft)]">
            {messages.siteFooter.description}
          </p>
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-[color:var(--text-soft)]">
          <Link href="/#how-it-works">{messages.siteFooter.howItWorks}</Link>
          <Link href="/sign-in">{messages.siteFooter.signIn}</Link>
          <Link href="/dashboard">{messages.siteFooter.openApp}</Link>
        </div>
      </div>
    </footer>
  );
}
