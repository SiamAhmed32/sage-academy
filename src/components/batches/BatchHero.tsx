"use client";

import Image from "next/image";
import Link from "next/link";
import { CalendarDays, ChevronRight, ClipboardCheck, Users } from "lucide-react";

import { Container } from "@/components/shared/Container";
import type { Batch } from "@/types/batch";

type BatchHeroProps = {
  promotionCard: any;
  batch: any;
};

export function BatchHero({ promotionCard, batch }: BatchHeroProps) {
  return (
    <>
      <div className="border-b border-sage-red-100/50 bg-sage-red-50/50 py-4">
        <Container>
          <div className="flex items-center gap-2 text-xs font-medium text-sage-gray-500">
            <Link href="/" className="hover:text-sage-primary">হোম</Link>
            <ChevronRight size={12} />
            <Link href="/batches" className="hover:text-sage-primary">ব্যাচসমূহ</Link>
            <ChevronRight size={12} />
            <span className="text-sage-secondary">{batch.title}</span>
          </div>
        </Container>
      </div>

      <div className="relative aspect-video w-full overflow-hidden rounded-3xl border border-sage-red-100 shadow-xl shadow-sage-red-100/20">
        <Image
          src={promotionCard.image || batch.image || "/BatchImages/CAP26a.jpeg"}
          alt={batch.title}
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-sage-secondary/70 via-sage-secondary/10 to-transparent" />
        <div className="absolute bottom-6 left-8">
          <span className="rounded-full bg-sage-primary px-5 py-1.5 text-xs font-bold text-white shadow-lg">
            {promotionCard.badge || batch.status}
          </span>
        </div>
      </div>

      <div className="mt-10">
        <p className="mb-3 text-sm font-bold text-sage-primary">
          SAGE Academy Academic Batch
        </p>
        <h1 className="text-4xl font-extrabold leading-tight text-sage-secondary sm:text-5xl">
          {batch.title}
        </h1>

        <div className="mt-6 flex flex-wrap items-center gap-5 text-sm font-semibold text-sage-gray-600">
          <div className="flex items-center gap-2.5">
            <Users size={18} className="text-sage-primary" />
            <span>ছেলে ও মেয়েদের আলাদা ব্যাচ</span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="h-2 w-2 rounded-full bg-sage-primary" />
            <span>{batch.version === "english" ? "English Version" : "Bangla Version"}</span>
          </div>
        </div>
      </div>
    </>
  );
}
