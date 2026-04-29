import { DashboardOverview } from "@/components/app/dashboard-overview";
import { SectionIntro } from "@/components/app/section-intro";
import { Button } from "@/components/ui/button";
import { getUserLibrarySnapshot } from "@/lib/app-data";
import { requirePageUser } from "@/lib/auth";
import Link from "next/link";

export default async function DashboardPage() {
  const { supabase, user } = await requirePageUser();
  const snapshot = await getUserLibrarySnapshot(supabase, user.id);

  return (
    <section>
      <SectionIntro
        eyebrow="Dashboard"
        title="Your Plans Are Waiting..."
        description="Import another reel, post, or caption. Until Instagram sync ships, use Import to paste a reel link, a TikTok URL, caption text, or screenshot notes and turn them into saved places."
        actions={
          <>
            <Button asChild variant="primary">
              <Link href="/import">Import a reel link</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/search">Search saved places</Link>
            </Button>
          </>
        }
      />
      <DashboardOverview {...snapshot} />
    </section>
  );
}
