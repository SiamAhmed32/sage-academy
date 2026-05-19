import Image from "next/image";

import type { AuthUser } from "@/lib/auth";
import { formatStudentEnrollment } from "@/lib/student-display";
import type { StudentShellStudent } from "./StudentShell";

type StudentSidebarHeaderProps = {
  user: AuthUser;
  student: StudentShellStudent | null;
  compact?: boolean;
};

export function StudentSidebarHeader({ user, student, compact }: StudentSidebarHeaderProps) {
  const displayName = student?.nameBangla || student?.nameEnglish || user.name;
  const enrollment = student ? formatStudentEnrollment(student.classLevel, student.batch) : null;
  const avatarSize = compact ? "h-10 w-10 text-sm" : "h-12 w-12 text-lg";
  const nameClass = compact ? "text-sm font-bold" : "text-lg font-bold";

  return (
    <div className={compact ? "rounded-xl bg-white/10 p-3" : "rounded-xl bg-white/10 p-4"}>
      <div className="flex items-center gap-3">
        {student?.image?.url ? (
          <Image
            src={student.image.url}
            alt={displayName}
            width={compact ? 40 : 48}
            height={compact ? 40 : 48}
            className={`${avatarSize} shrink-0 rounded-xl object-cover ring-2 ring-white/20`}
          />
        ) : (
          <div
            className={`flex shrink-0 items-center justify-center rounded-xl bg-white font-black text-sage-primary ${avatarSize}`}
          >
            {displayName.charAt(0)}
          </div>
        )}
        <div className="min-w-0">
          <h2 className={`truncate ${nameClass}`}>{displayName}</h2>
          <p className="text-xs text-white/70">শিক্ষার্থী পোর্টাল</p>
          {student ? (
            <div className="mt-1 space-y-0.5">
              <p className="truncate text-xs text-white/70">{enrollment?.classLabel}</p>
              <p className="truncate text-xs text-white/60">ব্যাচ: {enrollment?.batchCode}</p>
              <p className="truncate text-xs text-white/60">ID: {student.studentId}</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

