"use client";

import Image from "next/image";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from "react";
import { motion } from "framer-motion";

import { useTheme } from "@/components/theme-provider";

type ThemeAsset = {
  light: string;
  dark: string;
};

type ScrollExpansionHeroProps = {
  mediaType?: "video" | "image";
  mediaSrc: string | ThemeAsset;
  posterSrc?: string | ThemeAsset;
  bgImageSrc: string | ThemeAsset;
  title?: string;
  titleLines?: [string, string];
  date?: string;
  scrollToExpand?: string;
  textBlend?: boolean;
  children?: ReactNode;
};

function resolveThemeAsset(asset: string | ThemeAsset, theme: "light" | "dark") {
  return typeof asset === "string" ? asset : asset[theme];
}

function buildYouTubeEmbedUrl(input: string) {
  try {
    const url = new URL(input);
    const host = url.hostname.replace(/^www\./, "");
    let videoId = "";

    if (host === "youtu.be") {
      videoId = url.pathname.slice(1);
    } else if (host === "youtube.com" || host === "m.youtube.com") {
      if (url.pathname === "/watch") {
        videoId = url.searchParams.get("v") ?? "";
      } else if (url.pathname.startsWith("/embed/")) {
        videoId = url.pathname.split("/embed/")[1] ?? "";
      }
    }

    if (!videoId) {
      return input;
    }

    const start = url.searchParams.get("start");
    const end = url.searchParams.get("end");
    const params = new URLSearchParams({
      autoplay: "1",
      mute: "1",
      loop: "1",
      controls: "0",
      rel: "0",
      disablekb: "1",
      modestbranding: "1",
      playsinline: "1",
      playlist: videoId
    });

    if (start) {
      params.set("start", start);
    }

    if (end) {
      params.set("end", end);
    }

    return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
  } catch {
    return input;
  }
}

export default function ScrollExpansionHero({
  mediaType = "image",
  mediaSrc,
  posterSrc,
  bgImageSrc,
  title,
  titleLines,
  date,
  scrollToExpand,
  textBlend,
  children
}: ScrollExpansionHeroProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showContent, setShowContent] = useState(false);
  const [mediaFullyExpanded, setMediaFullyExpanded] = useState(false);
  const [touchStartY, setTouchStartY] = useState(0);
  const [isMobileState, setIsMobileState] = useState(false);

  const sectionRef = useRef<HTMLDivElement | null>(null);
  const scrollProgressRef = useRef(0);
  const expandedRef = useRef(false);
  const touchStartRef = useRef(0);

  const resolvedMediaSrc = useMemo(() => resolveThemeAsset(mediaSrc, theme), [mediaSrc, theme]);
  const resolvedPosterSrc = useMemo(
    () => (posterSrc ? resolveThemeAsset(posterSrc, theme) : undefined),
    [posterSrc, theme]
  );
  const resolvedBackground = useMemo(
    () => resolveThemeAsset(bgImageSrc, theme),
    [bgImageSrc, theme]
  );
  const resolvedEmbeddedMediaSrc = useMemo(() => {
    if (mediaType !== "video") {
      return resolvedMediaSrc;
    }

    return resolvedMediaSrc.includes("youtube.com") || resolvedMediaSrc.includes("youtu.be")
      ? buildYouTubeEmbedUrl(resolvedMediaSrc)
      : resolvedMediaSrc;
  }, [mediaType, resolvedMediaSrc]);

  useEffect(() => {
    scrollProgressRef.current = scrollProgress;
    expandedRef.current = mediaFullyExpanded;
    touchStartRef.current = touchStartY;
  }, [mediaFullyExpanded, scrollProgress, touchStartY]);

  useEffect(() => {
    setScrollProgress(0);
    setShowContent(false);
    setMediaFullyExpanded(false);
  }, [mediaType, theme]);

  useEffect(() => {
    const handleWheel = (event: WheelEvent) => {
      if (expandedRef.current && event.deltaY < 0 && window.scrollY <= 5) {
        setMediaFullyExpanded(false);
        setShowContent(false);
        event.preventDefault();
        return;
      }

      if (!expandedRef.current) {
        event.preventDefault();
        const scrollDelta = event.deltaY * 0.0009;
        const newProgress = Math.min(Math.max(scrollProgressRef.current + scrollDelta, 0), 1);

        setScrollProgress(newProgress);

        if (newProgress >= 1) {
          setMediaFullyExpanded(true);
          setShowContent(true);
        } else if (newProgress < 0.75) {
          setShowContent(false);
        }
      }
    };

    const handleTouchStart = (event: TouchEvent) => {
      const nextTouch = event.touches[0]?.clientY ?? 0;
      setTouchStartY(nextTouch);
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (!touchStartRef.current) return;

      const touchY = event.touches[0]?.clientY ?? 0;
      const deltaY = touchStartRef.current - touchY;

      if (expandedRef.current && deltaY < -20 && window.scrollY <= 5) {
        setMediaFullyExpanded(false);
        setShowContent(false);
        event.preventDefault();
        return;
      }

      if (!expandedRef.current) {
        event.preventDefault();
        const scrollFactor = deltaY < 0 ? 0.008 : 0.005;
        const scrollDelta = deltaY * scrollFactor;
        const newProgress = Math.min(Math.max(scrollProgressRef.current + scrollDelta, 0), 1);

        setScrollProgress(newProgress);

        if (newProgress >= 1) {
          setMediaFullyExpanded(true);
          setShowContent(true);
        } else if (newProgress < 0.75) {
          setShowContent(false);
        }

        setTouchStartY(touchY);
      }
    };

    const handleTouchEnd = () => {
      setTouchStartY(0);
    };

    const handleScroll = () => {
      if (!expandedRef.current) {
        window.scrollTo(0, 0);
      }
    };

    const handleReset = () => {
      setScrollProgress(0);
      setShowContent(false);
      setMediaFullyExpanded(false);
      window.scrollTo(0, 0);
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("scroll", handleScroll, { passive: false });
    window.addEventListener("touchstart", handleTouchStart, { passive: false });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd);
    window.addEventListener("resetSection", handleReset);

    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("resetSection", handleReset);
    };
  }, []);

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobileState(window.innerWidth < 768);
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);

    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  const mediaWidth = 300 + scrollProgress * (isMobileState ? 650 : 1250);
  const mediaHeight = 400 + scrollProgress * (isMobileState ? 200 : 400);
  const titleTranslateX = scrollProgress * (isMobileState ? 34 : 92);
  const titleSurfaceOpacity = Math.max(0, 1 - scrollProgress * 1.55);
  const splitProgress = Math.min(Math.max((scrollProgress - 0.08) / 0.72, 0), 1);
  const overlayExitProgress = Math.min(Math.max((scrollProgress - 0.52) / 0.28, 0), 1);
  const overlayOpacity = Math.max(0, 1 - overlayExitProgress * 1.35);

  const firstWord = title ? title.split(" ")[0] : "";
  const restOfTitle = title ? title.split(" ").slice(1).join(" ") : "";
  const splitTitleLeft = titleLines?.[0] ?? "";
  const splitTitleRight = titleLines?.[1] ?? "";
  const usePhraseSplitTitle = Boolean(titleLines?.[0] && titleLines?.[1]);
  const titleLeftX =
    splitProgress * (isMobileState ? -160 : -340) -
    overlayExitProgress * (isMobileState ? 180 : 420);
  const titleRightX =
    splitProgress * (isMobileState ? 160 : 340) +
    overlayExitProgress * (isMobileState ? 180 : 420);
  const titleLeftY = splitProgress * (isMobileState ? 40 : 56);
  const titleRightY = splitProgress * (isMobileState ? 40 : 56);
  const splitTitleClass = isMobileState ? "text-[1.42rem]" : "text-[2.9rem] lg:text-[3.7rem]";
  const metaY = overlayExitProgress * (isMobileState ? 260 : 360);

  return (
    <div
      ref={sectionRef}
      className="overflow-x-hidden transition-colors duration-700 ease-in-out"
    >
      <section className="relative flex min-h-[100dvh] flex-col items-center justify-start">
        <div className="relative flex min-h-[100dvh] w-full flex-col items-center">
          <motion.div
            className="absolute inset-0 z-0 h-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 - scrollProgress }}
            transition={{ duration: 0.1 }}
          >
            <Image
              src={resolvedBackground}
              alt="Background"
              width={1920}
              height={1080}
              className="h-screen w-screen"
              style={{ objectFit: "cover", objectPosition: "center" }}
              priority
            />
            <div className={`absolute inset-0 ${isDark ? "bg-black/35" : "bg-black/20"}`} />
          </motion.div>

          <div className="container relative z-10 mx-auto flex flex-col items-center justify-start px-4 sm:px-6">
            <div className="relative flex h-[100dvh] w-full flex-col items-center justify-center">
              <div
                className="absolute left-1/2 top-1/2 z-0 -translate-x-1/2 -translate-y-1/2 rounded-[28px] transition-none"
                style={{
                  width: `${mediaWidth}px`,
                  height: `${mediaHeight}px`,
                  maxWidth: "95vw",
                  maxHeight: "85vh",
                  boxShadow: "0px 0px 50px rgba(0, 0, 0, 0.3)"
                }}
              >
                {mediaType === "video" ? (
                  resolvedEmbeddedMediaSrc.includes("/embed/") ? (
                    <div className="relative h-full w-full overflow-hidden rounded-[28px] pointer-events-none">
                      <iframe
                        width="100%"
                        height="100%"
                        src={resolvedEmbeddedMediaSrc}
                        className="h-full w-full rounded-[28px]"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                      <motion.div
                        className="absolute inset-0 rounded-[28px] bg-black/30"
                        initial={{ opacity: 0.7 }}
                        animate={{ opacity: 0.5 - scrollProgress * 0.3 }}
                        transition={{ duration: 0.2 }}
                      />
                    </div>
                  ) : (
                    <div className="relative h-full w-full overflow-hidden rounded-[28px] pointer-events-none">
                      <video
                        src={resolvedMediaSrc}
                        poster={resolvedPosterSrc}
                        autoPlay
                        muted
                        loop
                        playsInline
                        preload="auto"
                        className="h-full w-full rounded-[28px] object-cover"
                        controls={false}
                        disablePictureInPicture
                        disableRemotePlayback
                      />
                      <motion.div
                        className="absolute inset-0 rounded-[28px] bg-black/30"
                        initial={{ opacity: 0.7 }}
                        animate={{ opacity: 0.5 - scrollProgress * 0.3 }}
                        transition={{ duration: 0.2 }}
                      />
                    </div>
                  )
                ) : (
                  <div className="relative h-full w-full overflow-hidden rounded-[28px]">
                    <Image
                      src={resolvedMediaSrc}
                      alt={title || "Media content"}
                      width={1280}
                      height={720}
                      className="h-full w-full rounded-[28px] object-cover"
                    />

                    <motion.div
                      className="absolute inset-0 rounded-[28px] bg-black/45"
                      initial={{ opacity: 0.7 }}
                      animate={{ opacity: 0.7 - scrollProgress * 0.3 }}
                      transition={{ duration: 0.2 }}
                    />
                  </div>
                )}

                <motion.div
                  className="relative z-10 mt-4 flex flex-col items-center text-center transition-none"
                  style={{ y: metaY, opacity: overlayOpacity }}
                >
                  {date ? (
                    <p
                      className={`max-w-xl text-center text-lg font-medium drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)] md:text-2xl ${
                        isDark ? "text-white" : "text-white"
                      }`}
                    >
                      {date}
                    </p>
                  ) : null}
                  {scrollToExpand ? (
                    <p
                      className={`max-w-md text-center text-sm font-medium leading-6 drop-shadow-[0_4px_12px_rgba(0,0,0,0.55)] md:text-base ${
                        isDark ? "text-white" : "text-white"
                      }`}
                    >
                      {scrollToExpand}
                    </p>
                  ) : null}
                </motion.div>
              </div>

              <div
                className={`relative z-10 flex w-full max-w-4xl flex-col items-center justify-center gap-4 px-3 text-center transition-none sm:px-0 ${
                  textBlend ? "mix-blend-difference" : "mix-blend-normal"
                }`}
              >
                {usePhraseSplitTitle ? (
                  <div className="relative h-[240px] w-full max-w-5xl sm:h-[280px]">
                    <motion.div
                      className="absolute left-1/2 top-1/2 flex w-full max-w-[88vw] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center text-center sm:max-w-none"
                      style={{ opacity: overlayOpacity }}
                    >
                      <motion.h2
                        className={`z-10 w-max max-w-[88vw] px-2 text-center font-semibold leading-[0.92] tracking-[-0.03em] sm:px-0 ${splitTitleClass} ${
                          isDark ? "text-blue-100" : "text-blue-50"
                        }`}
                        style={{ x: titleLeftX, y: titleLeftY }}
                      >
                        {splitTitleLeft}
                      </motion.h2>
                      <motion.h2
                        className={`z-10 mt-2 w-max max-w-[88vw] px-2 text-center font-semibold leading-[0.92] tracking-[-0.03em] sm:px-0 ${splitTitleClass} ${
                          isDark ? "text-blue-100" : "text-blue-50"
                        }`}
                        style={{ x: titleRightX, y: titleRightY }}
                      >
                        {splitTitleRight}
                      </motion.h2>
                    </motion.div>
                  </div>
                ) : (
                  <div className="relative overflow-hidden rounded-[32px] px-5 py-5 sm:px-8 sm:py-7">
                    <motion.div
                      aria-hidden="true"
                      className={`absolute inset-0 rounded-[32px] shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl ${
                        isDark
                          ? "border border-white/14 bg-[rgba(10,16,28,0.38)]"
                          : "border border-white/30 bg-[rgba(250,248,244,0.2)]"
                      }`}
                      animate={{
                        opacity: titleSurfaceOpacity,
                        scale: 1 - scrollProgress * 0.03
                      }}
                      transition={{ duration: 0.16, ease: "linear" }}
                    />
                    <motion.h2
                      className={`relative z-10 max-w-[10ch] text-[1.48rem] font-semibold leading-[0.92] md:text-[2.75rem] lg:text-[3.4rem] ${
                        isDark ? "text-blue-100" : "text-blue-50"
                      }`}
                      style={{ transform: `translateX(-${titleTranslateX}px)` }}
                    >
                      {firstWord}
                    </motion.h2>
                    <motion.h2
                      className={`relative z-10 max-w-[12ch] text-center text-[1.48rem] font-semibold leading-[0.92] md:text-[2.75rem] lg:text-[3.4rem] ${
                        isDark ? "text-blue-100" : "text-blue-50"
                      }`}
                      style={{ transform: `translateX(${titleTranslateX}px)` }}
                    >
                      {restOfTitle}
                    </motion.h2>
                  </div>
                )}
              </div>
            </div>

            <motion.section
              className="flex w-full max-w-6xl flex-col px-4 pb-4 pt-8 md:px-10 lg:pb-6 lg:pt-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: showContent ? 1 : 0 }}
              transition={{ duration: 0.7 }}
            >
              {children}
            </motion.section>
          </div>
        </div>
      </section>
    </div>
  );
}
