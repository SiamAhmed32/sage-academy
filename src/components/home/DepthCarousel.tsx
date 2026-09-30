"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import gsap from "gsap";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

export type DepthCarouselItem = {
  image: string;
  alt?: string;
  imageClass?: string;
};

type TiltDirection = "left" | "right";

type DepthCarouselProps = {
  items: DepthCarouselItem[];
  cardWidth?: number;
  cardHeight?: number;
  radius?: number;
  tint?: string;
  depth?: number;
  spread?: number;
  tilt?: number;
  tiltDirection?: TiltDirection;
  perspective?: number;
  visibleCards?: number;
  falloff?: number;
  blur?: number;
  duration?: number;
  ease?: string;
  autoplay?: boolean;
  autoplayDelay?: number;
  loop?: boolean;
  showControls?: boolean;
  showIndicators?: boolean;
  fill?: boolean;
  badge?: string;
  className?: string;
};

type CarouselConfig = {
  count: number;
  depth: number;
  spread: number;
  tilt: number;
  tiltDirection: TiltDirection;
  visibleCards: number;
  falloff: number;
  blur: number;
  duration: number;
  ease: string;
  loop: boolean;
  cardWidth: number;
  autoplayDelay: number;
};

type DragState = {
  x: number;
  startPos: number;
  lastX: number;
  lastT: number;
  v: number;
  moved: boolean;
  id: number;
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export function DepthCarousel({
  items,
  cardWidth = 300,
  cardHeight = 380,
  radius = 18,
  tint = "#2a090b",
  depth = 220,
  spread = 90,
  tilt = 22,
  tiltDirection = "right",
  perspective = 1400,
  visibleCards = 4,
  falloff = 0.2,
  blur = 6,
  duration = 700,
  ease = "power3.out",
  autoplay = false,
  autoplayDelay = 3200,
  loop = true,
  showControls = true,
  showIndicators = true,
  fill = false,
  badge,
  className,
}: DepthCarouselProps) {
  const data = useMemo(() => items.filter((item) => item.image), [items]);
  const count = data.length;

  const rootRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const overlayRefs = useRef<(HTMLSpanElement | null)[]>([]);

  const posRef = useRef(0);
  const focusRef = useRef(0);
  const tweenRef = useRef<gsap.core.Tween | null>(null);
  const scaleRef = useRef(1);
  const cfgRef = useRef<CarouselConfig>({} as CarouselConfig);
  const dragRef = useRef<DragState | null>(null);
  const autoTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reducedRef = useRef(false);

  const [active, setActive] = useState(0);

  cfgRef.current = {
    count,
    depth,
    spread,
    tilt,
    tiltDirection,
    visibleCards,
    falloff,
    blur,
    duration,
    ease,
    loop,
    cardWidth,
    autoplayDelay,
  };

  const layout = useCallback((pos: number) => {
    const cfg = cfgRef.current;
    const total = cfg.count;
    if (!total) return;
    const dir = cfg.tiltDirection === "left" ? -1 : 1;
    const scale = scaleRef.current;

    for (let i = 0; i < total; i++) {
      const el = cardRefs.current[i];
      if (!el) continue;

      let distance = i - pos;
      if (cfg.loop && total > 1) {
        distance = ((distance % total) + total) % total;
        if (distance > total / 2) distance -= total;
      }

      const back = Math.max(0, distance);
      const shown = Math.abs(distance) <= cfg.visibleCards + 0.5;
      const translateZ = -cfg.depth * distance;
      const translateX = dir * cfg.spread * distance;
      const rotateY = dir * cfg.tilt * clamp(distance, 0, 1);
      let opacity = distance < 0 ? Math.max(0, 1 + distance) : 1;
      if (!shown) opacity = 0;

      const brightness = Math.max(0.15, 1 - back * cfg.falloff);
      const blurPx = cfg.blur > 0 ? Math.min(cfg.blur, (back / Math.max(1, cfg.visibleCards)) * cfg.blur) : 0;

      el.style.transform = `translate(-50%, -50%) scale(${scale}) translateX(${translateX.toFixed(2)}px) translateZ(${translateZ.toFixed(2)}px) rotateY(${rotateY.toFixed(3)}deg)`;
      el.style.opacity = opacity.toFixed(3);
      el.style.filter = `brightness(${brightness.toFixed(3)}) blur(${blurPx.toFixed(2)}px)`;
      el.style.zIndex = String(Math.round(2000 - distance * 20));
      el.style.pointerEvents = shown && opacity > 0.05 ? "auto" : "none";

      const overlay = overlayRefs.current[i];
      if (overlay) overlay.style.opacity = clamp(back * cfg.falloff * 1.25, 0, 0.86).toFixed(3);
    }
  }, []);

  const tweenTo = useCallback(
    (target: number, animate: boolean) => {
      tweenRef.current?.kill();
      const cfg = cfgRef.current;
      const proxy = { p: posRef.current };
      const seconds = animate && !reducedRef.current ? cfg.duration / 1000 : 0;
      tweenRef.current = gsap.to(proxy, {
        p: target,
        duration: seconds,
        ease: cfg.ease,
        onUpdate: () => {
          posRef.current = proxy.p;
          layout(proxy.p);
        },
        onComplete: () => {
          const total = cfg.count;
          if (total > 0) posRef.current = ((posRef.current % total) + total) % total;
          layout(posRef.current);
        },
      });
    },
    [layout]
  );

  const setFocus = useCallback(
    (rawIndex: number, animate = true) => {
      const cfg = cfgRef.current;
      const total = cfg.count;
      if (!total) return;
      const idx = cfg.loop ? ((rawIndex % total) + total) % total : clamp(rawIndex, 0, total - 1);
      let delta = idx - posRef.current;
      if (cfg.loop && total > 1) {
        delta = ((delta % total) + total) % total;
        if (delta > total / 2) delta -= total;
      }
      tweenTo(posRef.current + delta, animate);
      if (idx !== focusRef.current) {
        focusRef.current = idx;
        setActive(idx);
      }
    },
    [tweenTo]
  );

  const navigateBy = useCallback((step: number) => setFocus(focusRef.current + step, true), [setFocus]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? 0;
      if (fill) {
        scaleRef.current = 1;
      } else {
        const cfg = cfgRef.current;
        const needed = cfg.cardWidth + Math.abs(cfg.spread) * 2 + 80;
        scaleRef.current = clamp(width / needed, 0.45, 1);
      }
      layout(posRef.current);
    });
    observer.observe(root);
    return () => observer.disconnect();
  }, [fill, layout]);

  const onPointerDown = useCallback((event: ReactPointerEvent) => {
    if (cfgRef.current.count < 2) return;
    tweenRef.current?.kill();
    dragRef.current = {
      x: event.clientX,
      startPos: posRef.current,
      lastX: event.clientX,
      lastT: performance.now(),
      v: 0,
      moved: false,
      id: event.pointerId,
    };
  }, []);

  const onPointerMove = useCallback(
    (event: ReactPointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      const cfg = cfgRef.current;
      const stepPx = Math.max(cfg.cardWidth * 0.55 * scaleRef.current, 40);
      const dx = event.clientX - drag.x;
      if (!drag.moved && Math.abs(dx) > 4) {
        drag.moved = true;
        rootRef.current?.setPointerCapture(drag.id);
      }
      if (!drag.moved) return;
      const now = performance.now();
      const dt = Math.max(now - drag.lastT, 1);
      drag.v = (event.clientX - drag.lastX) / dt;
      drag.lastX = event.clientX;
      drag.lastT = now;
      posRef.current = drag.startPos - dx / stepPx;
      layout(posRef.current);
    },
    [layout]
  );

  const onPointerEnd = useCallback(() => {
    const drag = dragRef.current;
    if (!drag) return;
    dragRef.current = null;
    if (!drag.moved) return;
    const cfg = cfgRef.current;
    const stepPx = Math.max(cfg.cardWidth * 0.55 * scaleRef.current, 40);
    const projected = posRef.current - (drag.v * 180) / stepPx;
    setFocus(Math.round(projected), true);
  }, [setFocus]);

  const onKeyDown = useCallback(
    (event: ReactKeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        navigateBy(-1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        navigateBy(1);
      }
    },
    [navigateBy]
  );

  useEffect(() => {
    reducedRef.current =
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!autoplay || reducedRef.current || count < 2) return;
    const root = rootRef.current;
    let hovered = false;
    let focused = false;
    const stop = () => {
      if (autoTimerRef.current) clearInterval(autoTimerRef.current);
      autoTimerRef.current = null;
    };
    const start = () => {
      stop();
      autoTimerRef.current = setInterval(() => {
        if (!hovered && !focused) navigateBy(1);
      }, Math.max(cfgRef.current.autoplayDelay, 600));
    };
    const onEnter = () => {
      hovered = true;
    };
    const onLeave = () => {
      hovered = false;
    };
    const onFocusIn = () => {
      focused = true;
    };
    const onFocusOut = () => {
      focused = false;
    };
    root?.addEventListener("mouseenter", onEnter);
    root?.addEventListener("mouseleave", onLeave);
    root?.addEventListener("focusin", onFocusIn);
    root?.addEventListener("focusout", onFocusOut);
    start();
    return () => {
      stop();
      root?.removeEventListener("mouseenter", onEnter);
      root?.removeEventListener("mouseleave", onLeave);
      root?.removeEventListener("focusin", onFocusIn);
      root?.removeEventListener("focusout", onFocusOut);
    };
  }, [autoplay, autoplayDelay, count, navigateBy]);

  useEffect(() => {
    layout(posRef.current);
  }, [layout, depth, spread, tilt, tiltDirection, visibleCards, falloff, blur, cardWidth, cardHeight, count]);

  useEffect(
    () => () => {
      tweenRef.current?.kill();
      if (autoTimerRef.current) clearInterval(autoTimerRef.current);
    },
    []
  );

  return (
    <div
      ref={rootRef}
      className={cn(
        "relative flex h-full min-h-[280px] w-full cursor-grab touch-pan-y select-none items-center justify-center outline-none active:cursor-grabbing",
        className
      )}
      style={{ perspective: `${perspective}px` }}
      role="group"
      aria-roledescription="carousel"
      aria-label="ফ্রি ক্লাসের ছবি"
      tabIndex={0}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
      onKeyDown={onKeyDown}
    >
      {data.map((item, index) => (
        <div
          key={item.image}
          ref={(el) => {
            cardRefs.current[index] = el;
          }}
          className="absolute left-1/2 top-1/2 cursor-pointer overflow-hidden bg-sage-secondary shadow-[0_30px_60px_-20px_rgba(42,9,11,0.55)] [transform:translate(-50%,-50%)] [will-change:transform,opacity,filter]"
          style={
            fill
              ? { width: "100%", height: "100%", borderRadius: radius }
              : { width: cardWidth, height: cardHeight, borderRadius: radius }
          }
          aria-roledescription="slide"
          aria-label={`${index + 1} of ${count}`}
          aria-hidden={active !== index}
          onClick={() => {
            if (dragRef.current?.moved) return;
            setFocus(index, true);
          }}
        >
          <Image
            src={item.image}
            alt={item.alt || ""}
            fill
            draggable={false}
            quality={75}
            className={cn("pointer-events-none select-none object-cover", item.imageClass)}
            sizes="(max-width: 1024px) 92vw, 42vw"
          />
          {badge ? (
            <span className="absolute left-4 top-4 rounded-full border border-white/20 bg-black/30 px-3 py-1.5 text-[11px] font-bold tracking-wider text-white backdrop-blur-xl">
              {badge}
            </span>
          ) : null}
          <span
            ref={(el) => {
              overlayRefs.current[index] = el;
            }}
            className="pointer-events-none absolute inset-0 opacity-0 mix-blend-multiply"
            style={{ background: tint }}
          />
        </div>
      ))}

      {showControls && count > 1 ? (
        <>
          <button
            type="button"
            aria-label="আগের ছবি"
            onClick={() => navigateBy(-1)}
            className="absolute left-3 top-1/2 z-[3000] grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-white/25 bg-black/40 text-white backdrop-blur-md transition hover:bg-black/60"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="পরের ছবি"
            onClick={() => navigateBy(1)}
            className="absolute right-3 top-1/2 z-[3000] grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-white/25 bg-black/40 text-white backdrop-blur-md transition hover:bg-black/60"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      ) : null}

      {showIndicators && count > 1 ? (
        <div className="absolute bottom-4 left-1/2 z-[3000] flex -translate-x-1/2 gap-2 rounded-full bg-black/35 px-3 py-2 backdrop-blur-sm">
          {data.map((item, index) => (
            <button
              key={item.image}
              type="button"
              aria-label={`ছবি ${index + 1}`}
              aria-current={active === index}
              onClick={() => setFocus(index, true)}
              className={cn(
                "h-2 rounded-full transition-all",
                active === index ? "w-5 bg-white" : "w-2 bg-white/45 hover:bg-white/75"
              )}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
