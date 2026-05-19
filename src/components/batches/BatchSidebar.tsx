"use client";

import Link from "next/link";
import {
  Award,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Headphones,
  Users,
  type LucideIcon,
} from "lucide-react";

import type { Batch } from "@/types/batch";

const supportPoints = [
  "ছেলে ও মেয়েদের আলাদা ব্যাচ",
  "আধুনিক ও ডিজিটাল ক্লাসরুম",
  "ছোট ব্যাচে নিবিড় যত্ন",
  "প্রতিটি ক্লাসের ডাউট সলভ",
  "সাপ্তাহিক ও মাসিক পরীক্ষা",
];

export function BatchSidebar({ promotionCard, batch }: { promotionCard: any; batch: any }) {
  const subjects = batch.subjects?.length ?? 0;
  const points = promotionCard.features?.length ? promotionCard.features : supportPoints;

  return (
    <div className="sticky top-24 space-y-6">
      <aside className="overflow-hidden rounded-3xl border border-sage-red-100 bg-white shadow-xl shadow-sage-red-100/20">
        <div className="bg-sage-secondary px-8 py-6 text-center text-white">
          <h2 className="text-xl font-bold tracking-[0.16em]">BATCH FEATURES</h2>
        </div>

        <div className="space-y-4 p-8">
          <div className="space-y-3">
            {points.map((point: string) => (
              <div key={point} className="flex items-start gap-3 text-sm font-bold text-sage-secondary">
                <div className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-sage-primary">
                  <CheckCircle2 size={10} className="text-white" />
                </div>
                <span>{point}</span>
              </div>
            ))}
          </div>

          <div className="h-px bg-sage-red-100/50" />

          <div className="rounded-2xl bg-sage-red-50 px-5 py-4 text-center">
            <p className="text-2xl font-black text-sage-primary">
              {promotionCard.badge || batch.status || "ভর্তি চলছে"}
            </p>
          </div>

          <Link
            href="/admission"
            className="flex h-14 w-full items-center justify-center rounded-2xl bg-sage-secondary text-sm font-bold text-white shadow-lg shadow-sage-secondary/20 transition hover:bg-sage-primary"
          >
            ভর্তি আবেদন করুন
          </Link>
        </div>
      </aside>

      <aside className="rounded-3xl border border-sage-red-100 bg-white p-7">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sage-red-50 text-sage-primary">
            <Headphones size={22} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-sage-secondary">ভর্তি সহায়তা</h3>
            <p className="mt-2 text-sm leading-6 text-sage-gray-500">
              ব্যাচ, সময়সূচি বা ভর্তি প্রক্রিয়া নিয়ে প্রশ্ন থাকলে আমাদের সাথে যোগাযোগ করুন।
            </p>
            <Link href="/#contact" className="mt-4 inline-flex text-sm font-bold text-sage-primary">
              যোগাযোগ করুন
            </Link>
          </div>
        </div>
      </aside>
    </div>
  );
}

function FeatureRow({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm font-medium">
      <div className="flex items-center gap-3 text-sage-gray-700">
        <Icon size={18} className="text-sage-primary" />
        <span>{label}</span>
      </div>
      <span className="rounded-xl bg-sage-red-50 px-3 py-1 font-bold text-sage-primary">
        {value}
      </span>
    </div>
  );
}
