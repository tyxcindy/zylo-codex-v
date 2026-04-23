import { signOutAction } from "@/app/(app)/actions";
import { SectionIntro } from "@/components/app/section-intro";
import { SettingsPanel } from "@/components/app/settings-panel";
import { getUserLibrarySnapshot } from "@/lib/app-data";
import { requirePageUser } from "@/lib/auth";

export default async function SettingsPage() {
  const { supabase, user } = await requirePageUser();
  const { profile } = await getUserLibrarySnapshot(supabase, user.id);

  return (
    <section className="pb-24 lg:pb-0">
      <SectionIntro
        eyebrow="Settings"
        title="Manage your account and default planning setup."
        description="This page should handle the pieces a normal user actually needs to change: profile basics, home city, and account connection status."
      />
      <SettingsPanel signOutAction={signOutAction} profile={profile} />
    </section>
  );
}
