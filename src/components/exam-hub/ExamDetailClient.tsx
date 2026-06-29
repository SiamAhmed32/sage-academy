"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileQuestion,
  Loader2,
  MapPin,
  Play,
  Shield,
  Trophy,
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
        <Button disabled variant="outline" className="h-12 rounded-xl">
          <Loader2 className="size-4 animate-spin" />
          Checking registration...
        </Button>
      );
    }

    if (awaitingApproval) {
      return (
        <Button disabled variant="outline" className="h-12 rounded-xl border-amber-300 bg-amber-50 text-amber-800">
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
        variant={isOnline ? "outline" : "default"}
        onClick={handleRegisterClick}
        className={`h-12 rounded-xl ${!isOnline ? "bg-sage-primary font-bold hover:bg-sage-secondary" : ""}`}
      >
        {wasRejected ? "Register again" : isOnline ? "Register / Pay" : "Register for offline exam"}
        <ArrowRight className="size-4" />
      </Button>
    );
  }

  return (
    <>
      <section className="relative overflow-hidden border-b border-sage-red-100 bg-gradient-to-br from-sage-red-50 via-white to-sage-cream py-20 sm:py-24">
        <div className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-sage-red-100/70 blur-3xl" />
        <div className="pointer-events-none absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-sage-gold-soft/80 blur-3xl" />
        <Container className="relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl space-y-8"
          >
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

              <div className="space-y-4">
                <h1 className="bn-headline text-4xl font-bold text-sage-secondary sm:text-5xl">{program.title}</h1>
                {program.subtitle ? (
                  <p className="bn-headline-subline text-lg text-sage-gray-700">{program.subtitle}</p>
                ) : null}
                <p className="bn-text max-w-3xl text-base leading-8 text-sage-gray-700">{program.description}</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <InfoChip icon={CalendarDays} label="Schedule" value={program.dateLabel} />
              {isOnline ? (
                <>
                  <InfoChip icon={Clock3} label="Duration" value={`${program.durationMinutes} minutes`} />
                  <InfoChip icon={Shield} label="Marks" value={`${program.totalMarks} total`} />
                  <InfoChip icon={FileQuestion} label="Questions" value={`${program.questionCount ?? 0} MCQs`} />
                </>
              ) : (
                <>
                  <InfoChip icon={MapPin} label="Venue" value={program.venue || "Will be announced"} />
                  <InfoChip icon={CheckCircle2} label="Class" value={program.classLabel} />
                </>
              )}
            </div>

            <div className="space-y-5 rounded-3xl border border-sage-border/80 bg-white/70 p-5 sm:p-6">
              <div className="flex flex-wrap gap-3">
                {isOnline ? (
                  <>
                    <Button
                      onClick={startExam}
                      disabled={starting || !canStartExamNow}
                      className="h-12 rounded-xl bg-sage-primary px-6 font-bold hover:bg-sage-secondary disabled:opacity-60"
                    >
                      {starting ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
                      Start exam
                    </Button>
                    <Button asChild variant="outline" className="h-12 rounded-xl">
                      <Link href={`/exams/${program.slug}/leaderboard`}>
                        <Trophy className="size-4" />
                        Leaderboard
                      </Link>
                    </Button>
                  </>
                ) : null}
                {renderRegisterButton()}
              </div>

              {isOnline && (isRegistered || awaitingApproval) ? (
                <div className="space-y-3 rounded-2xl border border-sage-border bg-sage-cream/40 p-4 sm:p-5">
                  <p className="text-sm font-semibold text-sage-secondary">Before you can start</p>
                  <ul className="space-y-3">
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
                      <p className="font-semibold">Registration and questions are ready.</p>
                      <p className="mt-1">
                        The exam will open on <strong>{examOpensAt}</strong>. Start exam unlocks automatically at that time.
                      </p>
                      <p className="mt-2 text-amber-800">
                        To test earlier, edit this program in Admin → Exam Hub → Programs and set the start date to now.
                      </p>
                    </div>
                  ) : null}
                  {!canStartExamNow && startDisabledReason && !waitingForSchedule ? (
                    <p className="text-sm text-sage-gray-600">
                      Start exam will unlock once all items above are complete.
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>

            {awaitingApproval ? (
              <div className="bn-text rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
                <p className="font-semibold">
                  Registration submitted for {enrollmentStatus?.name || session?.name || "your account"}.
                </p>
                <p className="mt-2">
                  Your payment is awaiting admin verification. You cannot submit another request for this exam.
                </p>
              </div>
            ) : null}

            {isRegistered ? (
              <div className="bn-text rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-900">
                <p className="font-semibold">
                  Registration confirmed for {enrollmentStatus?.name || session?.name || "your account"}.
                </p>
                <p className="mt-2">
                  {canStartExamNow
                    ? "Everything is ready. Click Start exam when you are prepared."
                    : waitingForSchedule
                      ? `Everything else is ready. The exam opens on ${examOpensAt}.`
                      : "You are registered. The Start exam button will activate once the exam is live and questions are available."}
                </p>
              </div>
            ) : null}

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
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-white px-5 py-4 ring-1 ring-sage-border backdrop-blur">
      <Icon className="mt-0.5 size-5 text-sage-primary" />
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-sage-gray-500">{label}</p>
        <p className="bn-text mt-1 text-sm font-semibold text-sage-secondary">{value}</p>
      </div>
    </div>
  );
}
