"use client";

import { motion, useMotionTemplate, useScroll, useTransform } from "framer-motion";

const LIGHT_IMAGE =
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2200&q=80";
const DARK_IMAGE =
  "https://images.unsplash.com/photo-1596245569361-4e6ec591ca81?auto=format&fit=crop&w=2200&q=80";

export function SkyAtmosphere() {
  const { scrollYProgress } = useScroll();

  const blurAmount = useTransform(scrollYProgress, [0, 0.24], [0, 26]);
  const baseScale = useTransform(scrollYProgress, [0, 0.24], [1, 1.06]);
  const revealOpacity = useTransform(scrollYProgress, [0, 0.24], [0.96, 0.08]);
  const sceneY = useTransform(scrollYProgress, [0, 0.24], [0, -12]);
  const hazeOpacity = useTransform(scrollYProgress, [0, 0.24], [0.18, 0.52]);

  const blurFilter = useMotionTemplate`blur(${blurAmount}px)`;

  return (
    <div className="home-atmosphere" aria-hidden="true">
      <div className="home-atmosphere-sky" />
      <div className="home-atmosphere-vignette" />

      <motion.div className="home-photo-layer home-photo-light" style={{ y: sceneY }}>
        <motion.div
          className="home-photo-stage"
          style={{ scale: baseScale, filter: blurFilter, backgroundImage: `url(${LIGHT_IMAGE})` }}
        />
        <motion.div
          className="home-photo-stage home-photo-stage-clear"
          style={{ opacity: revealOpacity, backgroundImage: `url(${LIGHT_IMAGE})` }}
        />
      </motion.div>

      <motion.div className="home-photo-layer home-photo-dark" style={{ y: sceneY }}>
        <motion.div
          className="home-photo-stage home-photo-stage-dark"
          style={{ scale: baseScale, filter: blurFilter, backgroundImage: `url(${DARK_IMAGE})` }}
        />
        <motion.div
          className="home-photo-stage home-photo-stage-clear home-photo-stage-dark-clear"
          style={{ opacity: revealOpacity, backgroundImage: `url(${DARK_IMAGE})` }}
        />
      </motion.div>

      <motion.div className="home-atmosphere-haze" style={{ opacity: hazeOpacity }} />
      <div className="home-atmosphere-sun" />
      <div className="home-atmosphere-water" />
      <div className="home-atmosphere-shoreline" />
    </div>
  );
}
