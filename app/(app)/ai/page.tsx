import { AIConcierge } from "@/components/app/ai-concierge";
import { SectionIntro } from "@/components/app/section-intro";

export default function AIPage() {
  return (
    <section>
      <SectionIntro
        eyebrow="Ask Zylo"
        title="Get itinerary-aware help, not generic travel filler."
        description="Zylo’s AI layer is designed to reason about your saved places, current route, and taste profile so advice feels contextual."
      />
      <AIConcierge />
    </section>
  );
}
