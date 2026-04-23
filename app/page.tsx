import { HeroScrollPreview } from "@/components/marketing/hero-scroll-preview";
import { LandingSummary } from "@/components/marketing/landing-summary";

export default function HomePage() {
  return (
    <main className="pb-20">
      <HeroScrollPreview />
      <LandingSummary />
    </main>
  );
}
