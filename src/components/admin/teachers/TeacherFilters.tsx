"use client";

import { Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition, useEffect } from "react";

import { Input } from "@/components/ui/input";

export function TeacherFilters({ subjects }: { subjects: string[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [searchValue, setSearchValue] = useState(searchParams.get("q") || "");

  // Custom debounce logic
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams);
      const currentQ = searchParams.get("q") || "";
      if (searchValue !== currentQ) {
        if (searchValue) {
          params.set("q", searchValue);
        } else {
          params.delete("q");
        }
        params.set("page", "1");
        startTransition(() => {
          router.push(`?${params.toString()}`);
        });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchValue, searchParams, router]);

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set("page", "1");
    startTransition(() => {
      router.push(`?${params.toString()}`);
    });
  };

  const clearFilters = () => {
    setSearchValue("");
    startTransition(() => {
      router.push("/admin/teachers");
    });
  };

  return (
    <div className="mb-6 space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-sage-gray-400" />
          <Input
            placeholder="শিক্ষকের নাম অথবা বিষয় লিখে খুঁজুন..."
            className="pl-10 h-11 border-sage-border focus:ring-sage-primary/20"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <select
            className="h-11 rounded-lg border border-sage-border bg-white px-3 text-sm font-semibold text-sage-secondary outline-none focus:ring-2 focus:ring-sage-primary/20"
            value={searchParams.get("subject") || ""}
            onChange={(e) => handleFilterChange("subject", e.target.value)}
          >
            <option value="">সকল বিষয়</option>
            {subjects.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <select
            className="h-11 rounded-lg border border-sage-border bg-white px-3 text-sm font-semibold text-sage-secondary outline-none focus:ring-2 focus:ring-sage-primary/20"
            value={searchParams.get("sort") || "order:asc"}
            onChange={(e) => handleFilterChange("sort", e.target.value)}
          >
            <option value="order:asc">সিরিয়াল (ছোট থেকে বড়)</option>
            <option value="order:desc">সিরিয়াল (বড় থেকে ছোট)</option>
            <option value="name:asc">নাম (A-Z)</option>
            <option value="name:desc">নাম (Z-A)</option>
            <option value="createdAt:desc">নতুন আগে</option>
          </select>

          <select
            className="h-11 rounded-lg border border-sage-border bg-white px-3 text-sm font-semibold text-sage-secondary outline-none focus:ring-2 focus:ring-sage-primary/20"
            value={searchParams.get("isFeatured") || ""}
            onChange={(e) => handleFilterChange("isFeatured", e.target.value)}
          >
            <option value="">সব শিক্ষক</option>
            <option value="true">Featured Only</option>
            <option value="false">Non-Featured</option>
          </select>
          { (searchParams.get("q") || searchParams.get("isFeatured") || searchParams.get("subject")) && (
            <button
              onClick={clearFilters}
              className="flex h-11 items-center gap-2 rounded-lg border border-sage-red-100 bg-sage-red-50 px-4 text-sm font-bold text-sage-primary transition hover:bg-sage-red-100"
            >
              <X size={16} /> রিসেট
            </button>
          ) }
        </div>
      </div>
      {isPending && <p className="text-xs text-sage-primary animate-pulse font-medium">লোড হচ্ছে...</p>}
    </div>
  );
}
