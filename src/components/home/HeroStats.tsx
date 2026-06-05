"use client";

import { FaBookOpen, FaClipboardCheck, FaUserGraduate } from "react-icons/fa6";

import { heroStats } from "@/constants/hero";
import CountUp from "@/components/ui/CountUp";

const statIcons = {
  graduate: FaUserGraduate,
  book: FaBookOpen,
  exam: FaClipboardCheck,
};

type HeroStat = (typeof heroStats)[number];

function hasCountUpValue(item: HeroStat): item is HeroStat & { countTo: number; suffix: string } {
  return typeof item.countTo === "number";
}

export function HeroStats() {
  return (
    <div className="grid grid-cols-3 gap-2.5 sm:flex sm:flex-wrap sm:gap-3">
      {heroStats.map((item) => {
        const Icon = statIcons[item.icon as keyof typeof statIcons];

        return (
          <div
            key={item.label}
            className="min-w-0 rounded-2xl border border-sage-red-100 bg-white/82 px-3 py-3 shadow-sm shadow-sage-red-100/25 backdrop-blur sm:flex sm:items-center sm:gap-3 sm:px-4 sm:py-4"
          >
            <span className="mx-auto flex size-10 items-center justify-center rounded-full bg-sage-red-50 text-sage-primary sm:mx-0">
              <Icon aria-hidden="true" />
            </span>

            <span className="mt-2 block text-center sm:mt-0 sm:text-left">
              <span className="block text-lg font-bold leading-6 text-sage-secondary sm:text-xl">
                {hasCountUpValue(item) ? (
                  <>
                    <CountUp
                      from={0}
                      to={item.countTo}
                      locale="bn-BD"
                      duration={1.4}
                      className="tabular-nums"
                    />
                    {item.suffix}
                  </>
                ) : (
                  item.value
                )}
              </span>
              <span className="block text-xs font-medium leading-5 text-sage-gray-500 sm:text-sm">
                {item.label}
              </span>
            </span>
          </div>
        );
      })}
    </div>
  );
}
