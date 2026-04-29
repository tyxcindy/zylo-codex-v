"use client";

import { motion } from "framer-motion";
import {
  Compass as CompassIcon,
  House as HouseIcon,
  Inbox as InboxIcon,
  Map as MapIcon,
  Search as SearchIcon,
  Settings as SettingsIcon
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";

import { useLocale } from "@/components/locale-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { MenuToggleIcon } from "@/components/ui/menu-toggle-icon";
import { useScroll } from "@/components/ui/use-scroll";
import { cn } from "@/lib/utils";

export function AppShell({
  children,
  userEmail,
  displayName
}: {
  children: ReactNode;
  userEmail: string;
  displayName: string;
}) {
  const pathname = usePathname();
  const { messages } = useLocale();
  const [open, setOpen] = useState(false);
  const scrolled = useScroll(10);
  const isMapWorkspace = pathname.startsWith("/map");

  const navItems = useMemo(
    () => [
      { href: "/dashboard", label: messages.appShell.home, icon: HouseIcon },
      { href: "/import", label: messages.appShell.import, icon: InboxIcon },
      { href: "/destinations", label: messages.appShell.destinations, icon: CompassIcon },
      { href: "/trips", label: messages.appShell.trips, icon: CompassIcon },
      { href: "/search", label: messages.appShell.search, icon: SearchIcon },
      { href: "/map", label: messages.appShell.map, icon: MapIcon },
      { href: "/settings", label: messages.appShell.settings, icon: SettingsIcon }
    ],
    [messages.appShell]
  );

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const isActivePath = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="app-frame">
      <div className={cn("mx-auto w-full", isMapWorkspace ? "max-w-none" : "max-w-[1440px]")}>
        <header
          className={cn(
            "sticky top-0 z-40 px-4 pb-2 pt-4 sm:px-6 lg:px-8",
            isMapWorkspace ? "md:px-6" : ""
          )}
        >
          <div
            className={cn(
              "mx-auto flex w-full items-center justify-between gap-3 rounded-[28px] border px-4 py-3 backdrop-blur-2xl transition-all duration-200",
              scrolled || open
                ? "border-[color:var(--line)] bg-[color:var(--glass-bg-strong)] shadow-[0_18px_36px_rgba(15,23,42,0.12)]"
                : "border-[color:var(--line)] bg-[color:var(--glass-bg)] shadow-[0_10px_24px_rgba(15,23,42,0.08)]",
              isMapWorkspace ? "max-w-[1360px]" : "max-w-[1320px]"
            )}
          >
            <Link href="/dashboard" className="min-w-0 shrink-0">
              <Logo compact />
            </Link>

            <nav className="hidden min-w-0 flex-1 items-center justify-center xl:flex">
              <div className="flex items-center gap-1 rounded-full border border-[color:var(--line)] bg-[color:var(--glass-bg)] p-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActivePath(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition",
                        active
                          ? "bg-[color:var(--brand)] text-white shadow-[0_12px_22px_rgba(91,104,255,0.24)]"
                          : "text-[color:var(--app-text-soft)] hover:bg-[color:var(--glass-bg-strong)] hover:text-[color:var(--app-text)]"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </nav>

            <div className="hidden items-center gap-3 xl:flex">
              <div className="rounded-full border border-[color:var(--line)] bg-[color:var(--glass-bg)] px-4 py-2 text-right shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]">
                <div className="truncate text-sm font-semibold text-[color:var(--app-text)]">{displayName}</div>
                <div className="max-w-[180px] truncate text-[11px] text-[color:var(--app-text-soft)]">{userEmail}</div>
              </div>
              <Button asChild variant="secondary" size="md">
                <Link href="/import">{messages.appShell.importReelLink}</Link>
              </Button>
              <ThemeToggle compact />
            </div>

            <div className="flex items-center gap-2 xl:hidden">
              <ThemeToggle compact />
              <button
                type="button"
                onClick={() => setOpen((value) => !value)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[color:var(--line)] bg-[color:var(--glass-bg)] text-[color:var(--app-text)] shadow-[0_10px_22px_rgba(15,23,42,0.08)]"
                aria-label="Toggle navigation"
              >
                <MenuToggleIcon open={open} className="h-5 w-5" duration={280} />
              </button>
            </div>
          </div>
        </header>

        <div
          className={cn(
            "fixed inset-x-0 top-[86px] z-30 px-4 sm:px-6 xl:hidden",
            open ? "pointer-events-auto" : "pointer-events-none"
          )}
        >
          <div
            className={cn(
              "mx-auto max-w-[1320px] overflow-hidden rounded-[28px] border border-[color:var(--line)] bg-[color:var(--glass-bg-strong)] shadow-[0_30px_60px_rgba(15,23,42,0.16)] backdrop-blur-2xl transition",
              open ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"
            )}
          >
            <div className="border-b border-[color:var(--line)] px-5 py-4">
              <div className="text-sm font-semibold text-[color:var(--app-text)]">{displayName}</div>
              <div className="mt-1 text-xs text-[color:var(--app-text-soft)]">{userEmail}</div>
            </div>
            <nav className="grid gap-1 p-3">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActivePath(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "inline-flex items-center gap-3 rounded-[18px] px-4 py-3 text-sm font-semibold transition",
                      active
                        ? "bg-[color:var(--brand)] text-white"
                        : "text-[color:var(--app-text-soft)] hover:bg-[color:var(--glass-bg)] hover:text-[color:var(--app-text)]"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
              <Button asChild variant="secondary" size="md" className="mt-2 w-full justify-center">
                <Link href="/import">{messages.appShell.importReelLink}</Link>
              </Button>
            </nav>
          </div>
        </div>

        <motion.main
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className={cn(
            "pb-14 pt-2",
            isMapWorkspace
              ? "px-0 sm:px-0 lg:px-0"
              : "px-4 sm:px-6 lg:px-8"
          )}
        >
          <div className={cn("mx-auto w-full", isMapWorkspace ? "max-w-none" : "max-w-[1320px]")}>
            {children}
          </div>
        </motion.main>
      </div>
    </div>
  );
}
