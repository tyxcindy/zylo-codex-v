import { FeatureGrid } from "@/components/marketing/feature-grid";
import { HowItWorksSection } from "@/components/marketing/how-it-works";
import { MobileShowcase } from "@/components/marketing/mobile-showcase";
import { SkyAtmosphere } from "@/components/marketing/sky-atmosphere";
import ProblemStrip from "@/components/marketing/problem-strip";
import { RoadmapTeaser } from "@/components/marketing/roadmap-teaser";
import { SecurityTrust } from "@/components/marketing/security-trust";

export default function HowItWorksPage() {
  return (
    <>
      <main className="home-stage home-stage-story">
        <SkyAtmosphere />
        <div className="page-shell relative z-10 py-12 sm:py-16">
          <div className="story-hero-card max-w-3xl pb-12 sm:pb-20">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[color:var(--home-muted)]">
              Learn more
            </p>
            <h1 className="home-title mt-4 text-5xl">The deeper Zylo story lives here.</h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-[color:var(--home-soft)]">
              This page is for the fuller product story: how the workflow works today, where the roadmap
              goes next, and why Zylo is being built as a real travel tool instead of a pile of saved links.
            </p>
          </div>
        </div>
      </main>

      <div className="story-surface pb-20">
        <ProblemStrip />
        <HowItWorksSection />
        <FeatureGrid />
        <MobileShowcase />
        <RoadmapTeaser />
        <SecurityTrust />
      </div>
    </>
  );
}
