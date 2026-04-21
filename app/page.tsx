import { Hero } from "@/components/marketing/hero";
import { LandingSummary } from "@/components/marketing/landing-summary";
import { SkyAtmosphere } from "@/components/marketing/sky-atmosphere";

export default function HomePage() {
  return (
    <main className="home-stage pb-20">
      <SkyAtmosphere />
      <div className="relative z-10">
        <Hero />
        <LandingSummary />
      </div>
    </main>
  );
}
