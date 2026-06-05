"use client";

import Link from "next/link";
import { BookOpen, CalendarDays, Clock, ExternalLink } from "lucide-react";
import type { DashboardClass } from "./types";
import { cn } from "@/lib/utils";

function isClassActiveNow(timeStr: string): boolean {
  try {
    const parts = timeStr.split("-").map(t => t.trim());
    if (parts.length !== 2) return false;
    
    const parseTime = (str: string) => {
      const match = str.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (!match) return null;
      let hours = parseInt(match[1]);
      const minutes = parseInt(match[2]);
      const ampm = match[3].toUpperCase();
      if (ampm === "PM" && hours < 12) hours += 12;
      if (ampm === "AM" && hours === 12) hours = 0;
      return hours * 60 + minutes;
    };

    const start = parseTime(parts[0]);
    const end = parseTime(parts[1]);
    if (start === null || end === null) return false;

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    return currentMinutes >= start && currentMinutes <= end;
  } catch (e) {
    return false;
  }
}

function RoutineItem({ item }: { item: DashboardClass }) {
  const active = isClassActiveNow(item.time);

  return (
    <article className="relative pl-8 group">
      {/* Vertical connector line segment */}
      <div className="absolute left-3 top-3 bottom-0 w-0.5 bg-sage-border/50 group-last:bottom-auto group-last:h-6" />

      {/* Timeline Node Dot */}
      <div className="absolute left-1 top-2.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-white z-10">
        <span className={cn(
          "h-2.5 w-2.5 rounded-full border border-white shadow-sm",
          active ? "bg-emerald-500 animate-pulse ring-4 ring-emerald-500/30" : "bg-sage-primary/40"
        )} />
      </div>

      <div className={cn(
        "grid gap-3 rounded-2xl border bg-white p-4 shadow-sm sm:grid-cols-[120px_1fr_auto] sm:items-center transition-all duration-300 hover:shadow-md hover:border-sage-primary/30",
        active ? "border-emerald-500/40 bg-emerald-50/10 shadow-emerald-500/5" : "border-sage-border"
      )}>
        {/* Time display block */}
        <div className={cn(
          "flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-black border tracking-tight",
          active
            ? "bg-emerald-50 text-emerald-700 border-emerald-100/50"
            : "bg-sage-red-50/50 text-sage-primary border-sage-red-100/30"
        )}>
          <Clock className="h-3.5 w-3.5 shrink-0" />
          <span>{item.time}</span>
        </div>

        {/* Title and details */}
        <div className="min-w-0">
          <h4 className="truncate font-extrabold text-sage-secondary text-sm group-hover:text-sage-primary transition-colors duration-200">
            {item.title}
          </h4>
          <p className="mt-1 text-xs text-sage-gray-500 font-semibold">
            {item.subject}
          </p>
        </div>

        {/* Quick Link Action */}
        <div className="flex items-center gap-2">
          {active && (
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-emerald-600 border border-emerald-100">
              চলমান
            </span>
          )}
          <Link
            href="/admin/routine"
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-sage-red-50 text-sage-primary transition hover:bg-sage-primary hover:text-white"
            title="রুটিন দেখুন"
          >
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </article>
  );
}

function RoutineEmpty() {
  return (
    <div className="rounded-2xl border border-dashed border-sage-border bg-white px-4 py-12 text-center shadow-sm">
      <BookOpen className="mx-auto mb-3 h-10 w-10 text-sage-gray-300" />
      <p className="text-sm font-bold text-sage-gray-500">
        আজ কোনো ক্লাস পাওয়া যায়নি।
      </p>
    </div>
  );
}

export function UpcomingClasses({ classes }: { classes: DashboardClass[] }) {
  const visibleClasses = classes.slice(0, 8);
  const hiddenCount = Math.max(0, classes.length - visibleClasses.length);

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-sage-primary/20 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sage-primary text-white shadow-sm">
              <CalendarDays className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-lg font-black text-sage-secondary">
                আজকের রুটিন
              </h3>
              <p className="mt-0.5 text-xs text-sage-gray-500">
                সময় অনুযায়ী সাজানো আজকের ক্লাসসমূহের সূচি।
              </p>
            </div>
          </div>
          <span className="shrink-0 rounded-full bg-sage-red-50 px-3 py-1 text-xs font-extrabold text-sage-primary ring-1 ring-sage-red-100 self-start sm:self-center">
            {classes.length} ক্লাস
          </span>
        </div>
      </div>

      {visibleClasses.length ? (
        <div className="space-y-4">
          <div className="max-h-[540px] overflow-y-auto pr-1 space-y-1">
            {visibleClasses.map((item) => (
              <RoutineItem key={item.id} item={item} />
            ))}
          </div>
          {hiddenCount > 0 && (
            <Link
              href="/admin/routine"
              className="block rounded-2xl border border-dashed border-sage-border bg-white px-4 py-3.5 text-center text-xs font-bold text-sage-primary transition hover:border-sage-primary hover:bg-sage-red-50 shadow-sm"
            >
              আরও {hiddenCount}টি ক্লাস আছে, পূর্ণ রুটিন দেখুন
            </Link>
          )}
        </div>
      ) : (
        <RoutineEmpty />
      )}
    </section>
  );
}
