import { CalendarDays, Phone } from "lucide-react";
import Image from "next/image";

import { toBanglaDigits } from "@/constants/class-levels";

type StudentHeroProps = {
  student: {
    nameEnglish: string;
    nameBangla?: string;
    studentId: string;
    classLevel?: number;
    batch?: { title?: string } | null;
    phone?: string;
    whatsapp?: string;
    image?: { url?: string };
  };
};

export function StudentDashboardHero({ student }: StudentHeroProps) {
  const displayName = student.nameBangla || student.nameEnglish;
  const phone = student.whatsapp || student.phone || "নম্বর যুক্ত নেই";

  return (
    <section className="rounded-2xl border border-sage-border bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          {student.image?.url ? (
            <Image
              src={student.image.url}
              alt={displayName}
              width={80}
              height={80}
              className="h-20 w-20 rounded-2xl object-cover ring-1 ring-sage-border"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-sage-red-50 text-3xl font-black text-sage-primary">
              {displayName.charAt(0)}
            </div>
          )}
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-sage-gray-500">
              আমার ড্যাশবোর্ড
            </p>
            <h1 className="mt-1 text-3xl font-black text-sage-secondary sm:text-4xl">
              {displayName}
            </h1>
            <p className="mt-1 text-sm font-semibold text-sage-gray-600">
              Student ID: {student.studentId}
            </p>
          </div>
        </div>

        <div className="grid gap-3 text-sm font-bold text-sage-secondary sm:min-w-72">
          <div className="flex items-center gap-3 rounded-xl bg-sage-red-50 px-4 py-3">
            <CalendarDays className="h-5 w-5 text-sage-primary" />
            ক্লাস {student.classLevel ? toBanglaDigits(student.classLevel) : "-"} · {student.batch?.title || "ব্যাচ যুক্ত নেই"}
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-sage-red-50 px-4 py-3">
            <Phone className="h-5 w-5 text-sage-primary" />
            {phone}
          </div>
        </div>
      </div>
    </section>
  );
}
