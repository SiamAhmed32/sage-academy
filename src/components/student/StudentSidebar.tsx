"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { studentNavGroups } from "@/constants/student";
import type { AuthUser } from "@/lib/auth";
import { cn } from "@/lib/utils";
import type { StudentShellStudent } from "./StudentShell";
import { StudentSidebarHeader } from "./StudentSidebarHeader";

type StudentSidebarProps = {
  user: AuthUser;
  student: StudentShellStudent | null;
};

export function StudentSidebar({ user, student }: StudentSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="hidden h-full min-h-0 bg-sage-primary text-white lg:flex lg:flex-col">
      <div className="shrink-0 border-b border-white/10 p-6">
        <StudentSidebarHeader user={user} student={student} />
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-4 py-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/20">
        <div className="space-y-5 pb-8">
          {studentNavGroups.map((group) => (
            <div key={group.title}>
              <p className="mb-2 px-4 text-[11px] font-black uppercase tracking-[0.16em] text-white/80">
                {group.title}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/student" && pathname.startsWith(item.href));

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold text-white/75 transition hover:bg-white/10 hover:text-white",
                        isActive && "bg-white text-sage-primary hover:bg-white hover:text-sage-primary"
                      )}
                    >
                      <Icon size={18} />
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

