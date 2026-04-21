import { signOutAction } from "@/app/(app)/actions";
import { SectionIntro } from "@/components/app/section-intro";
import { SettingsPanel } from "@/components/app/settings-panel";
import { getUserLibrarySnapshot } from "@/lib/app-data";
import { requirePageUser } from "@/lib/auth";
import { getProviderStatus } from "@/lib/provider-status";

export default async function SettingsPage() {
  const { supabase, user } = await requirePageUser();
  const providerStatus = getProviderStatus();
  const { profile, sourceArtifacts } = await getUserLibrarySnapshot(supabase, user.id);

  return (
    <section className="pb-24 lg:pb-0">
      <SectionIntro
        eyebrow="Settings"
        title="Manage imports, account state, and future connections."
        description="This is where the beta draws the line clearly: manual import is live, provider health is visible, and future sync integrations stay marked as coming soon."
      />
      <SettingsPanel
        providerStatus={providerStatus}
        signOutAction={signOutAction}
        profile={profile}
        sourceArtifacts={sourceArtifacts}
      />
    </section>
  );
}
