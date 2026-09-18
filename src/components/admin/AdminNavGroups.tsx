"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { usePathname } from "next/navigation";

import { AdminNavIcon } from "@/components/admin/AdminNavIcon";
import { SheetClose } from "@/components/ui/sheet";
import { adminNavGroups } from "@/constants/admin";
import { cn } from "@/lib/utils";

type AdminNavGroupsProps = {
  closeOnNavigate?: boolean;
};

function isNavItemActive(pathname: string, href: string) {
  return pathname === href || (href !== "/admin" && pathname.startsWith(href));
}

function isGroupActive(pathname: string, hrefs: string[]) {
  return hrefs.some((href) => isNavItemActive(pathname, href));
}

function getInitialOpenGroups(pathname: string) {
  return Object.fromEntries(
    adminNavGroups.map((group) => [
      group.title,
      group.items.length <= 1 ||
        isGroupActive(
          pathname,
          group.items.map((item) => item.href)
        ),
    ])
  ) as Record<string, boolean>;
}

function openActiveGroups(openGroups: Record<string, boolean>, pathname: string) {
  const next = { ...openGroups };

  for (const group of adminNavGroups) {
    if (
      isGroupActive(
        pathname,
        group.items.map((item) => item.href)
      )
    ) {
      next[group.title] = true;
    }
  }

  return next;
}

export function AdminNavGroups({ closeOnNavigate = false }: AdminNavGroupsProps) {
  const pathname = usePathname();
  const [navigationState, setNavigationState] = useState(() => ({
    pathname,
    openGroups: getInitialOpenGroups(pathname),
  }));

  if (navigationState.pathname !== pathname) {
    setNavigationState({
      pathname,
      openGroups: openActiveGroups(navigationState.openGroups, pathname),
    });
  }

  const openGroups = navigationState.openGroups;

  return (
    <div className="space-y-5 pb-8">
      {adminNavGroups.map((group, groupIndex) => {
        const collapsible = group.items.length > 1;
        const open = !collapsible || Boolean(openGroups[group.title]);
        const groupHasActiveItem = isGroupActive(
          pathname,
          group.items.map((item) => item.href)
        );
        const panelId = `admin-nav-group-${groupIndex}`;

        return (
          <div key={group.title}>
            {collapsible ? (
              <button
                type="button"
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() =>
                  setNavigationState((prev) => ({
                    pathname,
                    openGroups: {
                      ...prev.openGroups,
                      [group.title]: !prev.openGroups[group.title],
                    },
                  }))
                }
                className={cn(
                  "mb-2 flex w-full items-center justify-between gap-2 rounded-lg px-3 py-1.5 text-left text-[11px] font-bold uppercase tracking-[0.14em] text-gray-400 transition hover:bg-gray-50 hover:text-gray-600",
                  groupHasActiveItem && "text-gray-600"
                )}
              >
                <span>{group.title}</span>
                <ChevronDown
                  size={14}
                  strokeWidth={2.5}
                  className={cn("shrink-0 transition-transform duration-200", open && "rotate-180")}
                />
              </button>
            ) : (
              <p className="mb-2 px-4 text-[11px] font-bold uppercase tracking-[0.14em] text-gray-400">
                {group.title}
              </p>
            )}

            <div
              id={collapsible ? panelId : undefined}
              className={cn(
                "grid transition-[grid-template-rows] duration-200 ease-out",
                open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              )}
            >
              <div
                className={cn("min-h-0 space-y-1", collapsible && "overflow-hidden")}
                inert={collapsible && !open ? true : undefined}
                aria-hidden={collapsible && !open}
              >
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = isNavItemActive(pathname, item.href);
                  const link = (
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50 hover:text-gray-900",
                        isActive && "bg-sage-red-50 font-bold text-sage-primary hover:bg-sage-red-50 hover:text-sage-primary"
                      )}
                    >
                      <AdminNavIcon href={item.href} icon={Icon} isActive={isActive} />
                      {item.label}
                    </Link>
                  );

                  if (!closeOnNavigate) {
                    return <div key={item.href}>{link}</div>;
                  }

                  return (
                    <SheetClose asChild key={item.href}>
                      {link}
                    </SheetClose>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
