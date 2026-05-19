import { AlertTriangle, Calendar, Phone, User } from "lucide-react";

import type { StudentProfile } from "./types";

export function StudentProfileHero({ student, monthlyTotal }: { student: StudentProfile; monthlyTotal: number }) {
  const initials = student.nameEnglish?.slice(0, 1).toUpperCase() || "S";
  const subjectCount = student.selectedSubjects?.length || 0;
  const hasBatchClassMismatch = Boolean(
    student.classLevel &&
    student.batch?.classLevel &&
    Number(student.classLevel) !== Number(student.batch.classLevel)
  );

  return (
    <section className="overflow-hidden rounded-2xl border border-sage-border bg-white shadow-sm">
      <div className="grid gap-5 p-5 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="flex h-32 w-32 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-sage-border bg-sage-red-50 text-sage-primary shadow-inner">
          {student.image?.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={student.image.url}
              alt={student.nameEnglish}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2">
              <User className="h-8 w-8 opacity-50" />
              <span className="text-3xl font-black">{initials}</span>
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-2xl font-black text-sage-secondary">{student.nameEnglish}</h2>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-100">
              {student.isActive === false ? "Inactive" : "Active"}
            </span>
          </div>
          <p className="mt-1 text-sm text-sage-gray-500">{student.nameBangla || "বাংলা নাম নেই"}</p>
          <p className="mt-2 text-xs font-bold uppercase tracking-wider text-sage-primary">
            Student ID: {student.studentId}
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm text-sage-gray-600">
            <span className="inline-flex items-center gap-2">
              <Phone className="h-4 w-4 text-sage-primary" />
              {student.whatsapp || "ফোন নেই"}
            </span>
            <span className="inline-flex items-center gap-2">
              <Calendar className="h-4 w-4 text-sage-primary" />
              {student.admissionDate
                ? new Date(student.admissionDate).toLocaleDateString("bn-BD")
                : "তারিখ নেই"}
            </span>
          </div>
        </div>
      </div>
        <div className="grid gap-3 sm:grid-cols-3 lg:w-[420px] lg:grid-cols-1">
          <HeroStat label="Monthly payable" value={`৳${monthlyTotal}`} />
          <HeroStat label="Subjects" value={String(subjectCount)} />
          <HeroStat label="Batch" value={student.batch?.title || "Not assigned"} />
        </div>
      </div>
      {hasBatchClassMismatch && (
        <div className="border-t border-amber-200 bg-amber-50 px-5 py-3 text-sm font-semibold text-amber-900">
          <span className="inline-flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Class/batch mismatch: student class {student.classLevel}, batch class {student.batch?.classLevel}. Edit the student and choose a matching batch.
          </span>
        </div>
      )}
    </section>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-sage-red-50/50 p-3 ring-1 ring-sage-border">
      <p className="text-xs font-bold uppercase tracking-widest text-sage-gray-500">{label}</p>
      <p className="mt-1 truncate text-lg font-black text-sage-secondary">{value}</p>
    </div>
  );
}
