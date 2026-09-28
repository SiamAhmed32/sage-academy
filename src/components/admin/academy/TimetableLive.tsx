"use client";

import { useEffect, useState } from "react";

import { loadJson, readJsonCache } from "@/components/admin/grid/grid-cache";
import { MiniStat, MiniStats } from "@/components/admin/sa/ui";
import { WEEK_DAYS, WEEK_DAY_LABELS, type WeekDay } from "@/lib/academy/constants";
import { dhakaParts } from "@/lib/academy/codes";
import { TimetableView, type TimetableSource } from "./TimetableView";

const URL = "/api/admin/timetable";

type Payload = {
  slots: TimetableSource[];
  batches: { id: string; code: string; classCount: number }[];
  teachers: { id: string; name: string }[];
};

export function TimetableLive({ initialBatch, initialTeacher }: { initialBatch: string; initialTeacher: string }) {
  const [data, setData] = useState<Payload | null>(() => readJsonCache<Payload>(URL));
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (data) return;
    let cancel = false;
    void loadJson<Payload>(URL)
      .then((body) => {
        if (!cancel) setData(body);
      })
      .catch(() => {
        if (!cancel) setFailed(true);
      });
    return () => {
      cancel = true;
    };
  }, [data]);

  const now = dhakaParts();
  const today = now.weekday as WeekDay | "fri";
  const [hours, minutes] = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Dhaka", hour: "2-digit", minute: "2-digit", hour12: false })
    .format(new Date())
    .split(":")
    .map(Number);
  const nowMinutes = hours * 60 + minutes;

  if (!data) {
    if (failed) {
      return (
        <div className="notice danger">
          <span>The class routine could not load. Refresh the page to try again.</span>
        </div>
      );
    }
    return (
      <div className="sa-page-skeleton" aria-busy="true">
        <div className="sa-skel-stats">
          <span className="sa-skel" />
          <span className="sa-skel" />
          <span className="sa-skel" />
          <span className="sa-skel" />
        </div>
        <div className="sa-skel-table">
          {Array.from({ length: 6 }, (_, index) => (
            <span key={index} className="sa-skel" />
          ))}
        </div>
      </div>
    );
  }

  const teaching = new Set(data.slots.map((slot) => slot.teacherId).filter(Boolean));
  const todayCount = data.slots.filter((slot) => slot.day === today).length;
  const busiest = WEEK_DAYS.map((day) => ({ day, count: data.slots.filter((slot) => slot.day === day).length })).sort((a, b) => b.count - a.count)[0];
  const withRoutine = data.batches.filter((batch) => batch.classCount > 0).length;

  return (
    <>
      <MiniStats>
        <MiniStat label="Classes this week" value={data.slots.length} note={`Across ${withRoutine} batches`} />
        <MiniStat label="Classes today" value={today === "fri" ? "Off day" : todayCount} note={today === "fri" ? "Friday — no classes" : "From the routine"} />
        <MiniStat label="Teachers teaching" value={teaching.size} note="With at least one class" />
        <MiniStat
          label="Busiest day"
          value={busiest && busiest.count > 0 ? WEEK_DAY_LABELS[busiest.day] : "—"}
          note={busiest && busiest.count > 0 ? `${busiest.count} classes` : "No classes yet"}
        />
      </MiniStats>
      <TimetableView
        slots={data.slots}
        batches={data.batches.map((batch) => ({ id: batch.id, code: batch.code }))}
        teachers={data.teachers}
        initialBatch={initialBatch}
        initialTeacher={initialTeacher}
        today={today}
        nowMinutes={nowMinutes}
      />
    </>
  );
}
