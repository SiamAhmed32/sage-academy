"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, CalendarDays, Search, School } from "lucide-react";

import { getClassLabel } from "@/constants/class-levels";
import type { PublicAssessment } from "@/lib/assessments";

type Props = {
  assessments: PublicAssessment[];
};

const filters = [
  { label: "সব", value: "all" },
  { label: "Model Test", value: "modelTest" },
  { label: "Exam", value: "exam" },
] as const;

function kindLabel(item: PublicAssessment) {
  return item.kind === "modelTest" ? "Model Test" : item.examType || "Exam";
}

export function AssessmentHubClient({ assessments }: Props) {
  const classLevels = useMemo(
    () => [...new Set(assessments.flatMap((item) => item.classLevels))].sort((a, b) => a - b),
    [assessments]
  );
  const [activeClass, setActiveClass] = useState<number | "all">("all");
  const [activeKind, setActiveKind] = useState<(typeof filters)[number]["value"]>("all");
  const [query, setQuery] = useState("");

  const visible = assessments.filter((item) => {
    const matchesClass = activeClass === "all" || item.classLevels.includes(activeClass);
    const matchesKind = activeKind === "all" || item.kind === activeKind;
    const q = query.trim().toLowerCase();
    const matchesQuery =
      !q ||
      [item.title, item.badge, item.examType, item.classLabel, ...item.subjects, ...item.schoolFocus]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q);
    return matchesClass && matchesKind && matchesQuery;
  });

  if (assessments.length === 0) {
    return (
      <div className="rounded-3xl border border-sage-warm-border bg-white p-12 text-center">
        <p className="text-xl font-black text-sage-secondary">এই মুহূর্তে কোনো চলমান পরীক্ষা নেই</p>
        <p className="mt-2 text-sm font-semibold text-sage-gray-600">নতুন model test বা exam প্রকাশিত হলে এখানে দেখা যাবে।</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="rounded-[1.75rem] border border-sage-warm-border bg-white p-4 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-sage-gray-500" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="স্কুল, বিষয়, পরীক্ষা বা শ্রেণি দিয়ে খুঁজুন"
              className="h-14 w-full rounded-2xl border border-sage-warm-border bg-sage-cream py-4 pl-12 pr-4 text-sm font-bold text-sage-secondary outline-none focus:border-sage-primary"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => setActiveKind(filter.value)}
                className={`h-12 rounded-2xl px-4 text-sm font-black transition ${
                  activeKind === filter.value ? "bg-sage-primary text-white" : "bg-sage-red-50 text-sage-secondary hover:bg-sage-red-100"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveClass("all")}
            className={`rounded-2xl px-4 py-3 text-sm font-black transition ${activeClass === "all" ? "bg-sage-secondary text-white" : "bg-sage-cream text-sage-secondary"}`}
          >
            সব শ্রেণি
          </button>
          {classLevels.map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setActiveClass(level)}
              className={`rounded-2xl px-4 py-3 text-sm font-black transition ${
                activeClass === level ? "bg-sage-secondary text-white" : "bg-sage-cream text-sage-secondary"
              }`}
            >
              {getClassLabel(level)}
            </button>
          ))}
        </div>
      </div>

      {visible.length ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((item) => (
            <article key={`${item.kind}-${item._id}`} className="group overflow-hidden rounded-[1.75rem] border border-sage-warm-border bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
              <div className="relative aspect-[16/9] bg-sage-secondary">
                {item.image ? (
                  <Image src={item.image} alt={item.title} fill unoptimized className="object-cover" />
                ) : (
                  <div className="flex h-full flex-col justify-end bg-[linear-gradient(135deg,#5a0000_0%,#8b1117_54%,#f0b429_100%)] p-5 text-white">
                    <p className="text-sm font-black text-sage-gold">{kindLabel(item)}</p>
                    <p className="mt-2 text-3xl font-black leading-tight">{item.classLabel}</p>
                  </div>
                )}
                <div className="absolute left-4 top-4 rounded-full bg-sage-gold px-3 py-1 text-xs font-black text-sage-secondary">
                  {kindLabel(item)}
                </div>
              </div>
              <div className="p-5">
                <h2 className="line-clamp-2 text-2xl font-black leading-tight text-sage-secondary">{item.title}</h2>
                <div className="mt-5 space-y-3 text-sm font-bold text-sage-gray-700">
                  <p className="flex gap-2"><CalendarDays className="h-5 w-5 text-sage-primary" /> {item.dateLabel}</p>
                  <p>{item.classLabel} · {item.subjectCountLabel} · {item.versionLabel}</p>
                  {item.schoolFocus.length ? (
                    <p className="flex gap-2">
                      <School className="h-5 w-5 shrink-0 text-sage-primary" />
                      <span>{item.schoolFocus.slice(0, 4).join(", ")}</span>
                    </p>
                  ) : null}
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  {item.subjects.slice(0, 5).map((subject) => (
                    <span key={subject} className="rounded-full bg-sage-red-50 px-3 py-1.5 text-xs font-black text-sage-primary">
                      {subject}
                    </span>
                  ))}
                </div>
                <p className="mt-5 text-sm font-black text-sage-primary">{item.feePreview}</p>
                <Link href={item.href} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-sage-primary px-5 py-3 text-sm font-black text-white transition group-hover:bg-sage-secondary">
                  রুটিন, ফি ও রেজিস্ট্রেশন
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-sage-warm-border bg-white p-12 text-center">
          <p className="text-xl font-black text-sage-secondary">এই ফিল্টারে কোনো প্রোগ্রাম নেই</p>
          <p className="mt-2 text-sm font-semibold text-sage-gray-600">অন্য শ্রেণি, স্কুল বা প্রোগ্রাম টাইপ দিয়ে আবার খুঁজুন।</p>
        </div>
      )}
    </div>
  );
}
