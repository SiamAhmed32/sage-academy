import { CalendarDays, MapPin, Phone, UserRound } from "lucide-react";
import Image from "next/image";

import { StudentPageHeader } from "@/components/student/StudentPageHeader";
import { formatStudentEnrollment } from "@/lib/student-display";
import { getStudentContext } from "@/lib/student-dashboard";

export default async function StudentProfilePage() {
  const ctx = await getStudentContext();
  if ("problem" in ctx) return null;

  const student = ctx.student;
  const displayName = student.nameBangla || student.nameEnglish;
  const phone = student.whatsapp || student.phone || "নম্বর যুক্ত নেই";
  const enrollment = formatStudentEnrollment(student.classLevel, student.batch);
  const subjects = (student.selectedSubjects ?? [])
    .map((subject: { subjectName?: string }) => subject.subjectName)
    .filter(Boolean);

  return (
    <section className="space-y-6">
      <StudentPageHeader
        title="আমার প্রোফাইল"
        description="আপনার ভর্তি তথ্য, যোগাযোগ ও ভর্তি করা বিষয়গুলো এক জায়গায় দেখুন।"
      />

      <article className="rounded-xl border border-sage-border bg-white p-6 shadow-sm">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-center">
          {student.image?.url ? (
            <Image
              src={student.image.url}
              alt={displayName}
              width={96}
              height={96}
              className="h-24 w-24 rounded-2xl object-cover ring-1 ring-sage-border"
            />
          ) : (
            <span className="flex h-24 w-24 items-center justify-center rounded-2xl bg-sage-red-50 text-4xl font-black text-sage-primary">
              {displayName.charAt(0)}
            </span>
          )}
          <div>
            <h3 className="text-3xl font-black text-sage-secondary">{displayName}</h3>
            <p className="mt-1 text-sm font-semibold text-sage-gray-500">Student ID: {student.studentId}</p>
            <p className="mt-2 text-sm text-sage-gray-600">শ্রেণি: {enrollment.classLabel}</p>
            <p className="mt-1 text-sm text-sage-gray-600">ব্যাচ কোড: {enrollment.batchCode}</p>
          </div>
        </header>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <p className="flex items-start gap-3 rounded-xl bg-sage-red-50/50 p-4 text-sm text-sage-gray-700">
            <Phone className="mt-0.5 h-5 w-5 shrink-0 text-sage-primary" />
            <span>
              <strong className="block text-sage-secondary">যোগাযোগ</strong>
              {phone}
            </span>
          </p>
          <p className="flex items-start gap-3 rounded-xl bg-sage-red-50/50 p-4 text-sm text-sage-gray-700">
            <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-sage-primary" />
            <span>
              <strong className="block text-sage-secondary">ভর্তির বছর</strong>
              {student.admissionYear || "-"}
            </span>
          </p>
          <p className="flex items-start gap-3 rounded-xl bg-sage-red-50/50 p-4 text-sm text-sage-gray-700">
            <UserRound className="mt-0.5 h-5 w-5 shrink-0 text-sage-primary" />
            <span>
              <strong className="block text-sage-secondary">অভিভাবক</strong>
              {student.guardianName || student.fatherName || "তথ্য নেই"}
              {student.guardianPhone ? ` · ${student.guardianPhone}` : ""}
            </span>
          </p>
          <p className="flex items-start gap-3 rounded-xl bg-sage-red-50/50 p-4 text-sm text-sage-gray-700">
            <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-sage-primary" />
            <span>
              <strong className="block text-sage-secondary">ঠিকানা</strong>
              {student.presentAddress || student.permanentAddress || "তথ্য নেই"}
            </span>
          </p>
        </div>

        <section className="mt-8">
          <h4 className="text-lg font-bold text-sage-secondary">ভর্তি করা বিষয়</h4>
          {subjects.length ? (
            <ul className="mt-4 flex flex-wrap gap-2">
              {subjects.map((subject: string) => (
                <li
                  key={subject}
                  className="rounded-full bg-sage-red-50 px-4 py-2 text-sm font-semibold text-sage-primary"
                >
                  {subject}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-sage-gray-500">এখনও কোনো বিষয় যুক্ত নেই।</p>
          )}
        </section>
      </article>
    </section>
  );
}
