"use client";

import Link from "next/link";
import { CreditCard, UserPlus, BookOpen, Bell, ArrowRight } from "lucide-react";

const actions = [
  {
    title: "পেমেন্ট সংগ্রহ",
    desc: "শিক্ষার্থীর পেমেন্ট রেকর্ড করুন",
    href: "/admin/payments",
    color: "from-emerald-500 to-teal-600",
    bgLight: "bg-emerald-50 text-emerald-600",
    icon: CreditCard,
  },
  {
    title: "নতুন শিক্ষার্থী",
    desc: "একাডেমিতে শিক্ষার্থী ভর্তি করুন",
    href: "/admin/students",
    color: "from-blue-500 to-indigo-600",
    bgLight: "bg-blue-50 text-blue-600",
    icon: UserPlus,
  },
  {
    title: "নতুন ব্যাচ",
    desc: "চলমান একাডেমিক ব্যাচ যুক্ত করুন",
    href: "/admin/academic-batches",
    color: "from-amber-500 to-orange-600",
    bgLight: "bg-amber-50 text-amber-600",
    icon: BookOpen,
  },
  {
    title: "নোটিশ পোস্ট",
    desc: "শিক্ষার্থী ও অভিভাবকদের জানান",
    href: "/admin/notices",
    color: "from-rose-500 to-pink-600",
    bgLight: "bg-rose-50 text-rose-600",
    icon: Bell,
  },
];

export function QuickActions() {
  return (
    <section className="space-y-3">
      <h3 className="text-xs font-bold uppercase tracking-wider text-sage-gray-500">
        কুইক অ্যাকশনস
      </h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {actions.map((action, idx) => {
          const Icon = action.icon;
          return (
            <Link
              key={idx}
              href={action.href}
              className="group relative overflow-hidden rounded-2xl border border-sage-border bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-sage-primary hover:shadow-lg"
            >
              {/* Colored corner accent on hover */}
              <div className={`absolute top-0 right-0 h-1.5 w-1/3 bg-gradient-to-r ${action.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-bl-full`} />
              
              <div className="flex items-center gap-4">
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${action.bgLight} transition-all duration-300 group-hover:scale-110`}>
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <h4 className="font-extrabold text-sage-secondary text-sm group-hover:text-sage-primary transition-colors duration-200 flex items-center gap-1.5">
                    {action.title}
                    <ArrowRight className="h-3.5 w-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                  </h4>
                  <p className="mt-1 text-xs text-sage-gray-500 truncate">
                    {action.desc}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
