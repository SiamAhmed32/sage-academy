"use client";

import { useMemo, useRef, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "react-toastify";

import type { PublicAssessment } from "@/lib/assessments";

export type RoutineEntry = { day: string; time: string; subject: string };

type RoutinePaperProps = {
  title: string;
  subtitle?: string;
  footer?: string;
  routine: RoutineEntry[];
};

type Props = {
  assessment: PublicAssessment;
};

const dayOrder = ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const hatchStyle = {
  backgroundImage:
    "repeating-linear-gradient(0deg, rgba(0,0,0,.12) 0, rgba(0,0,0,.12) 1px, transparent 1px, transparent 4px), repeating-linear-gradient(90deg, rgba(0,0,0,.12) 0, rgba(0,0,0,.12) 1px, transparent 1px, transparent 4px)",
};

function orderedDays(routine: RoutineEntry[]) {
  const unique = [...new Set(routine.map((entry) => entry.day))];
  return unique.sort((a, b) => {
    const ai = dayOrder.indexOf(a);
    const bi = dayOrder.indexOf(b);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });
}

function orderedTimes(routine: RoutineEntry[]) {
  return [...new Set(routine.map((entry) => entry.time))];
}

export function RoutinePaper({ title, subtitle, footer, routine }: RoutinePaperProps) {
  const days = useMemo(() => orderedDays(routine), [routine]);
  const times = useMemo(() => orderedTimes(routine), [routine]);

  return (
    <div className="bg-white p-6 text-black">
      <div className="mb-5 text-center font-sans text-black">
        <h3 className="text-4xl font-black leading-none tracking-normal">Class Routine</h3>
        <p className="mt-3 text-2xl font-black leading-tight">{title}</p>
        {subtitle ? <p className="mt-1 text-xl font-black leading-tight">{subtitle}</p> : null}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse table-fixed text-center font-sans text-[15px] text-black">
          <tbody>
            {days.map((day) => (
              <tr key={day}>
                <th className="w-32 border-2 border-black bg-white p-3 text-left text-lg font-black text-black">
                  {day}
                </th>
                {times.map((time) => {
                  const entry = routine.find((item) => item.day === day && item.time === time);
                  return (
                    <td key={`${day}-${time}`} className="border-2 border-black p-0 align-stretch">
                      {entry ? (
                        <div className="grid min-h-[74px] grid-rows-2">
                          <div className="flex items-center justify-center border-b-2 border-black px-2 text-base font-black text-black" style={hatchStyle}>
                            {entry.subject}
                          </div>
                          <div className="flex items-center justify-center px-2 text-base font-bold text-black">
                            {time}
                          </div>
                        </div>
                      ) : (
                        <div className="min-h-[74px]" />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
            {footer ? (
              <tr>
                <td colSpan={times.length + 1} className="border-2 border-black bg-white p-4 text-center text-lg font-black text-black">
                  {footer}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export async function downloadRoutineElement(element: HTMLElement, filename: string) {
  const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);
  const canvas = await html2canvas(element, {
    scale: 2,
    backgroundColor: "#ffffff",
    useCORS: true,
  });
  const image = canvas.toDataURL("image/png");
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const ratio = Math.min((pageWidth - 36) / canvas.width, (pageHeight - 36) / canvas.height);
  const width = canvas.width * ratio;
  const height = canvas.height * ratio;
  doc.addImage(image, "PNG", (pageWidth - width) / 2, 18, width, height);
  doc.save(filename);
}

export function AssessmentRoutineTable({ assessment }: Props) {
  const routineRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  async function downloadRoutine() {
    if (!routineRef.current) return;
    setDownloading(true);
    try {
      await downloadRoutineElement(routineRef.current, `${assessment.slug}-routine.pdf`);
    } catch {
      toast.error("রুটিন ডাউনলোড করা যায়নি");
    } finally {
      setDownloading(false);
    }
  }

  if (!assessment.routine.length) return null;

  return (
    <section className="rounded-3xl border border-sage-warm-border bg-white p-6 shadow-sm sm:p-8">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-sage-primary">Routine</p>
          <h2 className="mt-2 text-2xl font-black text-sage-secondary">ক্লাস রুটিন</h2>
        </div>
        <button
          type="button"
          onClick={downloadRoutine}
          disabled={downloading}
          className="grid h-11 w-11 place-items-center rounded-2xl border border-sage-warm-border bg-white text-sage-secondary transition hover:border-sage-primary hover:text-sage-primary disabled:opacity-60"
          aria-label="Download routine"
          title="রুটিন ডাউনলোড"
        >
          {downloading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
        </button>
      </div>

      <div ref={routineRef} className="overflow-hidden rounded-2xl border border-black bg-white">
        <RoutinePaper
          title={assessment.routineTitle || assessment.title}
          subtitle={assessment.routineSubtitle || assessment.classLabel}
          footer={assessment.scheduleNote}
          routine={assessment.routine}
        />
      </div>
    </section>
  );
}
