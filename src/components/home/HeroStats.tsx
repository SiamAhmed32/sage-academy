import { FaBookOpen, FaUserGraduate } from "react-icons/fa6";

import { heroStats } from "@/constants/hero";

const statIcons = {
  graduate: FaUserGraduate,
  book: FaBookOpen,
};

export function HeroStats() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:gap-4">
      {heroStats.map((item) => {
        const Icon = statIcons[item.icon as keyof typeof statIcons];

        return (
          <div
            key={item.label}
            className="flex items-center gap-3 rounded-2xl bg-sage-white px-4 py-4 shadow-sm ring-1 ring-sage-red-100 sm:px-5"
          >
            <span className="flex size-11 items-center justify-center rounded-full bg-sage-red-50 text-sage-primary">
              <Icon aria-hidden="true" />
            </span>

            <span>
              <span className="block text-xl font-bold text-sage-secondary">
                {item.value}
              </span>
              <span className="block text-sm font-medium text-sage-gray-500">
                {item.label}
              </span>
            </span>
          </div>
        );
      })}
    </div>
  );
}
