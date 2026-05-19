import Link from "next/link";
import { CheckCircle, GraduationCap, MessageSquare, PhoneCall } from "lucide-react";

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
    color: "bg-blue-500",
  },
  {
    key: "contacted",
    label: "যোগাযোগ হয়েছে",
    meaning: "পরবর্তী সিদ্ধান্ত বাকি",
    icon: PhoneCall,
    color: "bg-sage-primary",
  },
  {
    key: "qualified",
    label: "যোগ্য",
    meaning: "ভর্তির সম্ভাবনা বেশি",
    icon: CheckCircle,
    color: "bg-orange-500",
  },
  {
    key: "admitted",
    label: "ভর্তি",
    meaning: "সক্রিয় শিক্ষার্থী",
    icon: GraduationCap,
    color: "bg-green-600",
  },
] as const;

export function AdmissionFunnel({ counts }: FunnelProps) {
  return (
    <section className="rounded-xl border border-sage-border bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-bold text-sage-secondary">ভর্তি অবস্থার ছবি</h3>
          <p className="mt-1 text-sm leading-6 text-sage-gray-500">
            নতুন আবেদন থেকে ভর্তি হওয়া পর্যন্ত প্রতিটি ধাপের সংখ্যা।
          </p>
        </div>
        <Link
          href="/admin/admissions"
          className="inline-flex shrink-0 items-center justify-center rounded-full bg-sage-primary px-4 py-2 text-xs font-bold text-white transition hover:bg-sage-secondary"
        >
          আবেদন দেখুন
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {steps.map((step) => {
          const Icon = step.icon;
          const value = counts[step.key];

          return (
            <div key={step.key} className="rounded-xl bg-sage-red-50/40 p-4">
              <div className="flex items-start justify-between gap-3">
                <span
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${step.color} text-white shadow-sm`}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <p className="text-3xl font-black text-sage-secondary">{value}</p>
              </div>
              <p className="mt-3 font-bold text-sage-secondary">{step.label}</p>
              <p className="mt-1 text-xs leading-5 text-sage-gray-500">
                {step.meaning}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
