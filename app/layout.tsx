import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Azeret_Mono } from "next/font/google";
import Script from "next/script";

import { Providers } from "@/components/providers";
import { SiteChrome } from "@/components/site-chrome";
import { defaultLocale } from "@/lib/i18n";
import "@/app/globals.css";
import "leaflet/dist/leaflet.css";

const azeretMono = Azeret_Mono({
  subsets: ["latin"],
  variable: "--font-mono-accent",
  weight: ["400", "500", "600", "700"],
  display: "swap"
});

export const metadata: Metadata = {
  title: "Zylo",
  description:
    "You save it. Zylo plans it. Turn saved reels, posts, screenshots, and food finds into organized places, maps, and real trip plans."
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = defaultLocale;

  return (
    <html lang={locale} data-theme="light" suppressHydrationWarning>
      <body className={azeretMono.variable} suppressHydrationWarning>
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
        <Providers initialLocale={locale}>
          <SiteChrome>{children}</SiteChrome>
        </Providers>
      </body>
    </html>
  );
}
