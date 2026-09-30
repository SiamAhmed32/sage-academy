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
      {/* Primary CTA */}
      <button
        type="button"
        onClick={handleFreeClassClick}
        className="sage-btn sage-btn-primary group max-w-full px-7"
      >
        <span>ফ্রি ক্লাস বুক করুন</span>
        <span className="flex shrink-0 items-center transition-transform duration-300 group-hover:translate-x-1">
          <FaArrowRight aria-hidden="true" className="text-xs" />
        </span>
      </button>

      {/* Secondary CTA */}
      <TrackedLink
        href="/batches"
        trackingLabel="hero_batches"
        className="sage-btn sage-btn-secondary group max-w-full px-7"
      >
        <span className="flex shrink-0 items-center text-sage-primary">
          <FaBookOpen aria-hidden="true" className="text-sm" />
        </span>
        <span>ব্যাচ সম্পর্কে জানুন</span>
      </TrackedLink>
    </div>
  );
}
