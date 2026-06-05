"use client";

import Link from "next/link";
import { CheckCircle, GraduationCap, MessageSquare, PhoneCall, ChevronRight, TrendingUp } from "lucide-react";

type FunnelProps = {
  counts: {
    new: number;
    contacted: number;
    qualified: number;
    admitted: number;
  };
};

const steps = [
  {
    key: "new",
    label: "নতুন",
    meaning: "এখনই যোগাযোগ দরকার",
    icon: MessageSquare,
    color: "text-blue-500 border-blue-100 bg-blue-50/50",
  },
  {
    key: "contacted",
    label: "যোগাযোগ হয়েছে",
    meaning: "পরবর্তী সিদ্ধান্ত বাকি",
    icon: PhoneCall,
    color: "text-sage-primary border-sage-red-100 bg-sage-red-50/40",
  },
  {
    key: "qualified",
    label: "যোগ্য",
    meaning: "ভর্তির সম্ভাবনা বেশি",
    icon: CheckCircle,
    color: "text-orange-500 border-orange-100 bg-orange-50/50",
  },
  {
    key: "admitted",
    label: "ভর্তি",
    meaning: "সক্রিয় শিক্ষার্থী",
    icon: GraduationCap,
    color: "text-green-600 border-green-100 bg-green-50/50",
  },
] as const;

export function AdmissionFunnel({ counts }: FunnelProps) {
  const totalLeads = counts.new + counts.contacted + counts.qualified + counts.admitted;
  const conversionRate = totalLeads > 0 ? (counts.admitted / totalLeads) * 100 : 0;

  return (
    <section className="rounded-2xl border border-sage-border bg-white p-5 shadow-sm">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between border-b border-sage-border pb-4">
        <div>
          <h3 className="text-lg font-black text-sage-secondary">ভর্তি অবস্থার ছবি</h3>
          <p className="mt-1 text-xs text-sage-gray-500">
            নতুন আবেদন থেকে ভর্তি হওয়া পর্যন্ত প্রতিটি ধাপের সংখ্যা।
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {totalLeads > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-600 ring-1 ring-green-100">
              <TrendingUp className="h-3.5 w-3.5" />
              ভর্তি রূপান্তর হার: {conversionRate.toFixed(0)}%
            </span>
          )}
          <Link
            href="/admin/admissions"
            className="inline-flex shrink-0 items-center justify-center rounded-full bg-sage-primary px-4 py-2 text-xs font-bold text-white transition hover:bg-sage-secondary"
          >
            আবেদন দেখুন
          </Link>
        </div>
      </div>

      {/* Connected pipeline flow layout */}
      <div className="flex flex-col lg:flex-row items-center gap-2 lg:gap-2">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const value = counts[step.key];
          const isLast = idx === steps.length - 1;

          return (
            <div key={step.key} className="flex flex-col lg:flex-row items-center flex-1 w-full gap-2">
              <div className={`flex-1 w-full rounded-2xl border ${step.color} p-4 transition-all duration-300 hover:shadow-md`}>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm border border-sage-border/50">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="font-extrabold text-sage-secondary text-sm">{step.label}</p>
                      <p className="mt-0.5 text-[10px] text-sage-gray-500 font-semibold leading-relaxed">
                        {step.meaning}
                      </p>
                    </div>
                  </div>
                  <p className="text-3xl font-black text-sage-secondary tracking-tight">{value}</p>
                </div>
              </div>
              
              {!isLast && (
                <div className="flex shrink-0 h-6 w-6 lg:h-8 lg:w-8 items-center justify-center text-sage-gray-400 rotate-90 lg:rotate-0">
                  <ChevronRight className="h-5 w-5" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
