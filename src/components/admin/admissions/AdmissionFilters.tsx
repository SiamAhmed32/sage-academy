"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search, Filter, RotateCcw } from "lucide-react";
import { requestStatusOptions } from "@/constants/admin";

export function AdmissionFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentSearch = searchParams.get("search") || "";
  const currentStatus = searchParams.get("status") || "all";
  const currentClass = searchParams.get("class") || "all";
  const currentView = searchParams.get("view") || "active";

  function updateFilters(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === "all" || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    router.push(`?${params.toString()}`);
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-sage-border bg-sage-white p-4 shadow-sm md:flex-row md:items-center">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-sage-gray-400" size={18} />
        <input
          type="text"
          placeholder="নাম বা মোবাইল দিয়ে খুঁজুন..."
          defaultValue={currentSearch}
          onChange={(e) => {
            const val = e.target.value;
            const timer = setTimeout(() => updateFilters({ search: val }), 500);
            return () => clearTimeout(timer);
          }}
          className="h-11 w-full rounded-lg border border-sage-border bg-sage-red-50/30 pl-10 pr-4 text-sm outline-none transition focus:border-sage-primary"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Filter className="text-sage-gray-400" size={18} />
        <select
          value={currentStatus}
          onChange={(e) => updateFilters({ status: e.target.value })}
          className="h-11 rounded-lg border border-sage-border bg-white px-3 text-sm outline-none"
        >
          <option value="all">সব স্ট্যাটাস</option>
          {requestStatusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        <select
          value={currentClass}
          onChange={(e) => updateFilters({ class: e.target.value })}
          className="h-11 rounded-lg border border-sage-border bg-white px-3 text-sm outline-none"
        >
          <option value="all">সব শ্রেণি</option>
          {["5", "6", "7", "8", "9", "10", "11", "12"].map((c) => (
            <option key={c} value={c}>{c}ম শ্রেণি</option>
          ))}
        </select>

        {/* View Toggle: Active vs Archived */}
        <div className="flex rounded-lg border border-sage-border bg-sage-red-50 p-1">
          <button 
            onClick={() => updateFilters({ view: "active" })}
            className={`rounded-md px-4 py-1.5 text-xs font-bold transition ${currentView === "active" ? "bg-white text-sage-primary shadow-sm" : "text-sage-gray-500"}`}
          >
            একটিভ
          </button>
          <button 
            onClick={() => updateFilters({ view: "archived" })}
            className={`rounded-md px-4 py-1.5 text-xs font-bold transition ${currentView === "archived" ? "bg-white text-sage-primary shadow-sm" : "text-sage-gray-500"}`}
          >
            আর্কাইভড
          </button>
        </div>

        <button
          onClick={() => router.push("/admin/admissions")}
          className="flex h-11 w-11 items-center justify-center rounded-lg border border-sage-border bg-white text-sage-gray-400 transition hover:bg-sage-red-50 hover:text-sage-primary"
          title="Reset"
        >
          <RotateCcw size={18} />
        </button>
      </div>
    </div>
  );
}
