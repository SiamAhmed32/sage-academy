"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BookOpen } from "lucide-react";

import { formatTime, formatTimeRange, timeToMinutes } from "@/lib/academy/codes";

export type BoardClass = {
  key: string;
  start: string;
  end: string;
  subject: string;
  meta: string;
  tone: 1 | 2 | 3 | 4 | 5;
  href?: string;
};

const CHIP_COUNT = 5;
const LANE_HEIGHT = 106;

function toLabel(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return formatTime(`${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`).toLowerCase();
}

/**
 * The day timeline from the SchoolOS / Dribbble reference: time chips on top,
 * dashed rails, and class cards placed by their start time. Overlapping
 * classes drop to the next lane.
 */
export function ScheduleBoard({
  classes,
  nowMinutes,
  emptyText = "No classes today.",
}: {
  classes: BoardClass[];
  nowMinutes: number;
  emptyText?: string;
}) {
  const layout = useMemo(() => {
    if (classes.length === 0) return null;
    const starts = classes.map((item) => timeToMinutes(item.start));
    const ends = classes.map((item) => timeToMinutes(item.end));
    let from = Math.floor(Math.min(...starts) / 60) * 60;
    let to = Math.ceil(Math.max(...ends) / 60) * 60;
    if (to - from < 240) to = from + 240;
    // Chips every (to-from)/(CHIP_COUNT-1) minutes, rounded to 30.
    const step = Math.max(30, Math.ceil((to - from) / (CHIP_COUNT - 1) / 30) * 30);
    to = from + step * (CHIP_COUNT - 1);
    from = Math.max(0, from);
    const span = to - from;

    const sorted = [...classes].sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));
    const laneEnds: number[] = [];
    const cards = sorted.map((item) => {
      const start = timeToMinutes(item.start);
      // Card width ≈ 210px on a ~680px board; reserve ~30% of the span per card.
      const reserve = span * 0.3;
      let lane = laneEnds.findIndex((end) => end <= start);
      if (lane === -1) {
        lane = laneEnds.length;
        laneEnds.push(0);
      }
      laneEnds[lane] = Math.max(start + reserve, timeToMinutes(item.end));
      const left = Math.min(0.72, Math.max(0, (start - from) / span));
      const live = start <= nowMinutes && nowMinutes < timeToMinutes(item.end);
      return { ...item, lane, left, live };
    });
    const chips = Array.from({ length: CHIP_COUNT }, (_, index) => from + step * index);
    const activeChip = chips.reduce(
      (best, chip, index) => (Math.abs(chip - nowMinutes) < Math.abs(chips[best] - nowMinutes) ? index : best),
      0
    );
    return { cards, chips, activeChip, lanes: Math.max(2, laneEnds.length) };
  }, [classes, nowMinutes]);

  const [picked, setPicked] = useState<number | null>(null);

  if (!layout) {
    return (
      <div className="empty-state" style={{ padding: "36px 22px" }}>
        <div className="empty-icon">
          <BookOpen size={22} />
        </div>
        <strong>{emptyText}</strong>
      </div>
    );
  }

  const active = picked ?? layout.activeChip;

  return (
    <div className="schedule-scroll">
      <div className="schedule-times" role="tablist" aria-label="Times">
        {layout.chips.map((chip, index) => (
          <button
            key={chip}
            type="button"
            role="tab"
            aria-selected={active === index}
            className={`time-chip${active === index ? " active" : ""}`}
            onClick={() => setPicked(index)}
          >
            {toLabel(chip)}
          </button>
        ))}
      </div>
      <div className="schedule-board" style={{ height: layout.lanes * LANE_HEIGHT + 16 }}>
        <div className="schedule-rails">
          {layout.chips.map((chip, index) => (
            <span key={chip} className={active === index ? "active" : ""} />
          ))}
        </div>
        {layout.cards.map((card) => {
          const body = (
            <>
              <span className="class-pin" />
              <span className={`class-icon tone-${card.tone}`}>
                <BookOpen size={16} />
              </span>
              <span style={{ minWidth: 0 }}>
                <b>{card.subject}</b>
                <small>{formatTimeRange(card.start, card.end)}</small>
                {card.meta ? <small>{card.meta}</small> : null}
              </span>
            </>
          );
          const className = `class-card board-tone-${card.tone}${card.live ? " current" : ""}`;
          const style = { left: `calc(${(card.left * 100).toFixed(2)}% + 18px)`, top: 16 + card.lane * LANE_HEIGHT };
          return card.href ? (
            <Link key={card.key} href={card.href} className={className} style={style}>
              {body}
            </Link>
          ) : (
            <article key={card.key} className={className} style={style}>
              {body}
            </article>
          );
        })}
      </div>
    </div>
  );
}
