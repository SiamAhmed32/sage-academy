"use client";

import { heroStats } from "@/constants/hero";
import CountUp from "@/components/ui/CountUp";

type HeroStat = (typeof heroStats)[number];

function hasCountUpValue(item: HeroStat): item is HeroStat & { countTo: number; suffix: string } {
  return typeof item.countTo === "number";
}

// Icon SVGs inline — no extra dep, perfectly sized
const StatIcons = [
  // Graduation cap
  () => (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5" aria-hidden="true">
      <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zm5.99 7.176A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
    </svg>
  ),
  // Star / teacher
  () => (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5" aria-hidden="true">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  ),
  // Calendar / weekly
  () => (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
        clipRule="evenodd"
      />
    </svg>
  ),
];

export function HeroStats() {
  return (
    <div className="mt-9 border-t border-sage-red-100 pt-8">
      <div className="flex flex-wrap items-stretch gap-3 sm:gap-4">
        {heroStats.map((item, index) => {
          const Icon = StatIcons[index % StatIcons.length];
          return (
            <div
              key={item.label}
              className="group flex min-w-[100px] flex-1 items-center gap-3 rounded-2xl border border-sage-red-100/70 bg-white/70 px-4 py-3.5 shadow-sm shadow-sage-red-100/20 backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:border-sage-primary/20 hover:shadow-md hover:shadow-sage-red-100/40"
            >
              {/* Icon bubble */}
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sage-primary/8 text-sage-primary transition-colors duration-200 group-hover:bg-sage-primary/12">
                <Icon />
              </span>
              <div className="min-w-0">
                <p className="bn-headline text-xl font-bold leading-tight text-sage-secondary sm:text-2xl">
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
                </p>
                <p className="bn-pill mt-0.5 text-xs font-medium text-sage-gray-500 sm:text-sm">
                  {item.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
