"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";

const appPrefixes = ["/dashboard", "/import", "/destinations", "/places", "/map", "/trips", "/search", "/ai", "/settings"];

export function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAppRoute = appPrefixes.some((prefix) => pathname.startsWith(prefix));

  if (isAppRoute) {
    return <>{children}</>;
  }

  return (
    <>
      <SiteHeader />
      {children}
      <SiteFooter />
    </>
  );
}
