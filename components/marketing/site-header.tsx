"use client";

import { useLocale } from "@/components/locale-provider";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";

export function SiteHeader() {
  const pathname = usePathname();
  const { messages } = useLocale();
  const isHome = pathname === "/";
  const isPublicStoryPage = pathname === "/" || pathname === "/how-it-works";
  const navItems = [
    { href: "/#see-it-work", label: messages.siteHeader.preview },
    { href: "/how-it-works", label: messages.siteHeader.learnMore }
  ];

  return (
    <header
      className={`sticky top-0 z-50 border-b border-[color:var(--line)] backdrop-blur-2xl ${
        isPublicStoryPage ? "bg-[color:var(--glass-bg)]/68" : "bg-[color:var(--glass-bg)]/90"
      }`}
    >
      <div className="page-shell flex flex-col gap-3 py-3 md:h-20 md:flex-row md:items-center md:justify-between md:py-0">
        <div className="flex items-center justify-between gap-4">
          <Link href="/">
            <Logo compact />
          </Link>
          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <Button asChild size="sm" variant={isHome ? "primary" : "app"}>
              <Link href="/sign-in">{messages.siteHeader.openZylo}</Link>
            </Button>
          </div>
        </div>
        <nav
          className="flex w-full items-center justify-center gap-2 rounded-full border border-[color:var(--line)] bg-[color:var(--glass-bg)] px-2 py-2 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.34),0_16px_34px_rgba(24,32,51,0.08)] backdrop-blur-xl md:w-auto"
        >
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-4 py-2 text-[color:var(--text-soft)] transition hover:bg-white/12 hover:text-[color:var(--text)]"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle />
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="hidden sm:inline-flex"
          >
            <Link href="/onboarding">{messages.siteHeader.startFree}</Link>
          </Button>
          <Button
            asChild
            size="sm"
            variant={isHome ? "primary" : "app"}
          >
            <Link href="/sign-in">{messages.siteHeader.openZylo}</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
