import type { Metadata } from "next";
import type { ReactNode } from "react";
import Script from "next/script";

import { Providers } from "@/components/providers";
import { SiteChrome } from "@/components/site-chrome";
import "@/app/globals.css";
import "leaflet/dist/leaflet.css";

export const metadata: Metadata = {
  title: "Zylo",
  description:
    "You save it. Zylo plans it. Turn saved reels, posts, screenshots, and food finds into organized places, maps, and real trip plans."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Script id="zylo-theme-init" strategy="beforeInteractive">
          {`(() => {
            try {
              const stored = window.localStorage.getItem("zylo-theme");
              const theme = stored === "dark" || stored === "light"
                ? stored
                : window.matchMedia("(prefers-color-scheme: dark)").matches
                  ? "dark"
                  : "light";
              document.documentElement.dataset.theme = theme;
            } catch (_) {}
          })();`}
        </Script>
        <Providers>
          <SiteChrome>{children}</SiteChrome>
        </Providers>
      </body>
    </html>
  );
}
