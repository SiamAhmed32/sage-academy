"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, CalendarDays, Clock3, MapPin, Sparkles, Trophy, Users } from "lucide-react";
import { motion } from "framer-motion";

import { accessTypeLabels, deliveryModeLabels, offlineTypeLabels } from "@/constants/exam-hub";
import type { PublicExamProgram } from "@/lib/exam-hub";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function MetaRow({
  icon,
  children,
  hidden = false,
}: {
  icon: ReactNode;
  children: ReactNode;
  hidden?: boolean;
}) {
  return (
    <div className={cn("flex min-h-6 items-start gap-2.5 text-sm text-sage-gray-700", hidden && "invisible")}>
      <span className="mt-0.5 shrink-0 text-sage-primary">{icon}</span>
      <span className="leading-6">{children}</span>
    </div>
  );
}

export function ExamProgramCard({ program, index = 0 }: { program: PublicExamProgram; index?: number }) {
  const isOnline = program.deliveryMode === "online";
  const isPaid = program.requiresPayment;
  const description = program.description?.trim() || "বিস্তারিত তথ্য দেখতে পরীক্ষার পেজে যান।";

  return (
    <motion.div
      className="h-full"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.45 }}
    >
      <article
        className={cn(
          "group flex h-full flex-col overflow-hidden rounded-[1.35rem] bg-white shadow-lg shadow-sage-primary/5 ring-1 ring-sage-border transition hover:-translate-y-1 hover:shadow-xl hover:shadow-sage-primary/10",
          program.featured && "ring-2 ring-sage-gold/60"
        )}
      >
        {program.image ? (
          <div className="relative h-40 w-full shrink-0 overflow-hidden bg-sage-red-50 sm:h-44">
            <Image
              src={program.image}
              alt={program.title}
              fill
              className="object-cover transition duration-500 group-hover:scale-105"
              unoptimized
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
          </div>
        ) : null}

        <div className="flex flex-1 flex-col px-5 pb-5 pt-4">
          <div className="flex flex-wrap items-center gap-2">
            {program.featured ? (
              <Badge className="border-sage-gold/30 bg-sage-gold-soft text-sage-gold-muted">
                <Sparkles className="size-3" />
                Featured
              </Badge>
            ) : null}
            <Badge variant="outline" className="border-sage-border text-sage-secondary">
              {deliveryModeLabels[program.deliveryMode as keyof typeof deliveryModeLabels]}
            </Badge>
            {isOnline ? (
              <Badge variant="secondary" className="bg-sage-card-sky text-sage-secondary">
                {accessTypeLabels[program.accessType as keyof typeof accessTypeLabels]}
              </Badge>
            ) : program.offlineType ? (
              <Badge variant="secondary" className="bg-sage-card-honey text-sage-secondary">
                {offlineTypeLabels[program.offlineType as keyof typeof offlineTypeLabels]}
              </Badge>
            ) : null}
            {program.isLive ? (
              <Badge className="bg-sage-success-soft text-emerald-700">Live</Badge>
            ) : (
              <Badge variant="outline">Upcoming / Ended</Badge>
            )}
          </div>

          <h3 className="bn-headline mt-3 line-clamp-2 min-h-[3.25rem] text-xl font-bold leading-8 text-sage-secondary">
            {program.title}
          </h3>

          {program.subtitle ? (
            <p className="bn-text mt-1 line-clamp-1 text-sm text-sage-gray-500">{program.subtitle}</p>
          ) : (
            <div className="mt-1 min-h-5" aria-hidden="true" />
          )}

          <p className="bn-text mt-3 line-clamp-3 min-h-[4.5rem] text-sm leading-7 text-sage-gray-700">
            {description}
          </p>

          <div className="mt-4 grid min-h-[5.75rem] gap-2">
            <MetaRow icon={<CalendarDays className="size-4" />}>{program.dateLabel}</MetaRow>
            {isOnline ? (
              <>
                <MetaRow icon={<Clock3 className="size-4" />}>
                  {program.durationMinutes} min · {program.totalMarks} marks
                </MetaRow>
                <MetaRow icon={<Trophy className="size-4" />} hidden={!program.showLeaderboard}>
                  Leaderboard enabled
                </MetaRow>
              </>
            ) : (
              <>
                <MetaRow icon={<Clock3 className="size-4 text-amber-700" />} hidden={!program.examTime}>
                  {program.examTime || "—"}
                </MetaRow>
                <MetaRow icon={<MapPin className="size-4" />} hidden={!program.venue}>
                  <span className="line-clamp-1">{program.venue || "—"}</span>
                </MetaRow>
                <MetaRow icon={<Users className="size-4" />}>{program.classLabel}</MetaRow>
              </>
            )}
          </div>

          <div className="mt-4 min-h-[2.75rem]">
            {isPaid && isOnline ? (
              <div className="rounded-xl bg-sage-red-50 px-3 py-2 text-sm font-semibold text-sage-primary">
                Fee: ৳{program.feeAmount}
              </div>
            ) : isOnline ? (
              <div className="rounded-xl bg-sage-success-soft px-3 py-2 text-sm font-semibold text-emerald-700">
                Free registration
              </div>
            ) : (
              <div className="rounded-xl bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900">
                Center exam · info only
              </div>
            )}
          </div>

          <div className="mt-auto pt-5">
            <Button
              asChild
              className={cn(
                "h-11 w-full rounded-xl font-bold shadow-sm",
                isOnline ? "bg-sage-primary hover:bg-sage-secondary" : "bg-amber-700 hover:bg-amber-800"
              )}
            >
              <Link href={`/exams/${program.slug}`}>
                {isOnline ? "View exam" : "View schedule & details"}
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </article>
    </motion.div>
  );
}
