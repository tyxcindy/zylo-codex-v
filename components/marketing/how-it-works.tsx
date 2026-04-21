"use client";

import { motion } from "framer-motion";
import { Binary, ScanSearch, WandSparkles } from "lucide-react";

const steps = [
  {
    title: "Save",
    body: "Paste a travel reel link, a caption, a screenshot note, or your own travel text. Manual import is the v1 path.",
    icon: ScanSearch,
    accent: "from-[#6a73ff] to-[#9586ff]"
  },
  {
    title: "Organize",
    body: "Zylo extracts only real, physically visitable places, deduplicates them, and groups them by destination first.",
    icon: Binary,
    accent: "from-[#ff7a59] to-[#ffb56c]"
  },
  {
    title: "Plan",
    body: "Search later, map the places, and build an itinerary from what you already wanted instead of starting from a blank plan.",
    icon: WandSparkles,
    accent: "from-[#23c983] to-[#86ecc5]"
  }
];

export function HowItWorksSection() {
  return (
    <section className="page-shell py-14" id="how-it-works">
      <div className="max-w-2xl">
        <p className="home-kicker">How it works</p>
        <motion.h2
          className="home-title mt-3 text-4xl sm:text-5xl"
          initial={{ opacity: 0, y: 28, filter: "blur(12px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.45 }}
        >
          Save. Organize. Plan.
        </motion.h2>
      </div>
      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <motion.div
              key={step.title}
              className="home-panel p-6"
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.35, delay: index * 0.08 }}
            >
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${step.accent} text-white`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="mt-6 flex items-center gap-3">
                <span className="text-sm font-black uppercase tracking-[0.22em] text-[color:var(--home-muted)]">0{index + 1}</span>
                <h3 className="text-2xl text-[color:var(--home-text)]">{step.title}</h3>
              </div>
              <p className="mt-3 text-sm leading-7 text-[color:var(--home-soft)]">{step.body}</p>
              <div className="mt-6 h-2 rounded-full bg-black/6">
                <motion.div
                  className={`h-full rounded-full bg-gradient-to-r ${step.accent}`}
                  animate={{ width: ["22%", "72%", "54%"] }}
                  transition={{ duration: 3.2 + index * 0.4, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
