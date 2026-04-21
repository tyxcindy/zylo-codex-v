import { Button } from "@/components/ui/button";

const tiers = [
  {
    name: "Starter",
    price: "Free",
    features: ["3 active trips", "Link, text, and screenshot imports", "Map and itinerary builder"]
  },
  {
    name: "Beta Plus",
    price: "$12/mo later",
    features: ["Unlimited active trips", "Advanced AI planning", "Priority access to sync integrations"]
  }
];

export default function PricingPage() {
  return (
    <div className="page-shell py-12">
      <div className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[color:var(--text-soft)]">
          Pricing
        </p>
        <h1 className="mt-4 text-5xl">Start free. Keep it simple.</h1>
        <p className="mt-5 text-base leading-8 text-[color:var(--text-soft)]">
          We’re racing to ship the first version people actually love using, so the beta stays free while we learn fast.
        </p>
      </div>
      <div className="mt-10 grid gap-4 lg:grid-cols-2">
        {tiers.map((tier) => (
          <div key={tier.name} className="glass-panel p-7">
            <p className="text-sm uppercase tracking-[0.18em] text-[color:var(--text-soft)]">{tier.name}</p>
            <h2 className="mt-4 text-4xl">{tier.price}</h2>
            <div className="mt-6 space-y-3 text-sm text-[color:var(--text-soft)]">
              {tier.features.map((feature) => (
                <p key={feature}>{feature}</p>
              ))}
            </div>
            <Button className="mt-8" variant="app">
              Join beta
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
