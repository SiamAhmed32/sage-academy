"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  CheckCircle2,
  Clock3,
  PauseCircle,
  Target,
  Trophy,
  XCircle,
} from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { Container } from "@/components/shared/Container";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ExamAnswerReview } from "@/lib/exam-hub-result";
import { readExamHubSession, type ExamHubSession } from "@/lib/exam-hub-session";
import { cn } from "@/lib/utils";

type ResultData = {
  title: string;
  score: number;
  totalMarks: number;
  durationSeconds: number;
  showLeaderboard: boolean;
  stats: { correct: number; wrong: number; skipped: number; marks: number };
  questions: ExamAnswerReview[];
};

type Props = { slug: string; attemptId: string; userPhone?: string };

const PIE_COLORS = {
  correct: "#22c55e",
  wrong: "#ef4444",
  skipped: "#9ca3af",
};

export function ExamResultClient({ slug, attemptId, userPhone = "" }: Props) {
  const [session, setSession] = useState<ExamHubSession | null>(() => readExamHubSession(slug));
  const [sessionReady, setSessionReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("quick");
  const [result, setResult] = useState<ResultData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    setSession(readExamHubSession(slug));
    setSessionReady(true);
  }, [slug]);

  const verifyPhone = session?.phone || userPhone;

  useEffect(() => {
    if (!sessionReady) return;

    if (!verifyPhone) {
      setLoading(false);
      setLoadError("We could not verify your exam session. Open the exam page and register again.");
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setLoadError(null);
      const params = new URLSearchParams({ phone: verifyPhone });
      const res = await fetch(`/api/exam-hub/attempts/${attemptId}/result?${params.toString()}`);
      const data = await res.json().catch(() => ({}));
      if (cancelled) return;

      if (!res.ok) {
        setLoadError(typeof data?.message === "string" ? data.message : "Could not load result");
        setLoading(false);
        return;
      }

      setResult(data.data);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [attemptId, sessionReady, verifyPhone]);

  const pieData = useMemo(() => {
    if (!result) return [];
    return [
      { name: "Correct", value: result.stats.correct, color: PIE_COLORS.correct },
      { name: "Wrong", value: result.stats.wrong, color: PIE_COLORS.wrong },
      { name: "Skipped", value: result.stats.skipped, color: PIE_COLORS.skipped },
    ].filter((item) => item.value > 0);
  }, [result]);

  const pct = result?.totalMarks ? Math.round((result.score / result.totalMarks) * 100) : 0;

  if (loading) {
    return (
      <section className="min-h-[70vh] bg-sage-admin-bg py-10">
        <Container className="max-w-6xl space-y-6">
          <div className="h-10 w-72 animate-pulse rounded-lg bg-white" />
          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="h-72 animate-pulse rounded-3xl bg-white" />
            <div className="h-72 animate-pulse rounded-3xl bg-white" />
          </div>
          <div className="h-96 animate-pulse rounded-3xl bg-white" />
        </Container>
      </section>
    );
  }

  if (!result) {
    return (
      <section className="min-h-[70vh] bg-sage-admin-bg py-10">
        <Container className="max-w-3xl">
          <div className="rounded-3xl border border-sage-border bg-white p-8 text-center shadow-sm">
            <p className="text-lg font-semibold text-sage-secondary">Could not load exam result</p>
            <p className="mt-3 text-sm text-sage-gray-600">
              {loadError || "Please try again from the exam page."}
            </p>
            <Button asChild className="mt-6 rounded-xl bg-sage-primary hover:bg-sage-secondary">
              <Link href={`/exams/${slug}`}>Back to exam</Link>
            </Button>
          </div>
        </Container>
      </section>
    );
  }

  return (
    <section className="min-h-[70vh] bg-sage-admin-bg py-10 sm:py-12">
      <Container className="max-w-6xl space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-sage-primary">Exam submitted</p>
          <h1 className="bn-headline mt-2 text-3xl font-bold text-sage-secondary sm:text-4xl">
            Report: {result.title}
          </h1>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-3xl border border-sage-border bg-white p-6 shadow-sm sm:p-8">
            <div className="grid gap-4 sm:grid-cols-2">
              <StatCard
                label="Correct"
                value={result.stats.correct}
                icon={CheckCircle2}
                className="border-emerald-100 bg-emerald-50 text-emerald-700"
              />
              <StatCard
                label="Wrong"
                value={result.stats.wrong}
                icon={XCircle}
                className="border-red-100 bg-red-50 text-red-700"
              />
              <StatCard
                label="Skipped"
                value={result.stats.skipped}
                icon={PauseCircle}
                className="border-sage-border bg-sage-cream text-sage-gray-700"
              />
              <StatCard
                label="Marks"
                value={result.stats.marks}
                icon={Target}
                className="border-blue-100 bg-blue-50 text-blue-700"
              />
            </div>

            <div className="mt-4 flex items-center gap-3 rounded-2xl border border-violet-100 bg-violet-50 px-4 py-3 text-violet-800">
              <Clock3 className="size-5 shrink-0" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide opacity-80">Time taken</p>
                <p className="text-lg font-bold tabular-nums">
                  {Math.floor(result.durationSeconds / 60)} m {result.durationSeconds % 60} s
                </p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-xs font-semibold uppercase tracking-wide text-sage-gray-500">Score</p>
                <p className="text-lg font-bold text-sage-secondary">{pct}%</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-sage-border bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-lg font-bold text-sage-secondary">Submission distribution</h2>
            <div className="mt-4 grid gap-6 sm:grid-cols-[1fr_auto] sm:items-center">
              <div className="h-52 w-full">
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={52}
                        outerRadius={78}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {pieData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#FFFFFF",
                          border: "1px solid #E5E7EB",
                          borderRadius: "12px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-sage-gray-500">
                    No answers recorded
                  </div>
                )}
              </div>
              <ul className="space-y-3">
                {[
                  { label: "Correct", color: PIE_COLORS.correct, value: result.stats.correct },
                  { label: "Wrong", color: PIE_COLORS.wrong, value: result.stats.wrong },
                  { label: "Skipped", color: PIE_COLORS.skipped, value: result.stats.skipped },
                ].map((item) => (
                  <li key={item.label} className="flex items-center gap-3 text-sm font-semibold text-sage-gray-700">
                    <span className="size-3 rounded-sm" style={{ backgroundColor: item.color }} />
                    {item.label}
                    <span className="ml-auto tabular-nums">{item.value}</span>
                  </li>
                ))}
              </ul>
            </div>
            <p className="mt-4 text-center text-sm text-sage-gray-500">
              Total score:{" "}
              <span className="font-bold text-sage-secondary">
                {result.score} / {result.totalMarks}
              </span>
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-sage-border bg-white p-6 shadow-sm sm:p-8">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="quick">Quick View</TabsTrigger>
              <TabsTrigger value="solve">Solve View</TabsTrigger>
            </TabsList>

            <TabsContent value="quick" className="mt-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {result.questions.map((question) => (
                  <QuickViewCard key={question.questionId} question={question} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="solve" className="mt-6">
              <div className="space-y-4">
                {result.questions.map((question) => (
                  <SolveViewCard key={question.questionId} question={question} />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="flex flex-wrap justify-center gap-3 pb-8">
          {result.showLeaderboard ? (
            <Button asChild className="rounded-xl bg-sage-primary hover:bg-sage-secondary">
              <Link href={`/exams/${slug}/leaderboard`}>
                <Trophy className="size-4" />
                View leaderboard
              </Link>
            </Button>
          ) : null}
          <Button asChild variant="outline" className="rounded-xl">
            <Link href={`/exams/${slug}`}>Back to exam</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-xl">
            <Link href="/exams">All exams</Link>
          </Button>
        </div>
      </Container>
    </section>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  className,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  className: string;
}) {
  return (
    <div className={cn("rounded-2xl border px-4 py-4", className)}>
      <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide opacity-80">
        <Icon className="size-4" />
        {label}
      </div>
      <p className="mt-2 text-3xl font-black tabular-nums">{value}</p>
    </div>
  );
}

function QuickViewCard({ question }: { question: ExamAnswerReview }) {
  return (
    <div className="rounded-2xl border border-sage-border bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-sage-gray-500">Q No.</p>
          <p className="text-2xl font-black text-sage-secondary">{question.questionNumber}</p>
        </div>
        <StatusBadge status={question.status} compact />
      </div>
      <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.14em] text-sage-gray-500">Answer</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {question.options.map((_, idx) => {
          const letter = String.fromCharCode(97 + idx);
          const isCorrect = idx === question.correctIndex;
          const isSelected = idx === question.selectedIndex;
          return (
            <span
              key={idx}
              className={cn(
                "inline-flex size-9 items-center justify-center rounded-full border-2 text-sm font-bold",
                isCorrect && "border-emerald-500 bg-emerald-50 text-emerald-700",
                !isCorrect && isSelected && question.status === "wrong" && "border-red-500 bg-red-50 text-red-700",
                !isCorrect && !isSelected && "border-sage-border bg-white text-sage-gray-600"
              )}
            >
              {letter}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function SolveViewCard({ question }: { question: ExamAnswerReview }) {
  return (
    <div className="rounded-2xl border border-sage-border bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center gap-3">
        <StatusBadge status={question.status} />
        <span className="text-sm font-bold text-sage-gray-500">Question {question.questionNumber}</span>
      </div>
      <p className="bn-text mt-4 text-base font-semibold leading-8 text-sage-secondary">{question.questionText}</p>
      {question.image ? (
        <div className="relative mt-4 aspect-[4/3] max-h-72 w-full overflow-hidden rounded-2xl bg-sage-cream ring-1 ring-sage-border">
          <Image
            src={question.image}
            alt="Question figure"
            fill
            className="object-contain p-2"
            sizes="(max-width: 768px) 100vw, 720px"
            unoptimized
          />
        </div>
      ) : null}
      <div className="mt-5 grid gap-3">
        {question.options.map((opt, idx) => {
          const letter = String.fromCharCode(97 + idx);
          const isCorrect = idx === question.correctIndex;
          const isSelected = idx === question.selectedIndex;
          return (
            <div
              key={idx}
              className={cn(
                "rounded-xl border px-4 py-3 text-sm",
                isCorrect && "border-emerald-500 bg-emerald-50 text-emerald-900",
                !isCorrect && isSelected && "border-red-500 bg-red-50 text-red-900",
                !isCorrect && !isSelected && "border-sage-border bg-white text-sage-gray-700"
              )}
            >
              <span className="mr-3 inline-flex size-7 items-center justify-center rounded-full bg-white text-xs font-bold ring-1 ring-sage-border">
                {letter}
              </span>
              {opt.text}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatusBadge({
  status,
  compact = false,
}: {
  status: ExamAnswerReview["status"];
  compact?: boolean;
}) {
  const config = {
    correct: { label: "Correct", className: "bg-emerald-50 text-emerald-700 ring-emerald-100", icon: CheckCircle2 },
    wrong: { label: "Wrong", className: "bg-red-50 text-red-700 ring-red-100", icon: XCircle },
    skipped: { label: "Skipped", className: "bg-sage-cream text-sage-gray-700 ring-sage-border", icon: PauseCircle },
  }[status];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-semibold ring-1",
        compact ? "px-2 py-1 text-[10px]" : "px-3 py-1 text-xs",
        config.className
      )}
    >
      <Icon className={compact ? "size-3" : "size-3.5"} />
      {config.label}
    </span>
  );
}
