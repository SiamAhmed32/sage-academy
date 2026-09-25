"use client";

import { useRef, useState } from "react";
import { CalendarArrowDown } from "lucide-react";
import { toast } from "react-toastify";

import { RoutineSheet, type RoutineSheetInfo } from "@/components/admin/sa/RoutineSheet";
import type { TimetableSlot } from "@/components/admin/sa/WeekTimetable";
import { exportElementToPdf } from "@/components/admin/sa/export-pdf";

/** Downloads a student's weekly routine as the professional routine sheet PDF. */
export function DownloadRoutineButton({
  slots,
  info,
  fileName,
}: {
  slots: TimetableSlot[];
  info: RoutineSheetInfo;
  fileName: string;
}) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);

  async function download() {
    if (slots.length === 0) {
      toast.info("No classes in this student's routine yet.");
      return;
    }
    if (!sheetRef.current) return;
    setBusy(true);
    try {
      const result = await exportElementToPdf(sheetRef.current, fileName, { orientation: "landscape", marginMm: 6 });
      if (result === "saved") toast.success("Routine downloaded.");
    } catch {
      toast.error("Could not download the routine.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button type="button" className="btn-secondary" onClick={download} disabled={busy}>
        <CalendarArrowDown size={17} /> {busy ? "Preparing…" : "Download routine"}
      </button>
      <RoutineSheet
        ref={sheetRef}
        info={info}
        slots={slots.map((slot) => ({
          key: slot.key,
          day: slot.day,
          start: slot.start,
          end: slot.end,
          title: slot.subject,
          sub: [slot.meta, slot.teacher].filter(Boolean).join(" · "),
          tone: slot.tone,
        }))}
      />
    </>
  );
}
