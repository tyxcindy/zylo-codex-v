"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { cn } from "@/lib/utils";

type CarouselItem = {
  id: number | string;
  imageUrl: string;
  title: string;
  subtitle: string;
};

type DestinationCarouselProps = {
  items: readonly CarouselItem[];
  title: string;
  subtitle?: string;
  eyebrow?: string;
  className?: string;
};

export function DestinationCarousel({
  items,
  title,
  subtitle,
  eyebrow = "Dashboard highlights",
  className
}: DestinationCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [cardsPerView, setCardsPerView] = useState(3);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function syncCardsPerView() {
      if (window.innerWidth < 720) {
        setCardsPerView(1);
      } else if (window.innerWidth < 1080) {
        setCardsPerView(2);
      } else {
        setCardsPerView(3);
      }
    }

    syncCardsPerView();
    window.addEventListener("resize", syncCardsPerView);
    return () => window.removeEventListener("resize", syncCardsPerView);
  }, []);

  const visibleItems = useMemo(() => {
    if (items.length === 0) return [];

    return Array.from({ length: cardsPerView + 1 }, (_, index) => {
      const nextIndex = (currentIndex + index) % items.length;
      return items[nextIndex];
    });
  }, [cardsPerView, currentIndex, items]);

  const canSlide = items.length > cardsPerView;
  const slideWidth = 100 / (cardsPerView + 1);

  function move(direction: "prev" | "next") {
    if (!trackRef.current || isAnimating || !canSlide) {
      return;
    }

    const track = trackRef.current;
    setIsAnimating(true);

    if (direction === "next") {
      track.style.transition = "transform 420ms ease";
      track.style.transform = `translateX(-${slideWidth}%)`;

      window.setTimeout(() => {
        setCurrentIndex((value) => (value + 1) % items.length);
        track.style.transition = "none";
        track.style.transform = "translateX(0)";
        void track.offsetWidth;
        setIsAnimating(false);
      }, 420);
      return;
    }

    track.style.transition = "none";
    track.style.transform = `translateX(-${slideWidth}%)`;
    setCurrentIndex((value) => (value - 1 + items.length) % items.length);
    void track.offsetWidth;
    track.style.transition = "transform 420ms ease";
    track.style.transform = "translateX(0)";
    window.setTimeout(() => {
      setIsAnimating(false);
    }, 420);
  }

  return (
    <section className={cn("app-card overflow-hidden px-4 py-4 sm:px-5 sm:py-5", className)}>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[color:var(--app-text-soft)]">
            {eyebrow}
          </p>
          <h3 className="mt-2 text-[1.05rem] font-semibold text-[color:var(--app-text)] sm:text-[1.15rem]">
            {title}
          </h3>
          {subtitle ? (
            <p className="mt-2 text-sm text-[color:var(--app-text-soft)]">{subtitle}</p>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => move("prev")}
            aria-label="Previous slide"
            disabled={!canSlide || isAnimating}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--line)] bg-[color:var(--glass-bg)] text-[color:var(--app-text)] transition hover:bg-[color:var(--glass-bg-strong)] disabled:cursor-not-allowed disabled:opacity-45"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => move("next")}
            aria-label="Next slide"
            disabled={!canSlide || isAnimating}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--line)] bg-[color:var(--glass-bg)] text-[color:var(--app-text)] transition hover:bg-[color:var(--glass-bg-strong)] disabled:cursor-not-allowed disabled:opacity-45"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="overflow-hidden">
        <div
          ref={trackRef}
          className="flex gap-3"
          style={{
            width: `${((cardsPerView + 1) * 100) / cardsPerView}%`,
            transform: "translateX(0)"
          }}
        >
          {visibleItems.map((item, index) => (
            <article
              key={`${item.id}-${currentIndex}-${index}`}
              className="group relative overflow-hidden rounded-[24px] border border-[color:var(--line)]"
              style={{ width: `${100 / (cardsPerView + 1)}%` }}
            >
              <img
                src={item.imageUrl}
                alt={item.title}
                className="h-[190px] w-full object-cover transition duration-500 group-hover:scale-[1.03] sm:h-[210px]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                <h4 className="text-lg font-semibold leading-tight text-white">{item.title}</h4>
                <p className="mt-1 text-sm text-white/82">{item.subtitle}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
