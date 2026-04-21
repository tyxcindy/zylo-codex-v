"use client";

import { motion } from "framer-motion";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export function FinalCTA() {
  return (
    <section className="page-shell pb-20 pt-8">
      <div className="home-panel px-6 py-10 text-center sm:px-10">
        <motion.div
          className="mx-auto h-28 w-28 rounded-full border border-[color:var(--home-line)] bg-[color:var(--home-panel-muted-bg)] shadow-[inset_0_1px_0_rgba(255,255,255,0.32)]"
          animate={{ scale: [1, 1.08, 1], opacity: [0.58, 0.95, 0.58] }}
          transition={{ duration: 4.6, repeat: Infinity, ease: "easeInOut" }}
        />
        <p className="home-kicker mt-6">Ready when you are</p>
        <motion.h2
          className="home-title mt-4 text-4xl sm:text-5xl"
          initial={{ opacity: 0, y: 28, filter: "blur(12px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, amount: 0.7 }}
          transition={{ duration: 0.45 }}
        >
          Stop losing good places inside saved chaos.
        </motion.h2>
        <p className="home-copy mx-auto mt-4 max-w-2xl text-sm leading-7">
          Start with manual import, build real place boards, and add direct sync later when it is durable enough to trust.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/onboarding">Start free</Link>
          </Button>
          <Button asChild variant="secondary" size="lg">
            <Link href="/sign-in">Sign in</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
