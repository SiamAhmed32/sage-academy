"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { AlertTriangle, Download, ImageDown } from "lucide-react";

import { WEEK_DAYS, WEEK_DAY_LABELS, type WeekDay } from "@/lib/academy/constants";
import { formatTime, formatTimeRange, timeToMinutes } from "@/lib/academy/codes";
import { exportElementToPdf } from "@/components/admin/sa/export-pdf";
import { RoutineSheet, type RoutineSheetInfo } from "@/components/admin/sa/RoutineSheet";

export type RoutineBlock = {
  key: string;
  day: WeekDay;
  start: string;
  end: string;
  title: string;
  /** Second line, e.g. "Room 201 · Jewel Ahmed" */
  sub?: string;
  tone: 1 | 2 | 3 | 4 | 5;
  /** Clash messages; the block is drawn red when there are any. */
  clashes?: string[];
  href?: string;
};

export type RoutineSettings = { from: number; to: number; step: number };

const ROW_HEIGHT = 72;
/** A block needs this much height to show its title, time and teacher/room lines. */
const MIN_BLOCK_HEIGHT = 70;
const DEFAULT_SETTINGS: RoutineSettings = { from: 8 * 60, to: 20 * 60, step: 60 };
const STORAGE_KEY = "sage-routine-grid";
const START_OPTIONS = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16].map((hour) => hour * 60);
const END_OPTIONS = [14, 15, 16, 17, 18, 19, 20, 21, 22, 23].map((hour) => hour * 60);
const STEP_OPTIONS = [30, 40, 45, 50, 60, 70, 75, 80, 90, 100, 105, 110, 120, 150, 180];

/** 80 → "1 h 20 min", 120 → "2 hours", 45 → "45 min" */
export function durationLabel(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${rest} min`;
  if (!rest) return hours === 1 ? "1 hour" : `${hours} hours`;
  return `${hours} h ${rest} min`;
}

export function minutesToTime(total: number) {
  const clamped = Math.min(23 * 60 + 59, Math.max(0, total));
  return `${String(Math.floor(clamped / 60)).padStart(2, "0")}:${String(clamped % 60).padStart(2, "0")}`;
}

/** Grid hours + slot length, remembered in this browser. */
export function useRoutineSettings() {
  const [settings, setSettings] = useState<RoutineSettings>(DEFAULT_SETTINGS);
  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "null");
      // Read after hydration (the server has no browser storage).
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved && typeof saved.from === "number" && typeof saved.to === "number" && typeof saved.step === "number") setSettings(saved);
    } catch {
      // No saved settings — keep the defaults.
    }
  }, []);
  function update(patch: Partial<RoutineSettings>) {
    setSettings((current) => {
      const next = { ...current, ...patch };
      if (next.to <= next.from) next.to = Math.min(23 * 60, next.from + 4 * 60);
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Storage blocked — the setting still applies until reload.
      }
      return next;
    });
  }
  return [settings, update] as const;
}

/** Hours, slot length and export buttons shown above a routine grid. */
export function RoutineToolbar({
  settings,
  onChange,
  exportId,
  exportName,
  sheet,
  children,
}: {
  settings: RoutineSettings;
  onChange: (patch: Partial<RoutineSettings>) => void;
  exportId: string;
  exportName: string;
  /** When given, PDF / Image export this printable sheet (only the real class times, labelled details) instead of the on-screen grid. */
  sheet?: { blocks: RoutineBlock[]; info: RoutineSheetInfo; heading?: string };
  children?: ReactNode;
}) {
  const [busy, setBusy] = useState<"" | "pdf" | "png">("");
  const sheetRef = useRef<HTMLDivElement>(null);

  async function exportAs(kind: "pdf" | "png") {
    const element = sheet ? sheetRef.current : document.getElementById(exportId);
    if (!element) return;
    setBusy(kind);
    try {
      if (kind === "pdf") {
        await exportElementToPdf(element, exportName, { orientation: "landscape" });
      } else {
        const { toPng } = await import("html-to-image");
        const dataUrl = await toPng(element, {
          pixelRatio: 2,
          backgroundColor: "#ffffff",
          width: element.scrollWidth,
          height: element.scrollHeight,
          style: { overflow: "visible" },
        });
        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = `${exportName}.png`;
        link.click();
      }
    } finally {
      setBusy("");
    }
  }

  const label = (minutes: number) => formatTime(minutesToTime(minutes)).replace(/^0/, "");

  return (
    <div className="routine-toolbar">
      <div className="routine-toolbar-group">
        <label>
          From
          <select className="toolbar-select" value={settings.from} onChange={(event) => onChange({ from: Number(event.target.value) })}>
            {START_OPTIONS.map((value) => (
              <option key={value} value={value}>
                {label(value)}
              </option>
            ))}
          </select>
        </label>
        <label>
          To
          <select className="toolbar-select" value={settings.to} onChange={(event) => onChange({ to: Number(event.target.value) })}>
            {END_OPTIONS.filter((value) => value > settings.from).map((value) => (
              <option key={value} value={value}>
                {label(value)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Slot
          <select className="toolbar-select" value={settings.step} onChange={(event) => onChange({ step: Number(event.target.value) })}>
            {STEP_OPTIONS.map((value) => (
              <option key={value} value={value}>
                {durationLabel(value)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="routine-toolbar-group">
        {children}
        <button type="button" className="btn-secondary" onClick={() => exportAs("png")} disabled={busy !== ""}>
          <ImageDown size={17} /> {busy === "png" ? "Saving..." : "Image"}
        </button>
        <button type="button" className="btn-secondary" onClick={() => exportAs("pdf")} disabled={busy !== ""}>
          <Download size={17} /> {busy === "pdf" ? "Exporting..." : "PDF"}
        </button>
      </div>
      {sheet ? <RoutineSheet ref={sheetRef} info={sheet.info} heading={sheet.heading} slots={sheet.blocks} /> : null}
    </div>
  );
}

/** Place overlapping blocks of one day side by side. */
function layoutDay(blocks: RoutineBlock[]) {
  const sorted = [...blocks].sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start) || a.title.localeCompare(b.title));
  const placed: { block: RoutineBlock; lane: number; lanes: number }[] = [];
  let cluster: { block: RoutineBlock; lane: number }[] = [];
  let clusterEnd = -1;
  const flush = () => {
    const lanes = Math.max(1, ...cluster.map((item) => item.lane + 1));
    for (const item of cluster) placed.push({ ...item, lanes });
    cluster = [];
  };
  for (const block of sorted) {
    const start = timeToMinutes(block.start);
    if (start >= clusterEnd) {
      flush();
      clusterEnd = -1;
    }
    const busy = new Set(cluster.filter((item) => timeToMinutes(item.block.end) > start).map((item) => item.lane));
    let lane = 0;
    while (busy.has(lane)) lane += 1;
    cluster.push({ block, lane });
    clusterEnd = Math.max(clusterEnd, timeToMinutes(block.end));
  }
  flush();
  return placed;
}

/**
 * Saturday–Thursday routine grid (it repeats every week, so no dates).
 * Blocks sit at their exact times; empty space is clickable when `onEmptyClick` is set.
 */
export function RoutineWeek({
  blocks,
  settings,
  id,
  title,
  onEmptyClick,
  onBlockClick,
  emptyText,
}: {
  blocks: RoutineBlock[];
  settings: RoutineSettings;
  id: string;
  /** Printed above the grid (also in exports). */
  title?: ReactNode;
  onEmptyClick?: (day: WeekDay, start: string) => void;
  onBlockClick?: (key: string) => void;
  emptyText?: string;
}) {
  // Stretch the visible hours so no class is cut off.
  const range = useMemo(() => {
    let from = settings.from;
    let to = settings.to;
    for (const block of blocks) {
      from = Math.min(from, Math.floor(timeToMinutes(block.start) / 60) * 60);
      to = Math.max(to, Math.ceil(timeToMinutes(block.end) / 60) * 60);
    }
    return { from, to };
  }, [blocks, settings]);
  const step = settings.step;
  // Grow the rows when the shortest class would be too short to read (e.g. a
  // 45-minute class on a 2-hour slot), so every card shows all its lines.
  const rowHeight = useMemo(() => {
    const shortest = Math.min(...blocks.map((block) => timeToMinutes(block.end) - timeToMinutes(block.start)).filter((value) => value > 0));
    if (!Number.isFinite(shortest)) return ROW_HEIGHT;
    return Math.max(ROW_HEIGHT, Math.ceil(((MIN_BLOCK_HEIGHT + 4) * step) / shortest));
  }, [blocks, step]);
  const rows = Math.ceil((range.to - range.from) / step);
  const height = rows * rowHeight;
  const px = (minutes: number) => ((minutes - range.from) / step) * rowHeight;

  const byDay = useMemo(() => {
    const map = new Map<WeekDay, ReturnType<typeof layoutDay>>();
    for (const day of WEEK_DAYS) map.set(day, layoutDay(blocks.filter((block) => block.day === day)));
    return map;
  }, [blocks]);

  function handleEmpty(day: WeekDay, event: React.MouseEvent<HTMLDivElement>) {
    if (!onEmptyClick || event.target !== event.currentTarget) return;
    const y = event.clientY - event.currentTarget.getBoundingClientRect().top;
    const minutes = range.from + Math.floor(y / rowHeight) * step;
    onEmptyClick(day, minutesToTime(minutes));
  }

  return (
    <div className="routine-scroll">
      <div className="routine-week" id={id}>
        {title ? <div className="routine-title">{title}</div> : null}
        <div className="routine-head">
          <span />
          {WEEK_DAYS.map((day) => (
            <b key={day}>{WEEK_DAY_LABELS[day]}</b>
          ))}
        </div>
        <div className="routine-body" style={{ height }}>
          <div className="routine-times">
            {Array.from({ length: rows }, (_, index) => (
              <span key={index} style={{ height: rowHeight }}>
                {formatTime(minutesToTime(range.from + index * step)).replace(/^0/, "")}
              </span>
            ))}
          </div>
          {WEEK_DAYS.map((day) => (
            <div
              key={day}
              className={`routine-day${onEmptyClick ? " editable" : ""}`}
              style={{ backgroundSize: `100% ${rowHeight}px` }}
              onClick={(event) => handleEmpty(day, event)}
              title={onEmptyClick ? "Click to add a class" : undefined}
            >
              {byDay.get(day)!.map(({ block, lane, lanes }) => {
                const top = px(timeToMinutes(block.start));
                const blockHeight = Math.max(28, px(timeToMinutes(block.end)) - top - 4);
                const style = {
                  top: top + 2,
                  height: blockHeight,
                  left: `calc(${(lane / lanes) * 100}% + 4px)`,
                  width: `calc(${100 / lanes}% - 8px)`,
                };
                const clash = block.clashes && block.clashes.length > 0;
                const body = (
                  <>
                    <b>
                      {clash ? <AlertTriangle size={12} /> : null} {block.title}
                    </b>
                    <small>{formatTimeRange(block.start, block.end)}</small>
                    {block.sub ? <small>{block.sub}</small> : null}
                  </>
                );
                const className = `routine-block tone-${block.tone}${clash ? " clash" : ""}`;
                const tip = clash ? block.clashes!.join("\n") : `${block.title} · ${formatTimeRange(block.start, block.end)}${block.sub ? ` · ${block.sub}` : ""}`;
                if (block.href) {
                  return (
                    <Link key={block.key} href={block.href} className={className} style={style} title={tip}>
                      {body}
                    </Link>
                  );
                }
                return (
                  <button
                    key={block.key}
                    type="button"
                    className={className}
                    style={style}
                    title={tip}
                    onClick={onBlockClick ? () => onBlockClick(block.key) : undefined}
                    disabled={!onBlockClick}
                  >
                    {body}
                  </button>
                );
              })}
            </div>
          ))}
          {blocks.length === 0 && emptyText ? <div className="routine-empty">{emptyText}</div> : null}
        </div>
      </div>
    </div>
  );
}

/** Read-only routine with hours/slot controls and export — for server pages. */
export function RoutinePanel({
  blocks,
  id,
  exportName,
  title,
  emptyText,
  sheetInfo,
  children,
}: {
  blocks: RoutineBlock[];
  id: string;
  exportName: string;
  title?: ReactNode;
  emptyText?: string;
  /** Details printed on the exported routine sheet. */
  sheetInfo?: RoutineSheetInfo;
  children?: ReactNode;
}) {
  const [settings, updateSettings] = useRoutineSettings();
  return (
    <section className="panel timetable-panel">
      <RoutineToolbar
        settings={settings}
        onChange={updateSettings}
        exportId={id}
        exportName={exportName}
        sheet={sheetInfo ? { blocks, info: sheetInfo } : undefined}
      >
        {children}
      </RoutineToolbar>
      <RoutineWeek id={id} title={title} blocks={blocks} settings={settings} emptyText={emptyText} />
    </section>
  );
}
