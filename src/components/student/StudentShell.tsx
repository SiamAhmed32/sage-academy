import type { ReactNode } from "react";

import type { AuthUser } from "@/lib/auth";
import { StudentSidebar } from "@/components/student/StudentSidebar";
import { StudentTopbar } from "@/components/student/StudentTopbar";

type StudentShellProps = {
  user: AuthUser;
  student: StudentShellStudent | null;
  children: ReactNode;
};

export type StudentShellStudent = {
  nameEnglish: string;
  nameBangla?: string;
  studentId: string;
  classLevel?: number;
  batch?: { title?: string; batchCode?: string } | null;
  image?: { url?: string };
};

export function StudentShell({ user, student, children }: StudentShellProps) {
  return (
    <div className="fixed inset-0 z-[100] overflow-hidden bg-sage-admin-bg text-sage-gray-700">
      <div className="grid h-full grid-cols-1 lg:grid-cols-[280px_1fr]">
        <StudentSidebar user={user} student={student} />
        <div className="flex min-w-0 flex-col overflow-hidden">
          <StudentTopbar user={user} student={student} />
          <main className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 lg:px-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
