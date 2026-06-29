"use client";

import Image from "next/image";
import Link from "next/link";
import {
  CalendarRange,
  Clock3,
  ExternalLink,
  FileQuestion,
  Pencil,
  Repeat2,
  Trophy,
  Users,
} from "lucide-react";

import type { AdminExamProgram } from "@/components/admin/exam-hub/ExamHubManager";
import {
  accessTypeLabels,
  deliveryModeLabels,
  offlineTypeLabels,
} from "@/constants/exam-hub";
import { normalizeSubjectSyllabus } from "@/lib/exam-hub-syllabus";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Props = {
  program: AdminExamProgram | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (program: AdminExamProgram) => void;
};

function formatDateTime(value?: string) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function DetailItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-sage-border bg-sage-cream/25 px-3 py-2.5">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-sage-gray-500">{label}</p>
      <div className="mt-1 text-sm font-semibold text-sage-secondary">{value}</div>
    </div>
  );
}

function TextBlock({ label, text }: { label: string; text?: string }) {
  if (!text?.trim()) return null;
  return (
    <div className="rounded-xl border border-sage-border bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-sage-gray-500">{label}</p>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-sage-gray-700">{text}</p>
    </div>
  );
}

function SubjectSyllabusBlock({ program }: { program: AdminExamProgram }) {
  const subjects = normalizeSubjectSyllabus(program);
  if (subjects.length === 0) return null;

  return (
    <div className="rounded-xl border border-sage-border bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-sage-gray-500">Subject syllabus</p>
      <div className="mt-3 space-y-3">
        {subjects.map((subject, index) => (
          <div key={`${subject.name}-${index}`} className="rounded-xl border border-amber-100 bg-amber-50/40 p-3">
            <p className="font-semibold text-sage-secondary">
              {index + 1}. {subject.name}
            </p>
            {subject.topics.length > 0 ? (
              <ul className="mt-2 space-y-1 text-sm text-sage-gray-700">
                {subject.topics.map((topic, topicIndex) => (
                  <li key={`${topic}-${topicIndex}`} className="flex gap-2">
                    <span className="text-amber-700">•</span>
                    <span>{topic}</span>
                  </li>
                ))}
              </ul>
            ) : subject.syllabus ? (
              <p className="mt-2 whitespace-pre-wrap text-sm text-sage-gray-700">{subject.syllabus}</p>
            ) : (
              <p className="mt-2 text-sm text-sage-gray-500">No topics listed yet.</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ExamProgramViewModal({ program, open, onOpenChange, onEdit }: Props) {
  if (!program) return null;

  const isOnline = program.deliveryMode === "online";
  const hasCover = Boolean(program.image?.trim());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-2xl">
        <div className="relative">
          <div className="relative h-40 w-full bg-gradient-to-br from-sage-primary/90 to-sage-secondary">
            {hasCover ? (
              <>
                <Image src={program.image!} alt="" fill className="object-cover opacity-35" unoptimized />
                <div className="absolute inset-0 bg-gradient-to-t from-sage-secondary/95 via-sage-secondary/60 to-transparent" />
              </>
            ) : null}
            <div className="absolute inset-x-0 bottom-0 p-5">
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-white/15 text-white hover:bg-white/20">{program.deliveryMode}</Badge>
                <Badge className="bg-white/15 text-white hover:bg-white/20">{program.status}</Badge>
                {isOnline && program.accessType ? (
                  <Badge className="bg-white/15 text-white hover:bg-white/20">{program.accessType}</Badge>
                ) : null}
                {program.featured ? (
                  <Badge className="bg-amber-400/90 text-amber-950 hover:bg-amber-400/90">Featured</Badge>
                ) : null}
              </div>
              <DialogHeader className="mt-3 gap-1 text-left">
                <DialogTitle className="text-xl font-bold text-white">{program.title}</DialogTitle>
                {program.subtitle ? (
                  <p className="text-sm text-white/80">{program.subtitle}</p>
                ) : null}
                <p className="font-mono text-xs text-white/60">/{program.slug}</p>
              </DialogHeader>
            </div>
          </div>
        </div>

        <div className="max-h-[calc(90vh-10rem)] space-y-4 overflow-y-auto p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <DetailItem
              label="Delivery"
              value={deliveryModeLabels[program.deliveryMode]}
            />
            {!isOnline && program.offlineType ? (
              <DetailItem label="Offline type" value={offlineTypeLabels[program.offlineType]} />
            ) : null}
            {isOnline && program.accessType ? (
              <DetailItem label="Access" value={accessTypeLabels[program.accessType]} />
            ) : null}
            <DetailItem
              label="Schedule"
              value={
                <span className="inline-flex items-start gap-1.5">
                  <CalendarRange className="mt-0.5 size-3.5 shrink-0 text-sage-primary" />
                  {formatDateTime(program.startDate)} → {formatDateTime(program.endDate)}
                </span>
              }
            />
            {isOnline ? (
              <>
                <DetailItem
                  label="Duration"
                  value={
                    <span className="inline-flex items-center gap-1.5">
                      <Clock3 className="size-3.5 text-sage-primary" />
                      {program.durationMinutes ?? 20} min
                    </span>
                  }
                />
                <DetailItem
                  label="Max attempts"
                  value={
                    <span className="inline-flex items-center gap-1.5">
                      <Repeat2 className="size-3.5 text-sage-primary" />
                      {program.maxAttempts ?? 1}
                    </span>
                  }
                />
                <DetailItem label="Total marks" value={program.totalMarks ?? 25} />
                <DetailItem
                  label="Marking"
                  value={`+${program.correctMark ?? 1} / ${program.wrongMark ?? 0} / ${program.unansweredMark ?? 0}`}
                />
                <DetailItem
                  label="Shuffle questions"
                  value={program.shuffleQuestions ? "Yes" : "No"}
                />
                <DetailItem
                  label="Leaderboard"
                  value={
                    <span className="inline-flex items-center gap-1.5">
                      <Trophy className="size-3.5 text-sage-primary" />
                      {program.showLeaderboard ? "Enabled" : "Hidden"}
                    </span>
                  }
                />
              </>
            ) : (
              <>
                <DetailItem label="Exam time" value={program.examTime?.trim() || "—"} />
                <DetailItem label="Venue" value={program.venue?.trim() || "—"} />
                <DetailItem label="Schedule note" value={program.scheduleNote?.trim() || "—"} />
              </>
            )}
            {isOnline ? (
              program.isPaid ? (
                <DetailItem label="Fee (BDT)" value={program.feeAmount ?? 0} />
              ) : (
                <DetailItem label="Payment" value="Free" />
              )
            ) : null}
            {isOnline ? (
              <DetailItem
                label="Questions / Enrollments"
                value={
                  <span className="inline-flex items-center gap-3">
                    <span className="inline-flex items-center gap-1">
                      <FileQuestion className="size-3.5 text-sage-primary" />
                      {program.questionCount ?? 0}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Users className="size-3.5 text-sage-primary" />
                      {program.enrollmentCount ?? 0}
                    </span>
                  </span>
                }
              />
            ) : null}
            <DetailItem label="Display order" value={program.order ?? 0} />
          </div>

          <TextBlock label="Description" text={program.description} />
          <TextBlock label="Instructions" text={program.instructions} />
          {isOnline ? <TextBlock label="Marking rules" text={program.markingRulesNote} /> : null}
          {!isOnline ? <SubjectSyllabusBlock program={program} /> : null}
          {!isOnline ? <TextBlock label="Enrollment info" text={program.enrollmentInfo} /> : null}
        </div>

        <DialogFooter className="gap-2 border-t border-sage-border bg-sage-cream/20 p-4 sm:justify-between">
          <Button asChild variant="outline" size="sm">
            <Link href={`/exams/${program.slug}`} target="_blank" rel="noreferrer">
              <ExternalLink className="size-4" />
              Open public page
            </Link>
          </Button>
          <div className="flex gap-2">
            {onEdit ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onOpenChange(false);
                  onEdit(program);
                }}
              >
                <Pencil className="size-4" />
                Edit
              </Button>
            ) : null}
            <Button size="sm" className="bg-sage-primary hover:bg-sage-secondary" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
