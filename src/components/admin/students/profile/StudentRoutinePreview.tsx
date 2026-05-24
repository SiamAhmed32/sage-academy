"use client";

import { useMemo, useState } from "react";
import { CalendarDays, Clock, Download, Loader2, Users } from "lucide-react";
import { toast } from "react-toastify";

import { toBanglaDigits } from "@/constants/class-levels";
import { downloadClassRoutinePdf, pdfSafeText } from "@/lib/class-routine-pdf";
import {
  buildStudentRoutinePdfMeta,
  countWeeklyClasses,
  routineItemsToPaperEntries,
} from "@/lib/student-routine-pdf";

import type { RoutineItem } from "./types";

type StudentRoutinePreviewProps = {
  routine: RoutineItem[];
  studentName: string;
  studentId: string;
  studentNameEnglish?: string;
  batchTitle?: string;
  batchCode?: string;
  classLevel?: number;
  routineNote?: string;
};

export function StudentRoutinePreview({
  routine,
  studentName,
  studentId,
  studentNameEnglish,
  batchTitle,
  batchCode,
  classLevel,
  routineNote,
}: StudentRoutinePreviewProps) {
  const preview = routine.slice(0, 6);
  const [downloading, setDownloading] = useState(false);

  const pdfMeta = useMemo(
    () =>
      buildStudentRoutinePdfMeta({
        studentName: studentNameEnglish || studentName,
        studentId,
        batchTitle,
        batchCode,
        classLevel,
        routineNote,
      }),
    [studentName, studentNameEnglish, studentId, batchTitle, batchCode, classLevel, routineNote]
  );

  const paperEntries = useMemo(() => routineItemsToPaperEntries(routine), [routine]);
  const classCount = countWeeklyClasses(routine);

  function downloadRoutine() {
    if (!routine.length) {
      toast.error("রুটিন সেট করা নেই — আগে ব্যাচ রুটিন আপডেট করুন");
      return;
    }

    setDownloading(true);
    try {
      downloadClassRoutinePdf({
        title: pdfSafeText(
          pdfMeta.title,
          classLevel ? `Class ${classLevel}` : batchCode ? `Batch ${batchCode}` : "Class Routine"
        ),
        subtitle: pdfMeta.subtitle,
        studentLine: pdfMeta.studentLine,
        classCountLine: `${classCount} scheduled class${classCount === 1 ? "" : "es"} per week`,
        footer: pdfMeta.footer,
        entries: paperEntries,
        filename: pdfMeta.filename,
      });
      toast.success("ক্লাস রুটিন PDF ডাউনলোড হয়েছে");
    } catch (error) {
      console.error("Routine PDF failed:", error);
      toast.error("রুটিন ডাউনলোড করা যায়নি");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-sage-border bg-white shadow-sm">
      <div className="grid gap-3 border-b border-sage-border bg-sage-red-50/40 p-4 lg:grid-cols-[1fr_auto_auto] lg:items-center">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-bold text-sage-secondary">
            <CalendarDays className="h-5 w-5 text-sage-primary" />
            Class routine
          </h3>
          <p className="mt-1 text-sm text-sage-gray-500">
            Weekly class times from this student&apos;s batch routine.
          </p>
        </div>
        <div className="rounded-xl border border-sage-border bg-white px-4 py-3 text-sm font-bold text-sage-secondary">
          {toBanglaDigits(classCount)} scheduled class{classCount === 1 ? "" : "es"}
        </div>
        <button
          type="button"
          onClick={downloadRoutine}
          disabled={downloading || !routine.length}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-sage-primary bg-sage-primary px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-sage-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {downloading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Download routine PDF
        </button>
      </div>

      <div className="grid gap-3 p-4 md:grid-cols-2 2xl:grid-cols-3">
        {preview.length ? (
          preview.map((item) => (
            <div
              key={`${item.day}-${item.subjectName}-${item.startTime}`}
              className="grid gap-3 rounded-xl border border-sage-border bg-white p-4 transition hover:border-sage-primary/40 hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-black text-sage-secondary">{item.subjectName}</p>
                  <p className="mt-1 flex items-center gap-2 text-xs text-sage-gray-500">
                    <Users className="h-3.5 w-3.5 text-sage-primary" />
                    {item.teacherName}
                  </p>
                </div>
                <div className="shrink-0 rounded-lg bg-sage-red-50 px-3 py-2 text-sm font-bold text-sage-primary">
                  {item.dayBn}
                </div>
              </div>
              <p className="flex items-center gap-2 rounded-lg bg-sage-red-50/30 px-3 py-2 text-xs font-semibold text-sage-gray-600">
                <Clock className="h-3.5 w-3.5 text-sage-primary" />
                {item.startTime} - {item.endTime}
              </p>
            </div>
          ))
        ) : (
          <p className="rounded-xl border border-dashed border-sage-border p-8 text-center text-sm text-sage-gray-500 md:col-span-2 2xl:col-span-3">
            No routine configured for this batch yet. Add subjects, days, and times in batch routine.
          </p>
        )}
      </div>

      {routine.length > 6 ? (
        <details className="border-t border-sage-border p-4">
          <summary className="cursor-pointer text-sm font-bold text-sage-primary">
            View full weekly routine ({toBanglaDigits(routine.length)})
          </summary>
          <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {routine.slice(6).map((item) => (
              <p
                key={`${item.day}-${item.subjectName}-${item.startTime}`}
                className="rounded-lg bg-sage-red-50/40 p-3 text-sm text-sage-secondary"
              >
                {item.dayBn}: {item.subjectName} · {item.startTime} - {item.endTime}
              </p>
            ))}
          </div>
        </details>
      ) : null}
    </section>
  );
}
