"use client";

import { motion } from "framer-motion";
import { Compass, Images, Map } from "lucide-react";

const features = [
  {
    title: "Manual import is a product feature, not a fallback",
    body: "Paste links, captions, and screenshot text directly. The first beta is built to work without brittle account scraping.",
    icon: Images,
    accent: "from-[#6a73ff] via-[#9f84ff] to-[#ff7a59]"
  },
  {
    title: "Cities and spots appear automatically",
    body: "Destinations, cafes, landmarks, and stays surface as real places instead of staying buried inside source content.",
    icon: Map,
    accent: "from-[#ff7a59] via-[#ff9b7d] to-[#ffcd7f]"
  },
  {
    title: "The place becomes the unit",
    body: "Zylo keeps links and raw text internal. Users interact with place cards, destination boards, maps, and itineraries.",
    icon: Compass,
    accent: "from-[#23c983] via-[#6ee7b7] to-[#7ad3ff]"
  }
];

export function FeatureGrid() {
  return (
    <section className="page-shell py-14">
      <div className="max-w-2xl">
        <p className="home-kicker">What the space should feel like</p>
        <h2 className="home-title mt-3 text-4xl sm:text-5xl">Useful first. Travel-first. Never messy.</h2>
      </div>
      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        {features.map((feature, index) => {
          const Icon = feature.icon;

          return (
            <motion.div
              key={feature.title}
              className="home-panel p-7"
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.35, delay: index * 0.05 }}
            >
              <div className={`mesh-card flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${feature.accent} text-white`}>
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-6 text-2xl text-[color:var(--home-text)]">{feature.title}</h3>
              <p className="mt-3 text-sm leading-7 text-[color:var(--home-soft)]">{feature.body}</p>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
