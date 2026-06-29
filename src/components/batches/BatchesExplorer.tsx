"use client";

import { useEffect, useMemo, useState } from "react";
import { Filter, Search } from "lucide-react";

import { Container } from "@/components/shared/Container";
import { BatchCard } from "@/components/home/BatchCard";
import { batches as homeBatches } from "@/constants/batches";
import type { BatchItem } from "@/constants/batches";

const PAGE_SIZE = 6;

function getBatchKey(card: BatchItem & { _id?: unknown }, index: number) {
  if (card._id) return String(card._id);
  if (card.slug) return card.slug;
  return `${card.title}-${index}`;
}

export function BatchesExplorer({ batches = homeBatches }: { batches?: BatchItem[] }) {
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQ(q.trim()), 350);
    return () => clearTimeout(timer);
  }, [q]);

  const classOptions = useMemo(() => {
    const values = new Set<string>();
    batches.forEach((item) => {
      values.add(item.title);
    });
    return Array.from(values);
  }, [batches]);

  const filteredBatches = useMemo(() => {
    const query = debouncedQ.toLowerCase();

    return batches.filter((batch) => {
      const matchesQuery = !query
        ? true
        : `${batch.title} ${batch.shift ?? ""} ${batch.features.join(" ")}`
            .toLowerCase()
            .includes(query);
      const matchesClass = selectedClass ? batch.title === selectedClass : true;
      return matchesQuery && matchesClass;
    });
  }, [batches, debouncedQ, selectedClass]);

  const total = filteredBatches.length;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(page, pages);
  const hasPrev = currentPage > 1;
  const hasNext = currentPage < pages;
  const items = filteredBatches.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  return (
    <section className="relative overflow-hidden bg-sage-white py-16 sm:py-20">
      <div className="absolute -left-28 top-16 h-72 w-72 rounded-full bg-sage-red-50 blur-2xl" />
      <div className="absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-sage-red-50/70 blur-2xl" />

      <Container className="relative">
        <div className="rounded-3xl border border-sage-red-100 bg-white/90 p-5 shadow-lg backdrop-blur sm:p-8">
          <div className="grid gap-4 lg:grid-cols-12">
            <label className="lg:col-span-8">
              <span className="mb-2 inline-flex items-center gap-2 text-sm font-semibold text-sage-secondary">
                <Search size={16} />
                ব্যাচ খুঁজুন
              </span>
              <input
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setPage(1);
                }}
                placeholder="শ্রেণি, শিফট বা ফিচার লিখুন..."
                className="h-12 w-full rounded-xl border border-sage-red-100 px-4 text-sm outline-none ring-0 transition focus:border-sage-primary"
              />
            </label>

            <label className="lg:col-span-4">
              <span className="mb-2 inline-flex items-center gap-2 text-sm font-semibold text-sage-secondary">
                <Filter size={16} />
                শ্রেণি
              </span>
              <select
                value={selectedClass}
                onChange={(e) => {
                  setSelectedClass(e.target.value);
                  setPage(1);
                }}
                className="h-12 w-full rounded-xl border border-sage-red-100 bg-white px-3 text-sm outline-none transition focus:border-sage-primary"
              >
                <option value="">সব শ্রেণি</option>
                {classOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between text-sm text-sage-gray-700">
          <p>মোট ব্যাচ: {total}</p>
          <button
            onClick={() => {
              setQ("");
              setSelectedClass("");
            }}
            className="rounded-full border border-sage-red-100 px-4 py-2 font-semibold text-sage-secondary transition hover:border-sage-primary hover:text-sage-primary"
          >
            ফিল্টার রিসেট
          </button>
        </div>

        {items.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-sage-red-100 bg-white p-8 text-center text-sage-gray-700">
            আপনার ফিল্টার অনুযায়ী কোনো ব্যাচ পাওয়া যায়নি।
          </div>
        ) : (
          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {items.map((card: BatchItem, index: number) => (
              <BatchCard key={getBatchKey(card, index)} card={card} />
            ))}
          </div>
        )}

        {pages > 1 && (
          <div className="mt-10 flex items-center justify-center gap-3">
            <button
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={!hasPrev}
              className="rounded-full border border-sage-red-100 px-4 py-2 text-sm font-semibold text-sage-secondary transition hover:border-sage-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              পূর্বের পেজ
            </button>
            <span className="rounded-full bg-sage-red-50 px-4 py-2 text-sm font-semibold text-sage-secondary">
              {currentPage} / {pages}
            </span>
            <button
              onClick={() => setPage((prev) => prev + 1)}
              disabled={!hasNext}
              className="rounded-full border border-sage-red-100 px-4 py-2 text-sm font-semibold text-sage-secondary transition hover:border-sage-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              পরের পেজ
            </button>
          </div>
        )}
      </Container>
    </section>
  );
}
