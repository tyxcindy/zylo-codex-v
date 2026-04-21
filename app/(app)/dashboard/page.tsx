import { DashboardOverview } from "@/components/app/dashboard-overview";
import { SectionIntro } from "@/components/app/section-intro";
import { getUserLibrarySnapshot } from "@/lib/app-data";
import { requirePageUser } from "@/lib/auth";

export default async function DashboardPage() {
  const { supabase, user } = await requirePageUser();
  const snapshot = await getUserLibrarySnapshot(supabase, user.id);

  return (
    <section>
      <SectionIntro
        eyebrow="Dashboard"
        title="See what your saves are actually turning into."
        description="Zylo shows what keeps resurfacing, what’s still unplanned, and which destinations are already rich enough to build a trip around."
      />
      <DashboardOverview {...snapshot} />
    </section>
  );
}
