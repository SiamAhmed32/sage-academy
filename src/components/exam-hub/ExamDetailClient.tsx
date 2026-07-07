"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileQuestion,
  Loader2,
  LogIn,
  MapPin,
  Play,
  Shield,
  Trophy,
  UserPlus,
  XCircle,
} from "lucide-react";
import { toast } from "react-toastify";

import { ExamEnrollmentDialog } from "@/components/exam-hub/ExamEnrollmentDialog";
import { OfflineExamDetail } from "@/components/exam-hub/OfflineExamDetail";
import { Container } from "@/components/shared/Container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { accessTypeLabels, deliveryModeLabels, offlineTypeLabels } from "@/constants/exam-hub";
import type { PublicExamProgram } from "@/lib/exam-hub";
import { normalizeBangladeshPhone } from "@/lib/bd-phone";
import {
  clearExamHubSession,
  mergeExamHubSession,
  readExamHubSession,
  saveExamHubSession,
  type ExamHubSession,
} from "@/lib/exam-hub-session";

type EnrollmentStatus = {
  enrollmentId: string;
  name: string;
  status: string;
  paymentStatus: string;
  adminNote: string;
  canStartExam: boolean;
  canRegisterAgain: boolean;
  statusLabel: string;
};

export function ExamDetailClient({
  program,
  isLoggedIn,
  userPhone = "",
}: {
  program: PublicExamProgram;
  isLoggedIn: boolean;
  userPhone?: string;
}) {
  const router = useRouter();
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [starting, setStarting] = useState(false);
  const [session, setSession] = useState<ExamHubSession | null>(null);
  const [enrollmentStatus, setEnrollmentStatus] = useState<EnrollmentStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);

  const refreshEnrollmentStatus = useCallback(
    async (phone?: string, enrollmentId?: string) => {
      const params = new URLSearchParams({ programSlug: program.slug });
      if (enrollmentId) params.set("enrollmentId", enrollmentId);
      else if (phone) params.set("phone", normalizeBangladeshPhone(phone));
      else return;

      setStatusLoading(true);
      try {
        const res = await fetch(`/api/exam-hub/enrollments/status?${params.toString()}`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.data) {
          if (res.ok && !data?.data) setEnrollmentStatus(null);
          return;
        }

        const status = data.data as EnrollmentStatus;
        setEnrollmentStatus(status);

        const stored = readExamHubSession(program.slug);
        const nextPhone = phone || stored?.phone || userPhone;
        const sessionPatch = {
          enrollmentId: status.enrollmentId,
          phone: nextPhone,
          name: status.name,
          status: status.status,
          paymentStatus: status.paymentStatus,
          statusLabel: status.statusLabel,
          adminNote: status.adminNote,
          canRegisterAgain: status.canRegisterAgain,
          canStartExam: status.canStartExam,
        };

        if (stored) {
          mergeExamHubSession(program.slug, sessionPatch);
        } else if (nextPhone) {
          saveExamHubSession({ ...sessionPatch, programSlug: program.slug });
        }
        setSession(readExamHubSession(program.slug));
      } finally {
        setStatusLoading(false);
      }
    },
    [program.slug, userPhone]
  );

  useEffect(() => {
    const stored = readExamHubSession(program.slug);
    setSession(stored);

    if (stored?.enrollmentId) {
      refreshEnrollmentStatus(stored.phone, stored.enrollmentId);
    } else if (userPhone) {
      refreshEnrollmentStatus(userPhone);
    }
  }, [program.slug, userPhone, refreshEnrollmentStatus]);

  const isOnline = program.deliveryMode === "online";

  if (!isOnline) {
    return <OfflineExamDetail program={program} />;
  }

  const hasQuestions = (program.questionCount ?? 0) > 0;
  const examReturnPath = `/exams/${program.slug}`;
  const awaitingApproval =
    Boolean(enrollmentStatus) &&
    !enrollmentStatus!.canRegisterAgain &&
    !enrollmentStatus!.canStartExam;
  const isRegistered = Boolean(enrollmentStatus?.canStartExam);
  const wasRejected = Boolean(
    enrollmentStatus?.canRegisterAgain &&
      (enrollmentStatus.status === "cancelled" || enrollmentStatus.paymentStatus === "rejected")
  );

  const examOpensAt = program.dateLabel.split("–")[0]?.trim() || program.dateLabel;
  const waitingForSchedule = isRegistered && hasQuestions && !program.isLive && !awaitingApproval;

  const startRequirements = [
    {
      met: isRegistered,
      label: isRegistered ? "Registration confirmed" : awaitingApproval ? "Payment verification pending" : "Complete registration",
    },
    {
      met: program.isLive,
      label: program.isLive ? "Exam is live now" : `Exam opens ${examOpensAt}`,
    },
    {
      met: hasQuestions,
      label: hasQuestions ? "Questions are ready" : "Questions are not available yet",
    },
  ];
  const canStartExamNow =
    isRegistered && !awaitingApproval && program.isLive && hasQuestions && Boolean(session);
  const startDisabledReason = !canStartExamNow
    ? startRequirements.find((item) => !item.met)?.label
    : null;

  async function parseApiError(res: Response) {
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const data = await res.json().catch(() => ({}));
      if (typeof data?.message === "string") return data.message;
    }
    if (res.status === 404) return "Exam service unavailable. Refresh the page and try again.";
    return "Could not start exam";
  }

  function goToAuth(mode: "login" | "signup") {
    const next = encodeURIComponent(examReturnPath);
    router.push(mode === "signup" ? `/signup?next=${next}` : `/login?next=${next}`);
  }

  function handleRegisterClick() {
    if (!isLoggedIn) {
      goToAuth("signup");
      return;
    }
    if (awaitingApproval) {
      toast.info("Your registration is awaiting approval.");
      return;
    }
    if (isRegistered) {
      toast.info("You are already registered for this exam.");
      return;
    }
    setEnrollOpen(true);
  }

  async function startExam() {
    if (!isLoggedIn) {
      goToAuth("login");
      return;
    }

    if (awaitingApproval) {
      toast.info("Payment verification is pending. Please wait for admin approval.");
      return;
    }

    if (!session || !isRegistered) {
      setEnrollOpen(true);
      toast.info("Please complete exam registration first.");
      return;
    }

    if (!program.isLive) {
      toast.info("This exam is not live yet. Please check the schedule.");
      return;
    }

    if (!hasQuestions) {
      toast.info("Questions are not available for this exam yet.");
      return;
    }

    setStarting(true);
    try {
      const res = await fetch("/api/exam-hub/start-attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          programSlug: program.slug,
          enrollmentId: session.enrollmentId,
          phone: normalizeBangladeshPhone(session.phone),
        }),
      });
      if (!res.ok) {
        const message = await parseApiError(res);
        if (message.toLowerCase().includes("enrollment")) {
          clearExamHubSession();
          setSession(null);
          setEnrollmentStatus(null);
          await refreshEnrollmentStatus(session.phone, session.enrollmentId);
          setEnrollOpen(true);
        }
        toast.error(message);
        return;
      }
      const data = await res.json().catch(() => ({}));
      const attemptId = data?.data?.attemptId;
      if (!attemptId) {
        toast.error("Could not start exam");
        return;
      }
      router.push(`/exams/${program.slug}/instructions?attemptId=${attemptId}`);
    } finally {
      setStarting(false);
    }
  }

  function renderRegisterButton() {
    if (statusLoading) {
      return (
        <Button disabled variant="outline" className="h-11 rounded-xl">
          <Loader2 className="size-4 animate-spin" />
          Checking registration...
        </Button>
      );
    }

    if (awaitingApproval) {
      return (
        <Button disabled variant="outline" className="h-11 rounded-xl border-amber-300 bg-amber-50 text-amber-800">
          <Clock3 className="size-4" />
          Awaiting approval
        </Button>
      );
    }

    if (isRegistered) {
      return null;
    }

    return (
      <Button
        variant="outline"
        onClick={handleRegisterClick}
        className="h-11 rounded-xl border-sage-primary/40 bg-white font-bold text-sage-primary hover:bg-sage-red-50"
      >
        {wasRejected
          ? "Register again"
          : program.requiresPayment
            ? `Register / Pay · ৳${program.feeAmount}`
            : "Register / Pay"}
        <ArrowRight className="size-4" />
      </Button>
    );
  }

  return (
    <>
      <section className="relative overflow-hidden border-b border-sage-red-100 bg-gradient-to-br from-sage-red-50 via-white to-sage-cream py-10 sm:py-12 lg:py-14">
        <div className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-sage-red-100/70 blur-3xl" />
        <div className="pointer-events-none absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-sage-gold-soft/80 blur-3xl" />
        <Container className="relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 lg:space-y-8"
          >
            <Link
              href="/exams"
              className="inline-flex items-center gap-2 text-sm font-semibold text-sage-gray-600 transition hover:text-sage-primary"
            >
              <ArrowLeft className="size-4" />
              Back to exams
            </Link>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-start lg:gap-8 xl:gap-10">
              <div className="space-y-5">
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-white text-sage-secondary ring-1 ring-sage-border">
                    {deliveryModeLabels[program.deliveryMode as keyof typeof deliveryModeLabels]}
                  </Badge>
                  {isOnline ? (
                    <Badge variant="secondary">{accessTypeLabels[program.accessType as keyof typeof accessTypeLabels]}</Badge>
                  ) : program.offlineType ? (
                    <Badge variant="secondary">
                      {offlineTypeLabels[program.offlineType as keyof typeof offlineTypeLabels]}
                    </Badge>
                  ) : null}
                  {program.isLive ? <Badge className="bg-sage-success-soft text-emerald-700">Live now</Badge> : null}
                  {awaitingApproval ? (
                    <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Awaiting approval</Badge>
                  ) : null}
                  {isRegistered ? (
                    <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Registered</Badge>
                  ) : null}
                </div>

                <div className="space-y-3">
                  <h1 className="bn-headline text-3xl font-bold text-sage-secondary sm:text-4xl lg:text-[2.35rem] lg:leading-tight">
                    {program.title}
                  </h1>
                  {program.subtitle ? (
                    <p className="bn-headline-subline text-base text-sage-gray-700 sm:text-lg">{program.subtitle}</p>
                  ) : null}
                  {program.description ? (
                    <p className="bn-text line-clamp-3 max-w-2xl text-sm leading-7 text-sage-gray-700 sm:text-base">
                      {program.description}
                    </p>
                  ) : null}
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2">
                  <InfoChip icon={CalendarDays} label="Schedule" value={program.dateLabel} compact />
                  {isOnline ? (
                    <>
                      <InfoChip icon={Clock3} label="Duration" value={`${program.durationMinutes} min`} compact />
                      <InfoChip icon={Shield} label="Marks" value={`${program.totalMarks} total`} compact />
                      <InfoChip icon={FileQuestion} label="Questions" value={`${program.questionCount ?? 0} MCQs`} compact />
                    </>
                  ) : (
                    <>
                      <InfoChip icon={MapPin} label="Venue" value={program.venue || "Will be announced"} compact />
                      <InfoChip icon={CheckCircle2} label="Class" value={program.classLabel} compact />
                    </>
                  )}
                </div>
              </div>

              <ExamParticipationPanel
                program={program}
                isLoggedIn={isLoggedIn}
                isRegistered={isRegistered}
                awaitingApproval={awaitingApproval}
                wasRejected={wasRejected}
                canStartExamNow={canStartExamNow}
                waitingForSchedule={waitingForSchedule}
                startRequirements={startRequirements}
                startDisabledReason={startDisabledReason}
                examOpensAt={examOpensAt}
                statusLoading={statusLoading}
                starting={starting}
                onLogin={() => goToAuth("login")}
                onSignup={() => goToAuth("signup")}
                onStart={startExam}
                registerButton={renderRegisterButton()}
              />
            </div>

            {wasRejected ? (
              <div className="bn-text rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-900">
                <p className="font-semibold">Your previous registration was not approved.</p>
                {enrollmentStatus?.adminNote ? (
                  <p className="mt-2 whitespace-pre-wrap">{enrollmentStatus.adminNote}</p>
                ) : null}
                <p className="mt-2">You may submit a new registration request.</p>
              </div>
            ) : null}

            {isOnline && !hasQuestions ? (
              <p className="bn-text rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-semibold text-amber-800">
                No active questions are linked to this exam yet. Add questions in Admin → Exam Hub → Questions.
              </p>
            ) : null}
          </motion.div>
        </Container>
      </section>

      <section className="py-16 sm:py-20">
        <Container className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-sage-border bg-white p-6 shadow-sm sm:p-8">
            <h2 className="bn-headline text-2xl font-bold text-sage-secondary">Instructions</h2>
            <div className="bn-text mt-4 whitespace-pre-wrap text-sm leading-8 text-sage-gray-700">
              {program.instructions || "Instructions will be shared before the exam starts."}
            </div>
          </div>
          <div className="space-y-4">
            <div className="rounded-3xl border border-sage-border bg-sage-cream/50 p-6">
              <h3 className="font-bold text-sage-secondary">Marking rules</h3>
              <ul className="bn-text mt-3 space-y-2 text-sm text-sage-gray-700">
                <li>Correct: +{program.correctMark}</li>
                <li>Wrong: {program.wrongMark}</li>
                <li>Unanswered: {program.unansweredMark}</li>
              </ul>
              {program.markingRulesNote ? (
                <p className="bn-text mt-4 text-sm text-sage-gray-500">{program.markingRulesNote}</p>
              ) : null}
            </div>
            {!isOnline && program.scheduleNote ? (
              <div className="rounded-3xl border border-sage-border bg-white p-6">
                <h3 className="font-bold text-sage-secondary">Schedule note</h3>
                <p className="bn-text mt-3 text-sm leading-7 text-sage-gray-700">{program.scheduleNote}</p>
              </div>
            ) : null}
          </div>
        </Container>
      </section>

      <ExamEnrollmentDialog
        open={enrollOpen}
        onOpenChange={setEnrollOpen}
        program={program}
        onSuccess={() => {
          const stored = readExamHubSession(program.slug);
          setSession(stored);
          if (stored) refreshEnrollmentStatus(stored.phone, stored.enrollmentId);
        }}
      />
    </>
  );
}

function InfoChip({
  icon: Icon,
  label,
  value,
  compact = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`flex items-start gap-3 rounded-xl bg-white ring-1 ring-sage-border backdrop-blur ${
        compact ? "px-3.5 py-3" : "rounded-2xl px-5 py-4"
      }`}
    >
      <Icon className={`shrink-0 text-sage-primary ${compact ? "mt-0.5 size-4" : "mt-0.5 size-5"}`} />
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-sage-gray-500 sm:text-xs">{label}</p>
        <p className={`bn-text mt-0.5 font-semibold text-sage-secondary ${compact ? "text-xs sm:text-sm" : "text-sm"}`}>
          {value}
        </p>
      </div>
    </div>
  );
}

type StepStatus = "complete" | "current" | "pending" | "upcoming";

type ParticipationStep = {
  id: number;
  title: string;
  description: string;
  status: StepStatus;
};

function ExamParticipationPanel({
  program,
  isLoggedIn,
  isRegistered,
  awaitingApproval,
  wasRejected,
  canStartExamNow,
  waitingForSchedule,
  startRequirements,
  startDisabledReason,
  examOpensAt,
  statusLoading,
  starting,
  onLogin,
  onSignup,
  onStart,
  registerButton,
}: {
  program: PublicExamProgram;
  isLoggedIn: boolean;
  isRegistered: boolean;
  awaitingApproval: boolean;
  wasRejected: boolean;
  canStartExamNow: boolean;
  waitingForSchedule: boolean;
  startRequirements: Array<{ met: boolean; label: string }>;
  startDisabledReason: string | null | undefined;
  examOpensAt: string;
  statusLoading: boolean;
  starting: boolean;
  onLogin: () => void;
  onSignup: () => void;
  onStart: () => void;
  registerButton: React.ReactNode;
}) {
  const needsPayment = program.requiresPayment;

  const steps: ParticipationStep[] = [
    {
      id: 1,
      title: "অ্যাকাউন্টে লগইন করুন",
      description: isLoggedIn
        ? "আপনার SAGE Academy অ্যাকাউন্ট সংযুক্ত আছে।"
        : "পরীক্ষায় অংশ নিতে প্রথমে লগইন করুন। নতুন হলে অ্যাকাউন্ট তৈরি করুন।",
      status: isLoggedIn ? "complete" : "current",
    },
    {
      id: 2,
      title: needsPayment ? "রেজিস্ট্রেশন ও ফি পরিশোধ" : "বিনামূল্যে রেজিস্ট্রেশন",
      description: needsPayment
        ? `রেজিস্ট্রেশন ফর্ম পূরণ করুন এবং ৳${program.feeAmount} ফি জমা দিন। অ্যাডমিন যাচাইয়ের পর অনুমোদন পাবেন।`
        : "একবার রেজিস্ট্রেশন সম্পন্ন করলেই পরীক্ষায় অংশ নেওয়ার জন্য প্রস্তুত থাকবেন।",
      status: !isLoggedIn
        ? "upcoming"
        : awaitingApproval
          ? "pending"
          : isRegistered
            ? "complete"
            : "current",
    },
    {
      id: 3,
      title: "পরীক্ষা শুরু করুন",
      description: canStartExamNow
        ? "সব প্রস্তুতি সম্পন্ন। এখন Start exam চাপুন।"
        : program.isLive
          ? "রেজিস্ট্রেশন সম্পন্ন হলে Start exam বাটন সক্রিয় হবে।"
          : `নির্ধারিত সময় (${examOpensAt}) এ পরীক্ষা Live হলে Start exam চালু হবে।`,
      status: !isRegistered
        ? "upcoming"
        : canStartExamNow
          ? "current"
          : isRegistered
            ? "pending"
            : "upcoming",
    },
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-sage-border/80 bg-gradient-to-br from-white via-white to-sage-red-50/40 shadow-sm lg:rounded-3xl">
      <div className="border-b border-sage-border/70 bg-white/80 px-4 py-4 sm:px-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-sage-primary sm:text-xs">Exam journey</p>
        <h2 className="bn-headline mt-1.5 text-xl font-bold text-sage-secondary sm:text-2xl">
          পরীক্ষায় যোগ দিতে ৩টি ধাপ
        </h2>
        <p className="bn-text mt-1.5 text-xs leading-6 text-sage-gray-600 sm:text-sm sm:leading-7">
          লগইন → রেজিস্ট্রেশন{needsPayment ? " / পেমেন্ট" : ""} → Live হলে শুরু
        </p>
      </div>

      <div className="grid gap-2 px-4 py-4 sm:px-5 md:grid-cols-3 md:gap-3">
        {steps.map((step) => (
          <ParticipationStepCard key={step.id} step={step} compact />
        ))}
      </div>

      <div className="space-y-3 border-t border-sage-border/70 bg-white/70 px-4 py-4 sm:px-5">
        {!isLoggedIn ? (
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Button onClick={onLogin} className="h-11 flex-1 rounded-xl bg-sage-primary px-5 font-bold hover:bg-sage-secondary sm:flex-none">
              <LogIn className="size-4" />
              লগইন করুন
            </Button>
            <Button onClick={onSignup} variant="outline" className="h-11 flex-1 rounded-xl border-sage-primary/30 sm:flex-none">
              <UserPlus className="size-4" />
              নতুন অ্যাকাউন্ট
            </Button>
            <Button asChild variant="outline" className="h-11 rounded-xl">
              <Link href={`/exams/${program.slug}/leaderboard`}>
                <Trophy className="size-4" />
                Leaderboard
              </Link>
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={onStart}
              disabled={starting || !canStartExamNow}
              className="h-11 rounded-xl bg-sage-primary px-5 font-bold hover:bg-sage-secondary disabled:opacity-60"
            >
              {starting ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
              Start exam
            </Button>
            {registerButton}
            <Button asChild variant="outline" className="h-11 rounded-xl">
              <Link href={`/exams/${program.slug}/leaderboard`}>
                <Trophy className="size-4" />
                Leaderboard
              </Link>
            </Button>
          </div>
        )}

        {!isLoggedIn ? (
          <p className="rounded-xl border border-sage-red-100 bg-sage-red-50/60 px-3 py-2.5 text-xs leading-6 text-sage-gray-700 sm:text-sm sm:leading-7">
            <span className="font-semibold text-sage-secondary">Start exam</span> এবং{" "}
            <span className="font-semibold text-sage-secondary">Register / Pay</span> লগইন করার পর সক্রিয় হবে।
            {needsPayment ? " Paid exam — admin payment verification may be required." : " This is a free public exam."}
          </p>
        ) : null}

        {isLoggedIn && !isRegistered && !awaitingApproval && !statusLoading ? (
          <div className="rounded-xl border border-sage-red-100 bg-sage-red-50/50 px-3 py-2.5 text-xs leading-6 text-sage-gray-700 sm:text-sm sm:leading-7">
            <p className="font-semibold text-sage-secondary">পরবর্তী ধাপ: রেজিস্ট্রেশন</p>
            <p className="mt-1">
              {needsPayment
                ? `Register / Pay বাটনে ক্লিক করে ফর্ম পূরণ করুন এবং ৳${program.feeAmount} ফি-এর তথ্য জমা দিন।`
                : "Register / Pay বাটনে ক্লিক করে দ্রুত রেজিস্ট্রেশন সম্পন্ন করুন।"}
              {wasRejected ? " Your previous request was not approved — you may register again." : ""}
            </p>
          </div>
        ) : null}

        {isLoggedIn && (isRegistered || awaitingApproval) ? (
          <div className="space-y-2 rounded-xl border border-sage-border bg-sage-cream/40 p-3 sm:p-4">
            <p className="text-xs font-semibold text-sage-secondary sm:text-sm">Start exam unlock checklist</p>
            <ul className="space-y-2">
              {startRequirements.map((item) => (
                <li key={item.label} className="flex items-start gap-3 text-sm">
                  {item.met ? (
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                  ) : (
                    <XCircle className="mt-0.5 size-4 shrink-0 text-amber-600" />
                  )}
                  <span className={item.met ? "font-medium text-emerald-800" : "font-medium text-amber-900"}>
                    {item.label}
                  </span>
                </li>
              ))}
            </ul>
            {waitingForSchedule ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                <p className="font-semibold">রেজিস্ট্রেশন সম্পন্ন — পরীক্ষার সময় অপেক্ষা করুন।</p>
                <p className="mt-1">
                  পরীক্ষা <strong>{examOpensAt}</strong> এ Live হলে Start exam স্বয়ংক্রিয়ভাবে চালু হবে।
                </p>
              </div>
            ) : null}
            {!canStartExamNow && startDisabledReason && !waitingForSchedule ? (
              <p className="text-sm text-sage-gray-600">Start exam unlocks once every item above is complete.</p>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ParticipationStepCard({ step, compact = false }: { step: ParticipationStep; compact?: boolean }) {
  const statusStyles: Record<StepStatus, string> = {
    complete: "border-emerald-200 bg-emerald-50/70",
    current: "border-sage-primary/30 bg-white shadow-sm ring-1 ring-sage-primary/10",
    pending: "border-amber-200 bg-amber-50/70",
    upcoming: "border-sage-border/70 bg-white/50 opacity-80",
  };

  const badgeStyles: Record<StepStatus, string> = {
    complete: "bg-emerald-600 text-white",
    current: "bg-sage-primary text-white",
    pending: "bg-amber-500 text-white",
    upcoming: "bg-sage-gray-200 text-sage-gray-600",
  };

  const statusLabel: Record<StepStatus, string> = {
    complete: "Done",
    current: "Now",
    pending: "Wait",
    upcoming: "Next",
  };

  if (compact) {
    return (
      <div className={`flex h-full flex-col rounded-xl border p-3 ${statusStyles[step.status]}`}>
        <div className="flex items-center gap-2">
          <div
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black ${badgeStyles[step.status]}`}
          >
            {step.status === "complete" ? <CheckCircle2 className="size-3.5" /> : step.id}
          </div>
          <span className="rounded-full bg-white/80 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-sage-gray-500 ring-1 ring-sage-border">
            {statusLabel[step.status]}
          </span>
        </div>
        <h3 className="mt-2 text-sm font-bold leading-5 text-sage-secondary">{step.title}</h3>
        <p className="bn-text mt-1.5 line-clamp-3 flex-1 text-xs leading-5 text-sage-gray-700">{step.description}</p>
      </div>
    );
  }

  return (
    <div className={`flex gap-4 rounded-2xl border p-4 sm:p-5 ${statusStyles[step.status]}`}>
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-black ${badgeStyles[step.status]}`}
      >
        {step.status === "complete" ? <CheckCircle2 className="size-5" /> : step.id}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-bold text-sage-secondary">{step.title}</h3>
          <span className="rounded-full bg-white/80 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-sage-gray-500 ring-1 ring-sage-border">
            {statusLabel[step.status]}
          </span>
        </div>
        <p className="bn-text mt-2 text-sm leading-7 text-sage-gray-700">{step.description}</p>
      </div>
    </div>
  );
}
