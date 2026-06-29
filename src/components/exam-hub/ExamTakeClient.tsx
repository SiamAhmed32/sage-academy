"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Clock3, Loader2, Send } from "lucide-react";
import { toast } from "react-toastify";

import { Container } from "@/components/shared/Container";
import { Button } from "@/components/ui/button";
import { readExamHubSession, type ExamHubSession } from "@/lib/exam-hub-session";
import { cn } from "@/lib/utils";

type Question = {
  _id: string;
  questionText: string;
  image?: string;
  options: { text: string }[];
  marks: number;
};

type Answer = { questionId: string; selectedIndex: number | null };

type Props = { slug: string; attemptId: string };

const NAVBAR_OFFSET = "5rem";

export function ExamTakeClient({ slug, attemptId }: Props) {
  const router = useRouter();
  const submitLock = useRef(false);
  const [session, setSession] = useState<ExamHubSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    setSession(readExamHubSession(slug));
  }, [slug]);

  const submitExam = useCallback(
    async (auto = false) => {
      if (!session || submitting || submitLock.current) return;
      submitLock.current = true;
      setSubmitting(true);
      try {
        const res = await fetch(`/api/exam-hub/attempts/${attemptId}/submit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: session.phone }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          submitLock.current = false;
          toast.error(typeof data?.message === "string" ? data.message : "Submit failed");
          return;
        }
        if (auto) toast.info("Time is up — exam auto-submitted.");
        router.push(`/exams/${slug}/result/${attemptId}`);
      } finally {
        setSubmitting(false);
      }
    },
    [attemptId, router, session, slug]
  );

  const loadExam = useCallback(async () => {
    if (!session) {
      toast.error("Session expired.");
      router.push(`/exams/${slug}`);
      return;
    }
    try {
      const res = await fetch(
        `/api/exam-hub/attempts/${attemptId}?phone=${encodeURIComponent(session.phone)}`,
        { cache: "no-store" }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(typeof data?.message === "string" ? data.message : "Could not load exam");
        if (typeof data?.message === "string" && data.message.includes("auto-submitted")) {
          router.push(`/exams/${slug}/result/${attemptId}`);
        } else {
          router.push(`/exams/${slug}`);
        }
        return;
      }
      setTitle(data?.data?.title || "");
      setQuestions(data?.data?.questions || []);
      setAnswers(data?.data?.answers || []);
      setExpiresAt(new Date(data?.data?.expiresAt));
    } finally {
      setLoading(false);
    }
  }, [attemptId, router, session, slug]);

  useEffect(() => {
    if (!session) return;
    loadExam();
  }, [loadExam, session]);

  useEffect(() => {
    if (!expiresAt) return;
    const tick = () => {
      const ms = expiresAt.getTime() - Date.now();
      setRemaining(Math.max(0, Math.floor(ms / 1000)));
      if (ms <= 0) submitExam(true);
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [expiresAt, submitExam]);

  const current = questions[currentIdx];
  const currentAnswer = answers.find((a) => a.questionId === current?._id)?.selectedIndex ?? null;
  const answeredCount = answers.filter((a) => a.selectedIndex !== null).length;
  const isLastQuestion = !loading && currentIdx >= questions.length - 1;

  async function saveAnswer(questionId: string, selectedIndex: number) {
    if (!session) return;
    setAnswers((prev) =>
      prev.map((a) => (a.questionId === questionId ? { ...a, selectedIndex } : a))
    );
    await fetch(`/api/exam-hub/attempts/${attemptId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: session.phone, questionId, selectedIndex }),
    });
  }

  const timerLabel = useMemo(() => {
    const m = Math.floor(remaining / 60);
    const s = remaining % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }, [remaining]);

  return (
    <div
      className="exam-focus-route flex flex-col bg-sage-admin-bg"
      style={{ minHeight: `calc(100dvh - ${NAVBAR_OFFSET})` }}
    >
      <header className="sticky top-20 z-40 shrink-0 border-b border-sage-border bg-white/95 backdrop-blur">
        <Container className="flex items-center justify-between gap-4 py-4">
          <div className="relative min-h-14 min-w-0 flex-1 pr-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-sage-gray-500">Online exam</p>
            {loading ? (
              <div className="mt-1 h-7 w-48 max-w-full animate-pulse rounded-lg bg-sage-red-50" />
            ) : (
              <h1 className="bn-headline mt-1 line-clamp-2 text-lg font-bold text-sage-secondary">{title}</h1>
            )}
          </div>
          <div
            className={cn(
              "flex h-11 w-[7.5rem] shrink-0 items-center justify-center gap-2 rounded-2xl bg-sage-red-50 px-3 font-mono text-lg font-bold tabular-nums",
              !loading && remaining <= 60 && "text-red-700"
            )}
          >
            <Clock3 className="size-4 shrink-0" />
            <span className="inline-block min-w-[3.25rem] text-center">{loading ? "--:--" : timerLabel}</span>
          </div>
        </Container>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain">
        <Container className="flex flex-1 flex-col py-6 pb-4">
          <div className="mb-6 flex min-h-10 flex-wrap items-center justify-between gap-3">
            {loading ? (
              <div className="h-5 w-56 animate-pulse rounded bg-sage-red-50" />
            ) : (
              <p className="min-w-[12rem] text-sm font-semibold text-sage-gray-700">
                Question {currentIdx + 1} of {questions.length} · Answered {answeredCount}/{questions.length}
              </p>
            )}
            <div className="flex min-h-9 flex-wrap gap-2">
              {(loading ? Array.from({ length: 4 }) : questions).map((item, idx) => {
                if (loading) {
                  return <div key={idx} className="size-9 animate-pulse rounded-xl bg-sage-red-50" />;
                }
                const q = item as Question;
                const answered = answers.find((a) => a.questionId === q._id)?.selectedIndex !== null;
                return (
                  <button
                    key={q._id}
                    type="button"
                    onClick={() => setCurrentIdx(idx)}
                    className={cn(
                      "size-9 rounded-xl text-sm font-bold transition-colors",
                      idx === currentIdx
                        ? "bg-sage-primary text-white"
                        : answered
                          ? "bg-sage-success-soft text-emerald-700"
                          : "bg-white text-sage-gray-700 ring-1 ring-sage-border"
                    )}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="min-h-[22rem] flex-1">
            <div
              className={cn(
                "rounded-3xl border border-sage-border bg-white p-6 shadow-sm sm:p-8",
                loading && "animate-pulse"
              )}
            >
              {loading ? (
                <>
                  <div className="h-4 w-32 rounded bg-sage-red-50" />
                  <div className="mt-4 h-8 w-full max-w-2xl rounded-lg bg-sage-red-50" />
                  <div className="mt-6 space-y-3">
                    {Array.from({ length: 4 }).map((_, idx) => (
                      <div key={idx} className="h-14 rounded-2xl bg-sage-cream" />
                    ))}
                  </div>
                </>
              ) : current ? (
                <>
                  <p className="text-sm font-semibold text-sage-primary">
                    Q{currentIdx + 1} · {current.marks} mark(s)
                  </p>
                  <h2 className="bn-headline mt-4 text-xl font-bold text-sage-secondary">{current.questionText}</h2>
                  {current.image ? (
                    <div className="relative mt-5 aspect-[4/3] max-h-96 w-full overflow-hidden rounded-2xl bg-sage-cream ring-1 ring-sage-border">
                      <Image
                        src={current.image}
                        alt="Question figure"
                        fill
                        className="object-contain p-2"
                        sizes="(max-width: 768px) 100vw, 720px"
                        unoptimized
                      />
                    </div>
                  ) : null}
                  <div className="mt-6 grid gap-3">
                    {current.options.map((opt, idx) => {
                      const selected = currentAnswer === idx;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => saveAnswer(current._id, idx)}
                          className={cn(
                            "rounded-2xl border px-4 py-4 text-left text-sm transition-colors",
                            selected
                              ? "border-sage-primary bg-sage-red-50 text-sage-secondary"
                              : "border-sage-border bg-white hover:border-sage-primary/40 hover:bg-sage-cream/40"
                          )}
                        >
                          <span className="mr-3 inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-white font-bold ring-1 ring-sage-border">
                            {String.fromCharCode(65 + idx)}
                          </span>
                          {opt.text}
                        </button>
                      );
                    })}
                  </div>
                </>
              ) : null}
            </div>
          </div>

          <div className="mt-6 grid min-h-11 grid-cols-2 gap-3 sm:grid-cols-[auto_1fr_auto] sm:items-center">
            <Button
              variant="outline"
              disabled={loading || currentIdx === 0}
              onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
              className="rounded-xl sm:justify-self-start"
            >
              <ChevronLeft className="size-4" />
              Previous
            </Button>
            <div className="hidden sm:block" aria-hidden />
            {!loading && !isLastQuestion ? (
              <Button
                onClick={() => setCurrentIdx((i) => i + 1)}
                className="rounded-xl bg-sage-primary hover:bg-sage-secondary sm:col-start-3"
              >
                Next
                <ChevronRight className="size-4" />
              </Button>
            ) : (
              <Button
                onClick={() => submitExam(false)}
                disabled={loading || submitting}
                className="rounded-xl bg-sage-primary hover:bg-sage-secondary sm:col-start-3"
              >
                {submitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                Submit exam
              </Button>
            )}
          </div>
        </Container>
      </div>

      <footer className="shrink-0 border-t border-sage-border bg-white/95 backdrop-blur">
        <Container className="flex justify-end py-4">
          <Button
            onClick={() => submitExam(false)}
            disabled={loading || submitting}
            className="h-12 min-w-[9.5rem] rounded-xl bg-sage-secondary px-6 font-bold"
          >
            {submitting ? <Loader2 className="size-4 animate-spin" /> : "Submit now"}
          </Button>
        </Container>
      </footer>
    </div>
  );
}
