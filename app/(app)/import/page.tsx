import { ImportWorkbench } from "@/components/app/import-workbench";
import { SectionIntro } from "@/components/app/section-intro";
import { getUserLibrarySnapshot } from "@/lib/app-data";
import { requirePageUser } from "@/lib/auth";

export default async function ImportPage() {
  const { supabase, user } = await requirePageUser();
  const { sourceArtifacts } = await getUserLibrarySnapshot(supabase, user.id);

  return (
    <section>
      <SectionIntro
        eyebrow="Import"
        title="Feed Zylo the way you already save."
        description="Paste links, drop in captions, or upload screenshots and photos. The import layer is designed to be reliable today and extensible for future sync."
      />
      <ImportWorkbench sourceArtifacts={sourceArtifacts} />
    </section>
  );
}
