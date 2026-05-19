import type { ReactNode } from "react";

import { StudentAccessProblem } from "@/components/student/StudentAccessProblem";
import { StudentShell } from "@/components/student/StudentShell";
import { getStudentContext } from "@/lib/student-dashboard";

export default async function StudentLayout({ children }: { children: ReactNode }) {
  const ctx = await getStudentContext();

  if ("problem" in ctx) {
    return (
      <StudentShell user={ctx.user} student={null}>
        <StudentAccessProblem problem={ctx.problem} />
      </StudentShell>
    );
  }

  return (
    <StudentShell user={ctx.user} student={ctx.student}>
      {children}
    </StudentShell>
  );
}
