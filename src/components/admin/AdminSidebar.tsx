"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { AdminNavIcon } from "@/components/admin/AdminNavIcon";
import { adminNavGroups } from "@/constants/admin";
import type { AuthUser } from "@/lib/auth";
import { cn } from "@/lib/utils";

type AdminSidebarProps = {
  user: AuthUser;
};

export function AdminSidebar({ user }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="hidden h-full min-h-0 bg-sage-primary text-white lg:flex lg:flex-col">
      <div className="shrink-0 border-b border-white/10 p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-sage-primary">
            S
          </div>
          <div>
            <h2 className="text-xl font-bold">SAGE Academy</h2>
            <p className="text-sm text-white/70">{user.role}</p>
          </div>
        </div>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-4 py-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/20">
        <div className="space-y-5 pb-8">
          {adminNavGroups.map((group) => (
            <div key={group.title}>
              <p className="mb-2 px-4 text-[11px] font-black uppercase tracking-[0.16em] text-white/80">
                {group.title}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/admin" && pathname.startsWith(item.href));

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-white/75 transition hover:bg-white/10 hover:text-white",
                        isActive && "bg-white text-sage-primary hover:bg-white hover:text-sage-primary"
                      )}
                    >
                      <AdminNavIcon href={item.href} icon={Icon} isActive={isActive} />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>
    </aside>
  );
}
