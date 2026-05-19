"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, type LucideIcon } from "lucide-react";

import { Container } from "@/components/shared/Container";
import type { BatchDetailsResponse } from "@/types/batch";

type RelatedBatch = BatchDetailsResponse["data"]["related"][number];

type BatchRelatedProps = {
  related: RelatedBatch[];
  resolveSlug: (title: string, slug?: string) => string;
};

export function BatchRelated({ related, resolveSlug }: BatchRelatedProps) {
  const [slideIndex, setSlideIndex] = useState(0);

  useEffect(() => {
    if (related.length < 2) return;
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        setSlideIndex((prev) => (prev === related.length - 1 ? 0 : prev + 1));
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [related.length]);

  const orderedBatches = useMemo(
    () => related.map((_, index) => related[(slideIndex + index) % related.length]),
    [related, slideIndex]
  );

  if (related.length === 0) return null;

  return (
    <section className="overflow-hidden bg-sage-red-50/30 py-20">
      <Container>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-sage-primary">
              More Academic Options
            </span>
            <h2 className="mt-2 text-4xl font-extrabold text-sage-secondary">
              আরও ব্যাচ দেখুন
            </h2>
          </div>
          {related.length > 1 && (
            <div className="flex items-center gap-3">
              <NavButton icon={ChevronLeft} onClick={() => setSlideIndex((p) => (p === 0 ? related.length - 1 : p - 1))} />
              <NavButton icon={ChevronRight} onClick={() => setSlideIndex((p) => (p + 1) % related.length)} />
            </div>
          )}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={slideIndex}
            initial={{ opacity: 0, x: 28 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -28 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          >
            {orderedBatches.slice(0, 3).map((item, index) => (
              <div key={item._id} className={`${index > 0 ? "hidden md:block" : ""} ${index > 1 ? "md:hidden lg:block" : ""}`}>
                <BatchCard item={item} resolveSlug={resolveSlug} />
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      </Container>
    </section>
  );
}

function NavButton({ icon: Icon, onClick }: { icon: LucideIcon; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex h-12 w-12 items-center justify-center rounded-full border border-sage-red-100 bg-white text-sage-secondary transition-all hover:bg-sage-primary hover:text-white"
    >
      <Icon size={20} />
    </button>
  );
}

function BatchCard({ item, resolveSlug }: { item: any; resolveSlug: BatchRelatedProps["resolveSlug"] }) {
  return (
    <Link href={`/batches/${resolveSlug(item.title, item.slug)}`} className="group block overflow-hidden rounded-2xl border border-sage-red-100 bg-white transition hover:border-sage-primary">
      <div className="relative h-52 w-full overflow-hidden">
        <Image src={item.image || "/BatchImages/CAP26a.jpeg"} alt={item.title} fill className="object-cover transition duration-500 group-hover:scale-110" />
      </div>
      <div className="p-5">
        <span className="rounded-full bg-sage-red-50 px-3 py-1 text-[10px] font-bold text-sage-primary uppercase tracking-wider">
          {item.badge || "ভর্তি চলছে"}
        </span>
        <h3 className="mt-4 line-clamp-1 text-lg font-bold text-sage-secondary group-hover:text-sage-primary transition">{item.title}</h3>
        <p className="mt-1 text-sm text-sage-gray-500">নিয়মিত একাডেমিক ব্যাচ</p>
      </div>
    </Link>
  );
}
