import type { ReactNode } from "react";

import { requirePageUser } from "@/lib/auth";
import { AppShell } from "@/components/app/app-shell";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const { user } = await requirePageUser();

  return (
    <AppShell
      userEmail={user.email ?? "account"}
      displayName={String(user.user_metadata?.display_name ?? "Explorer")}
    >
      {children}
    </AppShell>
  );
}
