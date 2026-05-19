"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { navItems } from "@/constants/navbar";
import { cn } from "@/lib/utils";

type NavLinksProps = {
  direction?: "row" | "column";
  onNavigate?: () => void;
};

export function NavLinks({ direction = "row", onNavigate }: NavLinksProps) {
  const pathname = usePathname();
  const isColumn = direction === "column";

  return (
    <ul className={cn("flex gap-1", isColumn ? "flex-col" : "items-center")}>
      {navItems.map((item) => {
        const isActive = pathname === item.href;

        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "block rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200",
                isActive
                  ? "bg-sage-red-50 text-sage-primary"
                  : "text-sage-gray-700 hover:bg-sage-red-50 hover:text-sage-primary",
                isColumn && "rounded-lg px-3 py-2.5 text-base"
              )}
            >
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
