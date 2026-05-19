"use client";

import { useState } from "react";
import { CalendarClock } from "lucide-react";
import { toast } from "react-toastify";

import { generateMonthlyBillsAction } from "@/app/admin/actions";
import { monthLabels, months } from "./payment-options";

export function MonthlyBillGenerator() {
  const now = new Date();
  const [month, setMonth] = useState<string>(months[now.getMonth()]);
  const [year, setYear] = useState(now.getFullYear());
  const [isGenerating, setIsGenerating] = useState(false);

  async function generate() {
    const formData = new FormData();
    formData.append("month", month);
    formData.append("year", String(year));
    setIsGenerating(true);
    const res = await generateMonthlyBillsAction(formData);
    setIsGenerating(false);

    if (res.ok && res.data) {
      toast.success(
        `${monthLabels[month] || month} ${year}: ${res.data.created} new bills, ${res.data.refreshed} refreshed.`
      );
    } else {
      toast.error(res.message || "Could not generate bills.");
    }
  }

  return (
    <section className="rounded-xl border border-sage-border bg-white p-4 shadow-sm">
      <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
        <div className="flex gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-sage-red-50 text-sage-primary">
            <CalendarClock className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-lg font-black text-sage-secondary">
              মাসিক বিল তৈরি করুন
            </h3>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-sage-gray-500">
              নির্বাচিত মাসে সব active শিক্ষার্থীর জন্য subject fee ও discount ধরে bill তৈরি হবে। আগে তৈরি থাকলে bill refresh হবে, কিন্তু আগের payment transaction থাকবে।
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-[160px_120px_auto]">
          <select
            value={month}
            onChange={(event) => setMonth(event.target.value)}
            className="h-11 rounded-lg border border-sage-border bg-white px-3 text-sm font-bold text-sage-secondary"
          >
            {months.map((item) => (
              <option key={item} value={item}>
                {monthLabels[item]}
              </option>
            ))}
          </select>
          <input
            type="number"
            value={year}
            onChange={(event) => setYear(Number(event.target.value) || now.getFullYear())}
            className="h-11 rounded-lg border border-sage-border px-3 text-sm font-bold text-sage-secondary"
          />
          <button
            type="button"
            disabled={isGenerating}
            onClick={generate}
            className="h-11 rounded-lg bg-sage-primary px-5 text-sm font-bold text-white transition hover:bg-sage-secondary disabled:opacity-60"
          >
            {isGenerating ? "তৈরি হচ্ছে..." : "Generate bills"}
          </button>
        </div>
      </div>
    </section>
  );
}
