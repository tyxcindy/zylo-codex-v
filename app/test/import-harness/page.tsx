import { ImportWorkbench } from "@/components/app/import-workbench";
import { SectionIntro } from "@/components/app/section-intro";
import { groupImportSourceFixtures, importSourceFixtures } from "@/lib/import-source-fixtures";

export default function ImportHarnessPage() {
  const groupedFixtures = groupImportSourceFixtures(importSourceFixtures);

  return (
    <section className="mx-auto max-w-6xl px-6 py-10">
      <SectionIntro
        eyebrow="Test Harness"
        title="Import workbench harness"
        description="This public route exists for automated browser verification of the import UX."
      />
      <div className="mb-8 grid gap-4 md:grid-cols-2">
        {Object.entries(groupedFixtures).map(([label, fixtures]) => (
          <div key={label} className="rounded-[24px] border border-[color:var(--line)] bg-[color:var(--glass-bg)] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--text-soft)]">
              {label}
            </p>
            <div className="mt-3 space-y-2 text-sm">
              {fixtures.map((fixture) => (
                <a
                  key={fixture.id}
                  href={fixture.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block break-all text-[color:var(--text)] underline decoration-[color:var(--line)] underline-offset-4"
                >
                  {fixture.url}
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
      <ImportWorkbench sourceArtifacts={[]} />
    </section>
  );
}
