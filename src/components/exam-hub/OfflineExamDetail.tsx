"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  ChevronDown,
  Clock3,
  ClipboardList,
  MapPin,
  Phone,
  Sparkles,
  Users,
} from "lucide-react";

import { Container } from "@/components/shared/Container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { deliveryModeLabels, offlineTypeLabels } from "@/constants/exam-hub";
import type { PublicExamProgram } from "@/lib/exam-hub";
import type { NormalizedSubjectSyllabusItem } from "@/lib/exam-hub-syllabus";
import { cn } from "@/lib/utils";

export function OfflineExamDetail({ program }: { program: PublicExamProgram }) {
  const subjects = program.subjectSyllabusItems || [];
  const typeLabel = program.offlineType
    ? offlineTypeLabels[program.offlineType as keyof typeof offlineTypeLabels]
    : "Offline exam";
  const totalTopics = subjects.reduce((sum, subject) => sum + subject.topics.length, 0);

  return (
    <>
      <section className="relative overflow-hidden border-b border-amber-100 bg-gradient-to-br from-amber-50 via-white to-orange-50/40 pb-16 pt-10 sm:pb-20 sm:pt-12">
        <div className="pointer-events-none absolute -left-24 top-0 h-80 w-80 rounded-full bg-amber-100/80 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 top-20 h-72 w-72 rounded-full bg-orange-100/70 blur-3xl" />

        <Container className="relative">
          <Button asChild variant="ghost" className="mb-6 -ml-2 rounded-xl text-sage-gray-600 hover:text-sage-secondary">
            <Link href="/exams">
              <ArrowLeft className="size-4" />
              Back to exams
            </Link>
          </Button>

          <div className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr] xl:items-start">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-amber-100 text-amber-900 hover:bg-amber-100">
                  {deliveryModeLabels.offline}
                </Badge>
                {program.offlineType ? (
                  <Badge className="bg-orange-100 text-orange-900 hover:bg-orange-100">{typeLabel}</Badge>
                ) : null}
                {program.isLive ? (
                  <Badge className="bg-emerald-100 text-emerald-800">Running now</Badge>
                ) : (
                  <Badge variant="outline">Upcoming / completed</Badge>
                )}
              </div>

              <div className="space-y-4">
                <h1 className="bn-headline text-4xl font-bold leading-tight text-sage-secondary sm:text-5xl lg:text-[3.25rem]">
                  {program.title}
                </h1>
                {program.subtitle ? (
                  <p className="bn-headline-subline text-lg text-sage-gray-700 sm:text-xl">{program.subtitle}</p>
                ) : null}
                <p className="bn-text max-w-3xl text-base leading-8 text-sage-gray-700 sm:text-lg">
                  {program.description || "Center-based offline exam details are listed below."}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
                <FactCard icon={CalendarDays} label="Exam date" value={program.dateLabel.split("–")[0]?.trim() || program.dateLabel} />
                <FactCard icon={Clock3} label="Exam time" value={program.examTime || "Will be announced"} accent />
                <FactCard icon={MapPin} label="Venue" value={program.venue || "SAGE Academy center"} />
                <FactCard icon={Users} label="Class" value={program.classLabel} />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="overflow-hidden rounded-3xl border border-amber-200/80 bg-white shadow-lg shadow-amber-100/50 xl:sticky xl:top-24"
            >
              {program.image ? (
                <div className="relative h-52 w-full sm:h-60">
                  <Image src={program.image} alt="" fill className="object-cover" unoptimized />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                </div>
              ) : (
                <div className="flex h-52 items-center justify-center bg-gradient-to-br from-amber-100 to-orange-50 sm:h-60">
                  <BookOpen className="size-16 text-amber-700/40" />
                </div>
              )}
              <div className="space-y-4 p-6">
                <p className="text-sm font-semibold uppercase tracking-wide text-amber-800">Quick summary</p>
                <ul className="space-y-3 text-sm text-sage-gray-700">
                  <SummaryRow label="Type" value={typeLabel} />
                  <SummaryRow label="Time" value={program.examTime || "TBA"} />
                  <SummaryRow label="Venue" value={program.venue || "Center"} />
                  <SummaryRow
                    label="Subjects"
                    value={
                      subjects.length
                        ? `${subjects.length} subject${subjects.length > 1 ? "s" : ""}${totalTopics ? ` · ${totalTopics} topics` : ""}`
                        : "See syllabus"
                    }
                  />
                </ul>
                <Button asChild className="h-11 w-full rounded-xl bg-amber-700 font-bold hover:bg-amber-800">
                  <Link href="/contact">
                    <Phone className="size-4" />
                    Contact for enrollment
                  </Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </Container>
      </section>

      <section className="py-16 sm:py-20">
        <Container className="space-y-8">
          {subjects.length > 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              className="overflow-hidden rounded-[2rem] border border-amber-200/80 bg-white shadow-sm"
            >
              <div className="border-b border-amber-100 bg-gradient-to-r from-amber-50/80 via-white to-orange-50/40 px-6 py-6 sm:px-8 sm:py-7">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-4">
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-amber-700 text-white shadow-lg shadow-amber-200/60">
                      <BookOpen className="size-5" />
                    </span>
                    <div>
                      <h2 className="bn-headline text-2xl font-bold text-sage-secondary sm:text-3xl">Subject syllabus</h2>
                      <p className="mt-1 text-sm text-sage-gray-500 sm:text-base">
                        Detailed topics for each subject in this {typeLabel.toLowerCase()} exam
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="rounded-full bg-amber-100 px-3 py-1 text-amber-900 hover:bg-amber-100">
                      {subjects.length} subjects
                    </Badge>
                    {totalTopics > 0 ? (
                      <Badge variant="outline" className="rounded-full px-3 py-1">
                        {totalTopics} topics
                      </Badge>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 p-4 sm:p-6 lg:grid-cols-2">
                {subjects.map((subject, index) => (
                  <SubjectSyllabusCard key={`${subject.name}-${index}`} subject={subject} index={index} />
                ))}
              </div>
            </motion.div>
          ) : null}

          <div className="grid gap-6 lg:grid-cols-2">
            <DetailPanel
              icon={ClipboardList}
              title="Instructions"
              body={program.instructions || "Instructions will be shared before the exam day."}
            />
            {program.scheduleNote ? (
              <DetailPanel icon={Clock3} title="Schedule note" body={program.scheduleNote} highlight />
            ) : null}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            className="rounded-[2rem] border border-sage-border bg-gradient-to-br from-sage-cream/40 via-white to-sage-red-50/20 p-6 sm:p-8"
          >
            <div className="flex items-start gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-sage-primary text-white">
                <Sparkles className="size-4" />
              </span>
              <div>
                <h2 className="text-xl font-bold text-sage-secondary sm:text-2xl">Center enrollment</h2>
                <p className="bn-text mt-3 max-w-4xl text-sm leading-8 text-sage-gray-700 sm:text-base">
                  {program.enrollmentInfo ||
                    "Offline weekly and monthly exams are enrolled at the SAGE Academy center. Visit the center or contact admission support for registration."}
                </p>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild variant="outline" className="rounded-xl">
                <Link href="/exams">Browse other exams</Link>
              </Button>
              <Button asChild className="rounded-xl bg-sage-primary hover:bg-sage-secondary">
                <Link href="/contact">Contact admission</Link>
              </Button>
            </div>
          </motion.div>
        </Container>
      </section>
    </>
  );
}

function SubjectSyllabusCard({
  subject,
  index,
}: {
  subject: NormalizedSubjectSyllabusItem;
  index: number;
}) {
  const [open, setOpen] = useState(index === 0);
  const hasTopics = subject.topics.length > 0;

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ delay: index * 0.05 }}
      className="overflow-hidden rounded-2xl border border-amber-100 bg-gradient-to-br from-white to-amber-50/30 shadow-sm"
    >
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-amber-50/50"
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-amber-700 text-sm font-black text-white">
          {index + 1}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-bold text-sage-secondary">{subject.name}</h3>
          <p className="text-xs text-sage-gray-500">
            {hasTopics ? `${subject.topics.length} topic${subject.topics.length > 1 ? "s" : ""}` : "General syllabus"}
          </p>
        </div>
        <ChevronDown
          className={cn("size-5 shrink-0 text-amber-700 transition-transform duration-200", open && "rotate-180")}
        />
      </button>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="border-t border-amber-100 px-5 py-4">
              {hasTopics ? (
                <ul className="grid gap-2 sm:grid-cols-2">
                  {subject.topics.map((topic, topicIndex) => (
                    <li
                      key={`${topic}-${topicIndex}`}
                      className="flex items-start gap-2 rounded-xl border border-amber-100/80 bg-white px-3 py-2.5 text-sm text-sage-gray-700"
                    >
                      <span className="mt-1 size-1.5 shrink-0 rounded-full bg-amber-600" />
                      <span className="leading-6">{topic}</span>
                    </li>
                  ))}
                </ul>
              ) : subject.syllabus ? (
                <p className="whitespace-pre-wrap text-sm leading-7 text-sage-gray-700">{subject.syllabus}</p>
              ) : (
                <p className="text-sm text-sage-gray-500">Detailed syllabus will be announced soon.</p>
              )}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.article>
  );
}

function FactCard({
  icon: Icon,
  label,
  value,
  accent = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border px-5 py-4 transition hover:-translate-y-0.5 hover:shadow-sm",
        accent ? "border-amber-300 bg-amber-50/80" : "border-sage-border bg-white"
      )}
    >
      <div className="flex items-start gap-3">
        <Icon className={cn("mt-0.5 size-5 shrink-0", accent ? "text-amber-700" : "text-sage-primary")} />
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-sage-gray-500">{label}</p>
          <p className="bn-text mt-1 text-sm font-semibold leading-6 text-sage-secondary sm:text-base">{value}</p>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <li className="flex items-start justify-between gap-4 border-b border-amber-100 pb-2 last:border-0 last:pb-0">
      <span className="text-sage-gray-500">{label}</span>
      <span className="text-right font-semibold text-sage-secondary">{value}</span>
    </li>
  );
}

function DetailPanel({
  icon: Icon,
  title,
  body,
  highlight = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
  highlight?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      className={cn(
        "rounded-[1.75rem] border p-6 sm:p-7",
        highlight ? "border-amber-200 bg-amber-50/50" : "border-sage-border bg-white shadow-sm"
      )}
    >
      <div className="flex items-center gap-3">
        <Icon className="size-5 text-amber-700" />
        <h2 className="text-lg font-bold text-sage-secondary sm:text-xl">{title}</h2>
      </div>
      <p className="bn-text mt-4 whitespace-pre-wrap text-sm leading-8 text-sage-gray-700 sm:text-base">{body}</p>
    </motion.div>
  );
}
