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
import type { ReactNode } from "react";

import { ThemeToggle } from "@/components/theme-toggle";
import { Logo } from "@/components/ui/logo";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Home", icon: HouseIcon },
  { href: "/import", label: "Import", icon: InboxIcon },
  { href: "/destinations", label: "Destinations", icon: CompassIcon },
  { href: "/trips", label: "Trips", icon: CompassIcon },
  { href: "/search", label: "Search", icon: SearchIcon },
  { href: "/map", label: "Map", icon: MapIcon }
];

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
  const isActivePath = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="app-frame lg:grid lg:grid-cols-[250px_minmax(0,1fr)]">
      <aside className="hidden min-h-screen border-r border-[color:var(--line)] bg-[color:var(--app-sidebar-bg)] px-6 py-7 backdrop-blur-2xl lg:flex lg:flex-col">
        <div className="flex items-center justify-between">
          <Logo />
          <ThemeToggle />
        </div>
        <nav className="mt-10 space-y-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActivePath(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-4 rounded-[18px] px-4 py-4 text-lg font-semibold transition",
                  active
                    ? "app-gradient text-white shadow-[0_18px_32px_rgba(109,92,255,0.28)]"
                    : "text-[color:var(--app-text-soft)] hover:bg-white/10 hover:text-[color:var(--app-text)]"
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto space-y-4">
          <div className="app-card-soft rounded-[22px] px-4 py-4 text-sm text-[color:var(--app-text-soft)]">
            Signed in as
            <div className="mt-1 truncate text-base font-semibold text-[color:var(--app-text)]">{displayName}</div>
            <div className="mt-1 truncate text-xs text-[color:var(--app-text-soft)]">{userEmail}</div>
          </div>
          <Link
            href="/settings"
            className={cn(
              "flex items-center gap-4 rounded-[18px] px-4 py-4 text-lg font-semibold transition",
              isActivePath("/settings")
                ? "app-gradient text-white shadow-[0_18px_32px_rgba(109,92,255,0.28)]"
                : "text-[color:var(--app-text-soft)] hover:bg-white/10 hover:text-[color:var(--app-text)]"
            )}
          >
            <SettingsIcon className="h-5 w-5" />
            Settings
          </Link>
        </div>
      </aside>
      <div className="min-w-0 px-4 pb-28 pt-5 sm:px-6 lg:px-10 lg:pb-12 lg:pt-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mx-auto w-full max-w-[1180px]"
        >
          <div className="mb-6 flex items-start justify-between gap-4 lg:hidden">
            <div>
              <Logo />
              <p className="mt-2 text-sm text-[color:var(--app-text-soft)]">{displayName}</p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/import"
                className="inline-flex h-11 items-center justify-center rounded-full border border-[color:var(--line)] bg-[color:var(--glass-bg)] px-4 text-sm font-semibold text-[color:var(--app-text)] shadow-[inset_0_1px_0_rgba(255,255,255,0.42),0_18px_32px_rgba(24,32,51,0.1)] backdrop-blur-xl"
              >
                Import
              </Link>
              <ThemeToggle />
            </div>
          </div>
          <div className="mb-6 hidden items-center justify-end lg:flex">
            <Link
              href="/import"
              className="inline-flex h-11 items-center justify-center rounded-full border border-[color:var(--line)] bg-[color:var(--glass-bg)] px-5 text-sm font-semibold text-[color:var(--app-text)] shadow-[inset_0_1px_0_rgba(255,255,255,0.42),0_18px_32px_rgba(24,32,51,0.1)] backdrop-blur-xl"
            >
              Import a reel link
            </Link>
          </div>
          {children}
        </motion.div>
      </div>
      <nav className="fixed inset-x-4 bottom-4 z-50 grid grid-cols-5 rounded-[24px] border border-[color:var(--line)] bg-[color:var(--glass-bg-strong)] p-2 shadow-[0_24px_48px_rgba(15,23,42,0.18),inset_0_1px_0_rgba(255,255,255,0.3)] backdrop-blur-2xl lg:hidden">
        {navItems.filter((item) => item.href !== "/map").map((item) => {
          const Icon = item.icon;
          const active = isActivePath(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 rounded-[18px] px-2 py-3 text-[11px] font-semibold transition",
                active
                  ? "bg-[linear-gradient(135deg,var(--brand)_0%,color-mix(in_srgb,var(--brand)_72%,white)_100%)] text-white shadow-[0_14px_24px_rgba(91,104,255,0.24)]"
                  : "text-[color:var(--app-text-soft)]"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
