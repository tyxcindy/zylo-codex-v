"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, FolderHeart, MapPinned, WandSparkles } from "lucide-react";

const painPoints = [
  {
    title: "Your saves are chaos",
    body: "Reels, screenshots, captions, and food pics pile up with no sense of place or timing.",
    icon: FolderHeart,
    accent: "from-[#6a73ff] to-[#9e84ff]"
  },
  {
    title: "Planning kills the vibe",
    body: "You already found the good spots. The friction is stitching them into something usable.",
    icon: ArrowUpRight,
    accent: "from-[#ff7a59] to-[#ffb56c]"
  },
  {
    title: "Zylo makes it move",
    body: "Imports get grouped, mapped, and elevated into a trip surface that feels alive, not archived.",
    icon: MapPinned,
    accent: "from-[#23c983] to-[#7be5b6]"
  }
];

export default function ProblemStrip() {
  return (
    <section className="page-shell py-14">
      <div className="home-panel p-6 sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="home-kicker">Why it should feel different</p>
            <h2 className="home-title mt-3 text-4xl sm:text-5xl">Static boxes don’t sell a product built around movement.</h2>
          </div>
          <div className="home-panel-muted max-w-md px-4 py-4">
            <div className="flex items-center gap-3 text-[color:var(--home-text)]">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#7a84ff]/18 text-[#c9d1ff]">
                <WandSparkles className="h-5 w-5" />
              </div>
              <p className="text-sm leading-6 text-[color:var(--home-soft)]">
                The landing page now frames Zylo as an active travel interface, not a collection of feature cards.
              </p>
            </div>
          </div>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {painPoints.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                className="home-panel-muted p-6"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.35, delay: index * 0.06 }}
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${item.accent} text-white`}>
                  <Icon className="h-5 w-5" />
                </div>
                <p className="mt-5 text-xl font-black text-[color:var(--home-text)]">{item.title}</p>
                <p className="mt-3 text-sm leading-7 text-[color:var(--home-soft)]">{item.body}</p>
                <div className="mt-6 h-1.5 rounded-full bg-black/8">
                  <motion.div
                    className={`h-full rounded-full bg-gradient-to-r ${item.accent}`}
                    initial={{ width: "18%" }}
                    whileInView={{ width: ["18%", "82%", "58%"] }}
                    viewport={{ once: true }}
                    transition={{ duration: 3.2, delay: index * 0.1, ease: "easeInOut" }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
