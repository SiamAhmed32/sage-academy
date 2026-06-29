"use client";

import { FaArrowRight, FaBookOpen } from "react-icons/fa6";

import { TrackedLink } from "@/components/engagement/TrackedLink";
import { trackEngagementEvent } from "@/lib/engagement-tracker";
import { openFreeClassModal } from "@/lib/free-class-modal";

export function HeroActions() {
  function handleFreeClassClick() {
    void trackEngagementEvent({
      eventType: "cta_click",
      label: "hero_free_class",
      path: typeof window !== "undefined" ? window.location.pathname : "",
    });
    openFreeClassModal();
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
      {/* Primary CTA — glowing shimmer button */}
      <button
        type="button"
        onClick={handleFreeClassClick}
        className="group bn-text relative inline-flex min-h-[3.75rem] items-center justify-center gap-3 overflow-hidden rounded-full bg-sage-primary px-8 py-4 text-base font-semibold leading-normal text-sage-white shadow-lg shadow-sage-primary/30 transition-all duration-300 hover:-translate-y-0.5 hover:bg-sage-primary-hover hover:shadow-xl hover:shadow-sage-primary/40 active:translate-y-0"
      >
        {/* shimmer sweep */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full"
        />
        ফ্রি ক্লাস বুক করুন
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 transition-transform duration-300 group-hover:translate-x-1">
          <FaArrowRight aria-hidden="true" className="text-xs" />
        </span>
      </button>

      {/* Secondary CTA */}
      <TrackedLink
        href="/batches"
        trackingLabel="hero_batches"
        className="bn-text group inline-flex min-h-[3.75rem] items-center justify-center gap-3 rounded-full border-2 border-sage-primary/30 bg-white/80 px-8 py-4 text-base font-semibold leading-normal text-sage-primary shadow-sm backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:border-sage-primary hover:bg-sage-red-50 hover:shadow-md hover:shadow-sage-red-100/50 active:translate-y-0"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-sage-primary/10 transition-all duration-300 group-hover:bg-sage-primary group-hover:text-white">
          <FaBookOpen aria-hidden="true" className="text-xs" />
        </span>
        ব্যাচ সম্পর্কে জানুন
      </TrackedLink>
    </div>
  );
}
