import { SearchWorkspace } from "@/components/app/search-workspace";
import { SectionIntro } from "@/components/app/section-intro";
import { getUserLibrarySnapshot } from "@/lib/app-data";
import { requirePageUser } from "@/lib/auth";

export default async function SearchPage() {
  const { supabase, user } = await requirePageUser();
  const { places, destinations } = await getUserLibrarySnapshot(supabase, user.id);

  return (
    <section>
      <SectionIntro
        eyebrow="Search"
        title="Pull places back out of the save pile."
        description="Search your saved library by place name, city, tags, or category so you can get back to planning instead of scrolling."
      />
      <SearchWorkspace places={places} destinations={destinations} />
    </section>
  );
}
