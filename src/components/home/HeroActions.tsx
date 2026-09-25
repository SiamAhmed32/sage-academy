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
        className="group bn-text relative inline-flex min-h-[3.5rem] max-w-full items-center justify-center gap-3 overflow-hidden rounded-xl bg-sage-primary px-7 py-3.5 text-base font-semibold leading-normal text-sage-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_8px_20px_-8px_rgba(122,20,28,0.55)] transition-all duration-300 hover:bg-sage-primary-hover hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_12px_24px_-10px_rgba(122,20,28,0.65)] active:scale-[0.98]"
      >
        {/* shimmer sweep */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full"
        />
        <span>ফ্রি ক্লাস বুক করুন</span>
        <span className="flex shrink-0 items-center transition-transform duration-300 group-hover:translate-x-1">
          <FaArrowRight aria-hidden="true" className="text-xs" />
        </span>
      </button>

      {/* Secondary CTA */}
      <TrackedLink
        href="/batches"
        trackingLabel="hero_batches"
        className="bn-text group inline-flex min-h-[3.5rem] max-w-full items-center justify-center gap-2.5 rounded-xl border border-sage-gray-300/80 bg-white px-7 py-3.5 text-base font-semibold leading-normal text-sage-secondary transition-all duration-300 hover:border-sage-primary/40 hover:text-sage-primary active:scale-[0.98]"
      >
        <span className="flex shrink-0 items-center text-sage-primary">
          <FaBookOpen aria-hidden="true" className="text-sm" />
        </span>
        <span>ব্যাচ সম্পর্কে জানুন</span>
      </TrackedLink>
    </div>
  );
}
