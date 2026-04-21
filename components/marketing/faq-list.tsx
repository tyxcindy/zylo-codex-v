"use client";

import { motion } from "framer-motion";

import { faqs } from "@/lib/data";

export function FAQList() {
  return (
    <section className="page-shell py-14">
      <div className="max-w-2xl">
        <p className="home-kicker">FAQ</p>
        <h2 className="home-title mt-3 text-4xl sm:text-5xl">The quick answers.</h2>
      </div>
      <div className="mt-8 grid gap-4">
        {faqs.map((faq, index) => (
          <motion.div
            key={faq.question}
            className="home-panel p-6"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.35, delay: index * 0.04 }}
          >
            <h3 className="text-xl text-white">{faq.question}</h3>
            <p className="mt-3 text-sm leading-7 text-white/62">{faq.answer}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
