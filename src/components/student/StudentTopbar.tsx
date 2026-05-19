"use client";

import Link from "next/link";
import { ExternalLink, LogOut } from "lucide-react";
import { usePathname } from "next/navigation";

import { studentLogoutAction } from "@/app/student/actions";
import { studentNavItems } from "@/constants/student";
import type { AuthUser } from "@/lib/auth";
import { StudentMobileSidebar } from "./StudentMobileSidebar";
import type { StudentShellStudent } from "./StudentShell";

type StudentTopbarProps = {
  user: AuthUser;
  student: StudentShellStudent | null;
};

function pageTitle(pathname: string) {
  const match = studentNavItems.find(
    (item) => pathname === item.href || (item.href !== "/student" && pathname.startsWith(item.href))
  );
  return match?.label ?? "শিক্ষার্থী পোর্টাল";
}

export function StudentTopbar({ user, student }: StudentTopbarProps) {
  const pathname = usePathname();
  const title = pageTitle(pathname);

  return (
    <header className="flex min-h-16 items-center justify-between gap-3 border-b border-sage-border bg-sage-white px-4 sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <StudentMobileSidebar user={user} student={student} />

        <div className="min-w-0">
          <p className="truncate text-xs font-semibold uppercase text-sage-gray-500">
            SAGE Academy · শিক্ষার্থী
          </p>
          <h1 className="truncate text-lg font-bold text-sage-secondary">{title}</h1>
          {student && (
            <p className="truncate text-xs text-sage-gray-500">ID: {student.studentId}</p>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Link
          href="/"
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-sage-border px-3 text-sm font-semibold text-sage-secondary"
        >
          <ExternalLink size={16} />
          <span className="hidden sm:inline">ওয়েবসাইট</span>
        </Link>

        <form action={studentLogoutAction}>
          <button
            type="submit"
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-sage-primary px-3 text-sm font-semibold text-sage-white"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">লগআউট</span>
          </button>
        </form>
      </div>
    </header>
  );
}
