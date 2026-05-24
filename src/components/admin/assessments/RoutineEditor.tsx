"use client";

import { useRef, useState } from "react";
import { Download, Loader2, Plus, X } from "lucide-react";
import { toast } from "react-toastify";

import { ClassRoutinePaper } from "@/components/shared/class-routine-paper";
import { downloadClassRoutinePdf, pdfSafeText } from "@/lib/class-routine-pdf";

type RoutineRow = {
  day: string;
  time: string;
  subject: string;
};

type Props = {
  title: string;
  routineTitle: string;
  routineSubtitle: string;
  scheduleNote: string;
  routine: RoutineRow[];
  onChange: (routine: RoutineRow[]) => void;
};

const days = ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const inputClass = "h-11 rounded-xl border border-sage-border bg-white px-3 text-sm outline-none focus:border-sage-primary";

export function RoutineEditor({ title, routineTitle, routineSubtitle, scheduleNote, routine, onChange }: Props) {
  const routineRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const cleanRoutine = routine.filter((row) => row.day && row.time && row.subject);

  function updateRow(index: number, patch: Partial<RoutineRow>) {
    const next = [...routine];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  }

  function addRow() {
    onChange([...routine, { day: "Saturday", time: "", subject: "" }]);
  }

  function deleteRow(index: number) {
    onChange(routine.filter((_, i) => i !== index));
  }

  async function handleDownload() {
    setDownloading(true);
    try {
      downloadClassRoutinePdf({
        title: pdfSafeText(routineTitle || title, "Class Routine"),
        subtitle: pdfSafeText(routineSubtitle, ""),
        footer: scheduleNote ? pdfSafeText(scheduleNote, "") : undefined,
        entries: cleanRoutine,
        filename: `${title || "class"}-routine.pdf`,
      });
    } catch {
      toast.error("রুটিন ডাউনলোড করা যায়নি");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="space-y-4 rounded-2xl border border-sage-border bg-white p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-black text-sage-secondary">রুটিন তৈরি</p>
          <p className="mt-1 text-xs font-semibold text-sage-gray-500">দিন, সময় ও বিষয় দিলে নিচে রুটিন টেবিল তৈরি হবে।</p>
        </div>
        <button
          type="button"
          onClick={addRow}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-sage-primary px-4 text-sm font-black text-white transition hover:bg-sage-secondary"
        >
          <Plus className="h-4 w-4" />
          রুটিন সারি
        </button>
      </div>

      <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
        {routine.map((row, index) => (
          <div key={index} className="grid gap-3 rounded-2xl bg-sage-red-50/30 p-3 md:grid-cols-[180px_1fr_1fr_44px]">
            <select value={row.day} onChange={(e) => updateRow(index, { day: e.target.value })} className={inputClass}>
              {days.map((day) => <option key={day} value={day}>{day}</option>)}
            </select>
            <input value={row.time} onChange={(e) => updateRow(index, { time: e.target.value })} placeholder="12.00-1.00" className={inputClass} />
            <input value={row.subject} onChange={(e) => updateRow(index, { subject: e.target.value })} placeholder="English / Math / Chemistry" className={inputClass} />
            <button
              type="button"
              onClick={() => deleteRow(index)}
              className="grid h-11 w-11 place-items-center rounded-xl bg-white text-red-600 ring-1 ring-sage-border hover:bg-red-50"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
        {routine.length === 0 && (
          <p className="text-center py-4 text-sm text-sage-gray-400">কোনো রুটিন সারি নেই। উপরের বাটন ক্লিক করে নতুন সারি যোগ করুন।</p>
        )}
      </div>

      {cleanRoutine.length > 0 && (
        <div className="mt-5 overflow-hidden rounded-2xl border border-black bg-white">
          <div className="flex items-center justify-end border-b border-black bg-white p-2">
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              title="Download routine"
              className="grid h-9 w-9 place-items-center rounded-md border border-black bg-white text-black disabled:opacity-50 hover:bg-gray-50"
            >
              {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            </button>
          </div>
          <div ref={routineRef}>
            <ClassRoutinePaper
              title={routineTitle || title || "SSC 2027"}
              subtitle={routineSubtitle || ""}
              footer={scheduleNote}
              entries={cleanRoutine}
              layout="grid"
            />
          </div>
        </div>
      )}
    </div>
  );
}
