"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";

const navItems = [
  { href: "/#see-it-work", label: "Preview" },
  { href: "/how-it-works", label: "Learn more" }
];

export function SiteHeader() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isPublicStoryPage = pathname === "/" || pathname === "/how-it-works";

  return (
    <header
      className={`sticky top-0 z-50 border-b border-[color:var(--line)] backdrop-blur-2xl ${
        isPublicStoryPage ? "bg-[color:var(--glass-bg)]/68" : "bg-[color:var(--glass-bg)]/90"
      }`}
    >
      <div className="page-shell flex h-20 items-center justify-between gap-4">
        <Link href="/">
          <Logo compact />
        </Link>
        <nav
          className="hidden items-center gap-2 rounded-full border border-[color:var(--line)] bg-[color:var(--glass-bg)] px-2 py-2 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.34),0_16px_34px_rgba(24,32,51,0.08)] backdrop-blur-xl md:flex"
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
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="hidden sm:inline-flex"
          >
            <Link href="/onboarding">Start free</Link>
          </Button>
          <Button
            asChild
            size="sm"
            variant={isHome ? "primary" : "app"}
          >
            <Link href="/sign-in">Open Zylo</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
