import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

const iconToneByHref: Record<string, string> = {
  "/admin": "bg-rose-50 text-sage-primary ring-rose-200",
  "/admin/admissions": "bg-blue-50 text-blue-600 ring-blue-200",
  "/admin/contacts": "bg-sky-50 text-sky-600 ring-sky-200",
  "/admin/free-class-leads": "bg-amber-50 text-amber-600 ring-amber-200",
  "/admin/assessment-registrations": "bg-violet-50 text-violet-600 ring-violet-200",
  "/admin/quiz-leads": "bg-pink-50 text-pink-600 ring-pink-200",
  "/admin/engagement": "bg-emerald-50 text-emerald-600 ring-emerald-200",
  "/admin/students": "bg-indigo-50 text-indigo-600 ring-indigo-200",
  "/admin/payments": "bg-green-50 text-green-600 ring-green-200",
  "/admin/routine": "bg-orange-50 text-orange-600 ring-orange-200",
  "/admin/notices": "bg-red-50 text-red-600 ring-red-200",
  "/admin/academic-batches": "bg-teal-50 text-teal-600 ring-teal-200",
  "/admin/teachers": "bg-lime-50 text-lime-700 ring-lime-200",
  "/admin/quizzes": "bg-purple-50 text-purple-600 ring-purple-200",
  "/admin/model-tests": "bg-cyan-50 text-cyan-700 ring-cyan-200",
  "/admin/exams": "bg-orange-50 text-orange-600 ring-orange-200",
  "/admin/promotion-cards": "bg-fuchsia-50 text-fuchsia-600 ring-fuchsia-200",
  "/admin/testimonials": "bg-yellow-50 text-yellow-700 ring-yellow-200",
  "/admin/users": "bg-slate-50 text-slate-600 ring-slate-200",
  "/admin/roles": "bg-rose-50 text-rose-700 ring-rose-200",
};

type AdminNavIconProps = {
  href: string;
  icon: LucideIcon;
  isActive: boolean;
};

export function AdminNavIcon({ href, icon: Icon, isActive }: AdminNavIconProps) {
  return (
    <span
      className={cn(
        "grid h-9 w-9 shrink-0 place-items-center rounded-xl ring-1 transition",
        iconToneByHref[href] ?? "bg-white/10 text-white ring-white/15",
        !isActive && "shadow-sm shadow-black/10"
      )}
    >
      <Icon size={18} strokeWidth={2.2} />
    </span>
  );
}
