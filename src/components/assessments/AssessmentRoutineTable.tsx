"use client";

import { useMemo, useState } from "react";
import { CalendarDays, Download, Loader2 } from "lucide-react";
import { toast } from "react-toastify";

import type { ClassRoutineEntry } from "@/components/shared/class-routine-paper";
import { downloadClassRoutinePdf, pdfSafeText } from "@/lib/class-routine-pdf";
import type { PublicAssessment } from "@/lib/assessments";

export type RoutineEntry = ClassRoutineEntry;

type Props = {
  assessment: Pick<
    PublicAssessment,
    "slug" | "routineTitle" | "routineSubtitle" | "classLabel" | "scheduleNote" | "title" | "kind"
  >;
  routine?: RoutineEntry[];
  classLabel?: string;
  classLevel?: number;
};

export function AssessmentRoutineTable({ assessment, routine: routineProp, classLabel, classLevel }: Props) {
  const [downloading, setDownloading] = useState(false);
  const routine = routineProp || [];

  const title = useMemo(
    () => assessment.routineTitle || assessment.title,
    [assessment.routineTitle, assessment.title]
  );
  const subtitle = useMemo(
    () => assessment.routineSubtitle || classLabel || assessment.classLabel,
    [assessment.routineSubtitle, classLabel, assessment.classLabel]
  );
  const downloadLabel =
    assessment.kind === "exam" ? "Download Exam Schedule" : "Download Exam Schedule";
  const downloadLabelBn = assessment.kind === "exam" ? "পরীক্ষার সময়সূচি ডাউনলোড" : "ক্লাস রুটিন ডাউনলোড";

  function downloadRoutine() {
    if (!routine.length) {
      toast.error("এই শ্রেণির জন্য রুটিন এখনো সেট করা নেই");
      return;
    }

    setDownloading(true);
    try {
      downloadClassRoutinePdf({
        title: pdfSafeText(title, "Class Routine"),
        subtitle: pdfSafeText(subtitle, ""),
        footer: assessment.scheduleNote ? pdfSafeText(assessment.scheduleNote, "") : undefined,
        entries: routine,
        filename: `${assessment.slug}${classLevel ? `-class-${classLevel}` : ""}-routine.pdf`,
      });
      toast.success("রুটিন PDF ডাউনলোড হয়েছে");
    } catch {
      toast.error("রুটিন ডাউনলোড করা যায়নি");
    } finally {
      setDownloading(false);
    }
  }

  if (!routine.length) return null;

  return (
    <section className="rounded-3xl border border-sage-warm-border bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-sage-primary">Routine</p>
          <h2 className="mt-2 text-2xl font-black text-sage-secondary">ক্লাস রুটিন</h2>
          <p className="mt-2 max-w-xl text-sm font-semibold leading-6 text-sage-gray-500">
            {classLabel ? `${classLabel} — ` : ""}
            অফিসিয়াল রুটিন PDF ডাউনলোড করুন।
          </p>
        </div>

        <button
          type="button"
          onClick={downloadRoutine}
          disabled={downloading}
          className="inline-flex shrink-0 items-center justify-center gap-2.5 rounded-2xl border border-sage-primary bg-sage-primary px-5 py-3.5 text-sm font-black text-white shadow-sm transition hover:bg-sage-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {downloading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          <span className="flex flex-col items-start leading-tight">
            <span>{downloadLabel}</span>
            <span className="text-[11px] font-bold text-white/85">{downloadLabelBn}</span>
          </span>
          <CalendarDays className="hidden h-4 w-4 opacity-80 sm:block" />
        </button>
      </div>
    </section>
  );
}
