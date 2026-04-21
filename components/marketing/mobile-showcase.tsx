"use client";

import { motion } from "framer-motion";

export function MobileShowcase() {
  return (
    <section className="page-shell py-14">
      <div className="home-panel grid gap-8 px-6 py-8 sm:px-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <motion.div>
          <p className="home-kicker">Mobile first</p>
          <motion.h2
            className="home-title mt-3 text-4xl sm:text-5xl"
            initial={{ opacity: 0, y: 28, filter: "blur(12px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, amount: 0.55 }}
            transition={{ duration: 0.45 }}
          >
            Built like a travel planner you’d actually keep opening.
          </motion.h2>
          <p className="home-copy mt-5 max-w-lg text-sm leading-7">
            The mobile surface should feel fast and useful: import at the top, destinations first,
            search that is actually usable, and a trip layer built from saved places.
          </p>
          <div className="mt-8 space-y-3">
            {[
              "Import is always one tap away.",
              "Cities and places surface fast instead of hiding inside saved links.",
              "The product stays playful and clear without looking like a promo page."
            ].map((item) => (
              <div key={item} className="home-panel-muted px-4 py-3 text-sm text-[color:var(--home-soft)]">
                {item}
              </div>
            ))}
          </div>
        </motion.div>
        <div className="grid gap-4 md:grid-cols-2">
          {["Import", "Map"].map((screen, index) => (
            <motion.div
              key={screen}
              className="home-panel-muted p-4"
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.35, delay: index * 0.08 }}
            >
              <div className="mx-auto flex h-[380px] w-full max-w-[210px] flex-col rounded-[36px] border border-[color:var(--home-line)] bg-[color:var(--glass-bg-strong)] p-4 text-[color:var(--home-text)] shadow-[0_24px_70px_rgba(2,6,23,0.16),inset_0_1px_0_rgba(255,255,255,0.45)] backdrop-blur-2xl">
                <div className="mx-auto h-1.5 w-16 rounded-full bg-black/12" />
                <div className="mt-5 rounded-[30px] bg-gradient-to-br from-[#7a84ff]/40 via-[#ff7a59]/12 to-transparent p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--home-muted)]">{screen}</p>
                  <p className="mt-3 text-xl font-black text-[color:var(--home-text)]">
                    {screen === "Import"
                      ? "Paste. Extract. Go."
                      : "Your world, mapped fast."}
                  </p>
                </div>
                <div className="mt-4 space-y-3">
                  {[0, 1, 2].map((row) => (
                    <div key={row} className="rounded-2xl border border-[color:var(--home-line)] bg-[color:var(--home-panel-muted-bg)] p-3">
                      <motion.div
                        className={`rounded-2xl bg-gradient-to-r ${
                          screen === "Import"
                            ? "from-[#6a73ff] via-[#8f8aff] to-[#7ad3ff]"
                            : "from-[#ff7a59] via-[#ffb56c] to-[#ffe1a7]"
                        }`}
                        animate={{
                          height: row === 2 ? [56, 76, 62] : [20, 34, 24],
                          opacity: [0.58, 1, 0.74]
                        }}
                        transition={{ duration: 3.6 + row * 0.8, repeat: Infinity, ease: "easeInOut" }}
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-auto grid grid-cols-3 gap-2 rounded-full border border-[color:var(--home-line)] bg-[color:var(--home-panel-muted-bg)] p-2">
                  {[0, 1].map((dot) => (
                    <div
                      key={dot}
                      className={`h-2 rounded-full ${dot === index ? "bg-[color:var(--home-text)]" : "bg-black/12"}`}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
          <div className="home-panel-muted flex items-center p-6 md:col-span-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--home-muted)]">What users should feel</p>
              <h3 className="mt-4 text-3xl font-black text-[color:var(--home-text)]">Calm enough to trust. Fun enough to revisit.</h3>
              <p className="mt-4 text-sm leading-7 text-[color:var(--home-soft)]">
                The interface should feel like a clean personal utility, not a loud marketing page trying to compensate for weak product value.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
