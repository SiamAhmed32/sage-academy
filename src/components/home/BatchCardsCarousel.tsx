"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { BatchCard } from "@/components/home/BatchCard";
import { cn } from "@/lib/utils";

const MOBILE_CAROUSEL_QUERY = "(max-width: 767px)";
const AUTOPLAY_DELAY_MS = 3500;

export type HomeBatchCard = {
  id: string;
  title: string;
  image: string;
  features: string[];
  badge?: string;
  slug?: string;
  linkedBatch?: {
    status?: string;
    classLevel?: number | string;
  } | null;
};

type BatchCardsCarouselProps = {
  cards: HomeBatchCard[];
};

function toBatchCardProps(card: HomeBatchCard) {
  return {
    title: card.title,
    image: card.image,
    features: card.features,
    badge: card.badge,
    slug: card.slug,
    linkedBatch: card.linkedBatch,
  };
}

export function BatchCardsCarousel({ cards }: BatchCardsCarouselProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const activeIndexRef = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMobileCarousel, setIsMobileCarousel] = useState(false);

  const updateActiveIndex = useCallback((index: number) => {
    activeIndexRef.current = index;
    setActiveIndex(index);
  }, []);

  const scrollToIndex = useCallback((index: number) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const child = scroller.children[index] as HTMLElement | undefined;
    if (!child) return;
    scroller.scrollTo({
      left: child.offsetLeft - (scroller.clientWidth - child.offsetWidth) / 2,
      behavior: "smooth",
    });
  }, []);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller || cards.length <= 1) return;

    const onScroll = () => {
      const children = Array.from(scroller.children) as HTMLElement[];
      const center = scroller.scrollLeft + scroller.clientWidth / 2;
      let closest = 0;
      let minDistance = Number.POSITIVE_INFINITY;

      children.forEach((child, index) => {
        const childCenter = child.offsetLeft + child.offsetWidth / 2;
        const distance = Math.abs(center - childCenter);
        if (distance < minDistance) {
          minDistance = distance;
          closest = index;
        }
      });

      updateActiveIndex(closest);
    };

    scroller.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => scroller.removeEventListener("scroll", onScroll);
  }, [cards.length, updateActiveIndex]);

  useEffect(() => {
    const mediaQuery = window.matchMedia(MOBILE_CAROUSEL_QUERY);
    const syncMobileState = () => setIsMobileCarousel(mediaQuery.matches);

    syncMobileState();
    mediaQuery.addEventListener("change", syncMobileState);
    return () => mediaQuery.removeEventListener("change", syncMobileState);
  }, []);

  useEffect(() => {
    if (cards.length <= 1 || isPaused || !isMobileCarousel) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const intervalId = window.setInterval(() => {
      const next = activeIndexRef.current === cards.length - 1 ? 0 : activeIndexRef.current + 1;
      scrollToIndex(next);
    }, AUTOPLAY_DELAY_MS);

    return () => window.clearInterval(intervalId);
  }, [cards.length, isMobileCarousel, isPaused, scrollToIndex]);

  if (cards.length === 0) return null;

  return (
    <div
      className="mt-8"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      <p className="mb-3 text-center text-xs font-bold uppercase tracking-[0.18em] text-sage-primary md:hidden">
        সোয়াইপ করে পরের ব্যাচ দেখুন
      </p>

      <div
        ref={scrollerRef}
        className={cn(
          "flex flex-nowrap gap-4 overflow-x-auto overscroll-x-contain pb-2",
          "snap-x snap-mandatory scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
          "max-md:-mx-4 max-md:px-4",
          "md:grid md:grid-cols-2 md:overflow-visible md:pb-0 xl:grid-cols-3"
        )}
      >
        {cards.map((card) => (
          <div
            key={card.id}
            className={cn(
              "shrink-0 snap-center",
              "w-[calc(100vw-2rem)] max-w-[380px]",
              "md:w-auto md:max-w-none"
            )}
          >
            <BatchCard card={toBatchCardProps(card)} />
          </div>
        ))}
      </div>

      {cards.length > 1 ? (
        <div className="mt-5 flex items-center justify-between gap-4 px-1 md:hidden">
          <div className="flex items-center gap-2">
            {cards.map((card, index) => (
              <button
                key={card.id}
                type="button"
                aria-label={`Go to batch ${index + 1}`}
                aria-current={index === activeIndex}
                onClick={() => scrollToIndex(index)}
                className={cn(
                  "h-2.5 rounded-full transition-all",
                  index === activeIndex ? "w-7 bg-sage-primary" : "w-2.5 bg-sage-red-100"
                )}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Previous batch"
              onClick={() => scrollToIndex(Math.max(0, activeIndex - 1))}
              disabled={activeIndex === 0}
              className="grid h-10 w-10 place-items-center rounded-full border border-sage-red-100 bg-white text-sage-secondary shadow-sm transition hover:border-sage-primary hover:text-sage-primary disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="min-w-[3.5rem] text-center text-xs font-bold text-sage-gray-500">
              {activeIndex + 1} / {cards.length}
            </span>
            <button
              type="button"
              aria-label="Next batch"
              onClick={() => scrollToIndex(Math.min(cards.length - 1, activeIndex + 1))}
              disabled={activeIndex === cards.length - 1}
              className="grid h-10 w-10 place-items-center rounded-full border border-sage-red-100 bg-white text-sage-secondary shadow-sm transition hover:border-sage-primary hover:text-sage-primary disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
