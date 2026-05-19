import Link from "next/link";
import { BookOpen, CalendarDays, Clock, ExternalLink } from "lucide-react";

import type { DashboardClass } from "./types";

function RoutineItem({ item }: { item: DashboardClass }) {
  return (
    <article className="grid gap-3 rounded-xl border border-sage-border bg-white p-3 shadow-sm sm:grid-cols-[112px_1fr_auto] sm:items-center">
      <div className="flex items-center gap-2 rounded-lg bg-sage-red-50 px-3 py-2 text-sage-primary">
        <Clock className="h-4 w-4 shrink-0" />
        <span className="text-xs font-black">{item.time}</span>
      </div>

      <div className="min-w-0">
        <h4 className="truncate font-bold text-sage-secondary">{item.title}</h4>
        <p className="mt-1 text-sm text-sage-gray-600">{item.subject}</p>
      </div>

      <Link
        href="/admin/routine"
        className="flex h-9 w-9 items-center justify-center rounded-lg bg-sage-red-50 text-sage-primary transition hover:bg-sage-primary hover:text-white"
        title="রুটিন দেখুন"
      >
        <ExternalLink className="h-4 w-4" />
      </Link>
    </article>
  );
}

function RoutineEmpty() {
  return (
    <div className="rounded-xl border border-dashed border-sage-border bg-white px-4 py-10 text-center">
      <BookOpen className="mx-auto mb-2 h-9 w-9 text-sage-gray-300" />
      <p className="text-sm font-medium text-sage-gray-500">
        আজ কোনো ক্লাস পাওয়া যায়নি।
      </p>
    </div>
  );
}

export function UpcomingClasses({ classes }: { classes: DashboardClass[] }) {
  const visibleClasses = classes.slice(0, 8);
  const hiddenCount = Math.max(0, classes.length - visibleClasses.length);

  return (
    <section className="space-y-3">
      <div className="rounded-xl border border-sage-primary bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sage-primary text-white">
              <CalendarDays className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-lg font-bold text-sage-secondary">
                আজকের রুটিন
              </h3>
              <p className="mt-1 text-sm leading-6 text-sage-gray-500">
                সময় অনুযায়ী সাজানো ক্লাস তালিকা। এক দিনে অনেক ক্লাস থাকলে এখানে
                প্রথমগুলো দেখাবে।
              </p>
            </div>
          </div>
          <span className="shrink-0 rounded-full bg-sage-red-50 px-3 py-1 text-sm font-bold text-sage-primary ring-1 ring-sage-red-100">
            {classes.length} ক্লাস
          </span>
        </div>
      </div>

      {visibleClasses.length ? (
        <div className="max-h-[520px] space-y-3 overflow-y-auto pr-1">
          {visibleClasses.map((item) => (
            <RoutineItem key={item.id} item={item} />
          ))}
          {hiddenCount > 0 && (
            <Link
              href="/admin/routine"
              className="block rounded-xl border border-dashed border-sage-border bg-white px-4 py-3 text-center text-sm font-bold text-sage-primary transition hover:border-sage-primary hover:bg-sage-red-50"
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
