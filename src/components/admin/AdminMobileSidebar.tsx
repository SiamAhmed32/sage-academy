"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";

import { AdminNavIcon } from "@/components/admin/AdminNavIcon";
import { adminNavGroups } from "@/constants/admin";
import type { AuthUser } from "@/lib/auth";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

type AdminMobileSidebarProps = {
  user: AuthUser;
};

export function AdminMobileSidebar({ user }: AdminMobileSidebarProps) {
  const pathname = usePathname();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-sage-border text-sage-secondary lg:hidden"
          aria-label="Open admin navigation"
        >
          <Menu size={20} />
        </button>
      </SheetTrigger>

      <SheetContent
        side="left"
        className="flex w-[280px] flex-col gap-0 border-sage-primary bg-sage-primary p-0 text-sage-white"
      >
        <div className="shrink-0 border-b border-sage-white/10 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-sage-white text-sage-primary">
              S
            </div>
            <div>
              <h2 className="text-lg font-bold text-sage-white">
                SAGE Academy
              </h2>
              <p className="text-sm text-sage-white/70">{user.role}</p>
            </div>
          </div>
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto p-4">
          <div className="space-y-5 pb-8">
            {adminNavGroups.map((group) => (
              <div key={group.title}>
                <p className="mb-2 px-4 text-[11px] font-black uppercase tracking-[0.16em] text-sage-white/80">
                  {group.title}
                </p>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      pathname === item.href ||
                      (item.href !== "/admin" && pathname.startsWith(item.href));

                    return (
                      <SheetClose asChild key={item.href}>
                        <Link
                          href={item.href}
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-sage-white/75 transition hover:bg-white/10 hover:text-white",
                            isActive && "bg-sage-white text-sage-primary hover:bg-sage-white hover:text-sage-primary"
                          )}
                        >
                          <AdminNavIcon href={item.href} icon={Icon} isActive={isActive} />
                          {item.label}
                        </Link>
                      </SheetClose>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
