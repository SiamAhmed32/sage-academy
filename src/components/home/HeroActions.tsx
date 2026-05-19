"use client";

import Link from "next/link";
import { FaArrowRight } from "react-icons/fa6";

import { TrackedLink } from "@/components/engagement/TrackedLink";

export function HeroActions() {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
      <TrackedLink
        href="/admission"
        trackingLabel="hero_admission"
        className="inline-flex items-center justify-center gap-3 rounded-full bg-sage-primary px-7 py-4 text-base font-semibold text-sage-white shadow-lg transition hover:bg-sage-primary-hover"
      >
        ভর্তি আবেদন
        <FaArrowRight aria-hidden="true" />
      </TrackedLink>

      <TrackedLink
        href="/batches"
        trackingLabel="hero_batches"
        className="inline-flex items-center justify-center gap-3 rounded-full border border-sage-primary px-7 py-4 text-base font-semibold text-sage-primary transition hover:bg-sage-primary hover:text-sage-white"
      >
        ব্যাচ দেখুন
      </TrackedLink>
    </div>
  );
}
