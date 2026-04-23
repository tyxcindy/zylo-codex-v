"use client";

import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Grip, MapPinned, X } from "lucide-react";
import { useRouter } from "next/navigation";

export interface MediaItemType {
  id: number | string;
  type: "image" | "video";
  title: string;
  desc: string;
  url: string;
  span: string;
  country?: string;
  placeCount?: number;
  href?: string;
}

const fallbackImage =
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80";

const cardFontFamily =
  '"Avenir Next", "SF Pro Display", "Inter", "Segoe UI", sans-serif';

const MediaItem = ({
  item,
  className,
  onClick
}: {
  item: MediaItemType;
  className?: string;
  onClick?: () => void;
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isInView, setIsInView] = useState(false);
  const [isBuffering, setIsBuffering] = useState(item.type === "video");
  const [imageUrl, setImageUrl] = useState(item.url);

  useEffect(() => {
    if (item.type !== "image") {
      return;
    }

    let isMounted = true;
    const nextImage = new window.Image();

    nextImage.onload = () => {
      if (isMounted) {
        setImageUrl(item.url);
      }
    };

    nextImage.onerror = () => {
      if (isMounted) {
        setImageUrl(fallbackImage);
      }
    };

    nextImage.src = item.url;

    return () => {
      isMounted = false;
    };
  }, [item.type, item.url]);

  useEffect(() => {
    if (item.type !== "video") {
      return;
    }

    const options = {
      root: null,
      rootMargin: "50px",
      threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        setIsInView(entry.isIntersecting);
      });
    }, options);

    const currentVideo = videoRef.current;
    if (currentVideo) {
      observer.observe(currentVideo);
    }

    return () => {
      if (currentVideo) {
        observer.unobserve(currentVideo);
      }
    };
  }, [item.type]);

  useEffect(() => {
    if (item.type !== "video") {
      return;
    }

    let mounted = true;
    const currentVideo = videoRef.current;

    const handleVideoPlay = async () => {
      if (!currentVideo || !isInView || !mounted) {
        return;
      }

      try {
        if (currentVideo.readyState >= 3) {
          setIsBuffering(false);
          await currentVideo.play();
          return;
        }

        setIsBuffering(true);
        await new Promise((resolve) => {
          currentVideo.oncanplay = resolve;
        });

        if (mounted) {
          setIsBuffering(false);
          await currentVideo.play();
        }
      } catch (error) {
        console.warn("Video playback failed:", error);
        setIsBuffering(false);
      }
    };

    if (isInView) {
      void handleVideoPlay();
    } else if (currentVideo) {
      currentVideo.pause();
    }

    return () => {
      mounted = false;
      if (currentVideo) {
        currentVideo.pause();
      }
    };
  }, [isInView, item.type]);

  if (item.type === "video") {
    return (
      <div className={`${className} relative overflow-hidden`}>
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          onClick={onClick}
          playsInline
          muted
          loop
          preload="metadata"
          style={{
            opacity: isBuffering ? 0.8 : 1,
            transition: "opacity 0.2s",
            transform: "translateZ(0)",
            willChange: "transform"
          }}
        >
          <source src={item.url} type="video/mp4" />
        </video>
        {isBuffering ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/10">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div
      role="img"
      aria-label={item.title}
      className={`${className} cursor-pointer bg-cover bg-center`}
      onClick={onClick}
      style={{ backgroundImage: `url(${imageUrl})` }}
    />
  );
};

interface GalleryModalProps {
  selectedItem: MediaItemType;
  isOpen: boolean;
  onClose: () => void;
  setSelectedItem: (item: MediaItemType | null) => void;
  mediaItems: MediaItemType[];
}

const GalleryModal = ({
  selectedItem,
  isOpen,
  onClose,
  setSelectedItem,
  mediaItems
}: GalleryModalProps) => {
  const [dockPosition, setDockPosition] = useState({ x: 0, y: 0 });

  if (!isOpen) {
    return null;
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 bg-[rgba(15,18,28,0.62)] backdrop-blur-xl"
        onClick={onClose}
      />

      <motion.div
        initial={{ scale: 0.98, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.98, opacity: 0 }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 30
        }}
        className="fixed inset-x-0 top-0 z-50 mx-auto flex min-h-screen w-full max-w-6xl items-center px-3 py-6 sm:px-6"
      >
        <div className="relative flex h-full w-full flex-col overflow-hidden rounded-[28px] border border-white/15 bg-[rgba(250,246,241,0.68)] shadow-[0_28px_80px_rgba(12,18,32,0.36)] backdrop-blur-2xl dark:bg-[rgba(21,26,36,0.72)]">
          <div className="flex-1 p-2 sm:p-3 md:p-4">
            <div className="flex h-full items-center justify-center rounded-[24px] bg-[linear-gradient(180deg,rgba(255,255,255,0.62)_0%,rgba(239,228,214,0.38)_100%)] p-2 dark:bg-[linear-gradient(180deg,rgba(14,18,27,0.68)_0%,rgba(25,31,43,0.54)_100%)]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedItem.id}
                  className="relative aspect-[16/9] h-auto max-h-[70vh] w-full max-w-[95%] overflow-hidden rounded-[24px] shadow-[0_20px_60px_rgba(7,10,18,0.26)] sm:max-w-[88%] md:max-w-4xl"
                  initial={{ y: 20, scale: 0.97 }}
                  animate={{
                    y: 0,
                    scale: 1,
                    transition: {
                      type: "spring",
                      stiffness: 500,
                      damping: 30,
                      mass: 0.5
                    }
                  }}
                  exit={{
                    y: 20,
                    scale: 0.97,
                    transition: { duration: 0.15 }
                  }}
                  onClick={onClose}
                >
                  <MediaItem
                    item={selectedItem}
                    className="h-full w-full bg-gray-900/20 object-contain"
                    onClick={onClose}
                  />
                  <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4 md:p-5">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/65 to-transparent" />
                    <div className="relative">
                      <h3 className="text-base font-semibold text-white sm:text-lg md:text-xl">
                        {selectedItem.title}
                      </h3>
                      <p className="mt-1 text-xs text-white/80 sm:text-sm">
                        {selectedItem.desc}
                      </p>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          <motion.button
            className="absolute right-3 top-3 rounded-full bg-gray-200/80 p-2 text-gray-700 backdrop-blur-sm hover:bg-gray-300/80 dark:bg-white/12 dark:text-white dark:hover:bg-white/18"
            onClick={onClose}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            aria-label="Close gallery"
          >
            <X className="h-3.5 w-3.5" />
          </motion.button>
        </div>
      </motion.div>

      <motion.div
        drag
        dragMomentum={false}
        dragElastic={0.1}
        initial={false}
        animate={{ x: dockPosition.x, y: dockPosition.y }}
        onDragEnd={(_, info) => {
          setDockPosition((prev) => ({
            x: prev.x + info.offset.x,
            y: prev.y + info.offset.y
          }));
        }}
        className="fixed bottom-4 left-1/2 z-[60] -translate-x-1/2 touch-none"
      >
        <motion.div className="relative rounded-2xl border border-sky-300/35 bg-sky-400/18 shadow-lg backdrop-blur-xl">
          <div className="flex items-center gap-2 px-3 py-2">
            <div className="flex items-center gap-1 rounded-full bg-white/20 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--text)] dark:text-white/88">
              <Grip className="h-3 w-3" />
              Drag
            </div>
            <div className="flex items-center -space-x-2">
              {mediaItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  onClick={(event) => {
                    event.stopPropagation();
                    setSelectedItem(item);
                  }}
                  style={{
                    zIndex: selectedItem.id === item.id ? 30 : mediaItems.length - index
                  }}
                  className={`relative h-8 w-8 flex-shrink-0 cursor-pointer overflow-hidden rounded-lg sm:h-9 sm:w-9 md:h-10 md:w-10 ${
                    selectedItem.id === item.id
                      ? "ring-2 ring-white/70 shadow-lg"
                      : "hover:ring-2 hover:ring-white/30"
                  }`}
                  initial={{ rotate: index % 2 === 0 ? -15 : 15 }}
                  animate={{
                    scale: selectedItem.id === item.id ? 1.18 : 1,
                    rotate: selectedItem.id === item.id ? 0 : index % 2 === 0 ? -15 : 15,
                    y: selectedItem.id === item.id ? -8 : 0
                  }}
                  whileHover={{
                    scale: 1.28,
                    rotate: 0,
                    y: -10,
                    transition: { type: "spring", stiffness: 400, damping: 25 }
                  }}
                >
                  <MediaItem item={item} className="h-full w-full" onClick={() => setSelectedItem(item)} />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-white/20" />
                  {selectedItem.id === item.id ? (
                    <motion.div
                      layoutId="activeGlow"
                      className="absolute -inset-2 bg-white/20 blur-xl"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                    />
                  ) : null}
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </>
  );
};

type LayoutVariant = "sl1" | "sl2" | "sl3" | "sl4" | "single";

type LayoutGroup = {
  variant: LayoutVariant;
  items: MediaItemType[];
  startIndex: number;
};

const layoutPattern: Exclude<LayoutVariant, "single">[] = ["sl1", "sl2", "sl3", "sl4"];

function buildLayoutGroups(items: MediaItemType[]): LayoutGroup[] {
  const groups: LayoutGroup[] = [];
  let cursor = 0;
  let patternIndex = 0;

  while (cursor < items.length) {
    const desiredVariant = layoutPattern[patternIndex % layoutPattern.length];
    const remaining = items.length - cursor;

    let variant: LayoutVariant;
    if (remaining === 1) {
      variant = "single";
    } else if (remaining === 2) {
      variant = desiredVariant === "sl3" || desiredVariant === "sl4" ? "sl4" : "sl2";
    } else {
      variant = desiredVariant;
    }

    const takeCount = variant === "sl1" || variant === "sl3" ? 3 : variant === "single" ? 1 : 2;

    groups.push({
      variant,
      items: items.slice(cursor, cursor + takeCount),
      startIndex: cursor
    });

    cursor += takeCount;
    patternIndex += 1;
  }

  return groups;
}

interface InteractiveBentoGalleryProps {
  mediaItems: MediaItemType[];
  title: string;
  description: string;
  interactionMode?: "modal" | "link";
}

const InteractiveBentoGallery: React.FC<InteractiveBentoGalleryProps> = ({
  mediaItems,
  title,
  description,
  interactionMode = "modal"
}) => {
  const router = useRouter();
  const [selectedItem, setSelectedItem] = useState<MediaItemType | null>(null);
  const [items, setItems] = useState(mediaItems);
  const [isDragging, setIsDragging] = useState(false);
  const layoutGroups = React.useMemo(() => buildLayoutGroups(items), [items]);

  const openItem = React.useCallback(
    (item: MediaItemType) => {
      if (interactionMode === "link" && item.href) {
        router.push(item.href);
        return;
      }

      setSelectedItem(item);
    },
    [interactionMode, router]
  );

  const handleReorder = (index: number, offset: { x: number; y: number }) => {
    const moveDistance = offset.x + offset.y;
    if (Math.abs(moveDistance) <= 50) {
      return;
    }

    const nextItems = [...items];
    const draggedItem = nextItems[index];
    const targetIndex =
      moveDistance > 0 ? Math.min(index + 1, items.length - 1) : Math.max(index - 1, 0);

    nextItems.splice(index, 1);
    nextItems.splice(targetIndex, 0, draggedItem);
    setItems(nextItems);
  };

  const renderCard = (item: MediaItemType, index: number, sizeClassName: string) => (
    <motion.div
      key={item.id}
      layoutId={`media-${item.id}`}
      className={`relative overflow-hidden rounded-[24px] border border-white/40 bg-white/30 shadow-[0_20px_50px_rgba(29,31,45,0.14)] backdrop-blur-sm ${sizeClassName}`}
      onClick={() => {
        if (!isDragging) {
          openItem(item);
        }
      }}
      variants={{
        hidden: { y: 50, scale: 0.9, opacity: 0 },
        visible: {
          y: 0,
          scale: 1,
          opacity: 1,
          transition: {
            type: "spring",
            stiffness: 350,
            damping: 25,
            delay: index * 0.04
          }
        }
      }}
      whileHover={{ scale: 1.02 }}
      drag
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={1}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={(_, info) => {
        setIsDragging(false);
        handleReorder(index, info.offset);
      }}
    >
      <MediaItem
        item={item}
        className="absolute inset-0 h-full w-full"
        onClick={() => {
          if (!isDragging) {
            openItem(item);
          }
        }}
      />
      <motion.div
        className="absolute inset-0 flex flex-col justify-end p-4 sm:p-5 md:p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25, delay: index * 0.04 + 0.12 }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-[rgba(6,10,18,0.92)] via-[rgba(6,10,18,0.3)] to-transparent" />
        <div className="relative mb-auto flex items-start justify-between gap-3">
          {item.country ? (
            <div
              className="rounded-full border border-white/22 bg-[rgba(255,255,255,0.12)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-white backdrop-blur-xl"
              style={{ fontFamily: cardFontFamily }}
            >
              <span className="inline-flex items-center gap-2">
                <MapPinned className="h-3.5 w-3.5 flex-shrink-0" />
                {item.country}
              </span>
            </div>
          ) : (
            <div />
          )}
          {typeof item.placeCount === "number" ? (
            <div
              className="flex-shrink-0 rounded-full border border-white/12 bg-[hsl(244_88%_68%_/_.92)] px-4 py-2 text-sm font-bold text-white shadow-[0_14px_35px_rgba(91,104,255,0.32)]"
              style={{ fontFamily: cardFontFamily }}
            >
              {item.placeCount} Places
            </div>
          ) : null}
        </div>
        <div className="relative">
          <h3
            className="text-2xl font-black leading-none text-white sm:text-[2rem]"
            style={{ fontFamily: cardFontFamily }}
          >
            {item.title}
          </h3>
          <p
            className="mt-3 text-sm leading-6 text-white/84"
            style={{ fontFamily: cardFontFamily }}
          >
            {item.desc}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );

  const renderLayoutGroup = (group: LayoutGroup) => {
    const indexedItems = group.items.map((item, offset) => ({
      item,
      index: group.startIndex + offset
    }));

    if (group.variant === "single") {
      return (
        <div key={`layout-group-${group.startIndex}`}>
          {renderCard(indexedItems[0].item, indexedItems[0].index, "min-h-[320px] sm:min-h-[360px]")}
        </div>
      );
    }

    if (group.variant === "sl1") {
      return (
        <div
          key={`layout-group-${group.startIndex}`}
          className="grid gap-4 lg:grid-cols-[minmax(0,1.24fr)_minmax(0,0.86fr)]"
        >
          {renderCard(indexedItems[0].item, indexedItems[0].index, "min-h-[360px] sm:min-h-[440px] lg:min-h-[560px]")}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            {renderCard(indexedItems[1].item, indexedItems[1].index, "min-h-[240px] lg:min-h-[272px]")}
            {renderCard(indexedItems[2].item, indexedItems[2].index, "min-h-[240px] lg:min-h-[272px]")}
          </div>
        </div>
      );
    }

    if (group.variant === "sl2") {
      return (
        <div
          key={`layout-group-${group.startIndex}`}
          className="grid gap-4 lg:grid-cols-[minmax(0,1.12fr)_minmax(0,0.88fr)]"
        >
          {renderCard(indexedItems[0].item, indexedItems[0].index, "min-h-[260px] lg:min-h-[320px]")}
          {renderCard(indexedItems[1].item, indexedItems[1].index, "min-h-[260px] lg:min-h-[320px]")}
        </div>
      );
    }

    if (group.variant === "sl3") {
      return (
        <div
          key={`layout-group-${group.startIndex}`}
          className="grid gap-4 lg:grid-cols-[minmax(0,0.86fr)_minmax(0,1.24fr)]"
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            {renderCard(indexedItems[1].item, indexedItems[1].index, "min-h-[240px] lg:min-h-[272px]")}
            {renderCard(indexedItems[2].item, indexedItems[2].index, "min-h-[240px] lg:min-h-[272px]")}
          </div>
          {renderCard(indexedItems[0].item, indexedItems[0].index, "min-h-[360px] sm:min-h-[440px] lg:min-h-[560px]")}
        </div>
      );
    }

    return (
      <div
        key={`layout-group-${group.startIndex}`}
        className="grid gap-4 lg:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)]"
      >
        {renderCard(indexedItems[1].item, indexedItems[1].index, "min-h-[260px] lg:min-h-[320px]")}
        {renderCard(indexedItems[0].item, indexedItems[0].index, "min-h-[260px] lg:min-h-[320px]")}
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-10 text-center">
        <motion.h1
          className="text-3xl font-black text-[color:var(--text)] sm:text-4xl md:text-5xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {title}
        </motion.h1>
        <motion.p
          className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-[color:var(--text-soft)] sm:text-base"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {description}
        </motion.p>
      </div>

      <AnimatePresence mode="wait">
        {interactionMode === "modal" && selectedItem ? (
          <GalleryModal
            selectedItem={selectedItem}
            isOpen={true}
            onClose={() => setSelectedItem(null)}
            setSelectedItem={setSelectedItem}
            mediaItems={items}
          />
        ) : (
          <motion.div
            className="space-y-4"
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.08 }
              }
            }}
          >
            {layoutGroups.map((group) => renderLayoutGroup(group))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InteractiveBentoGallery;
