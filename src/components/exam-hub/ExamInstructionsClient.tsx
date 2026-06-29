"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { AlertTriangle, Clock3, Loader2 } from "lucide-react";
import { toast } from "react-toastify";

import { Container } from "@/components/shared/Container";
import { Button } from "@/components/ui/button";
import { readExamHubSession } from "@/lib/exam-hub-session";

type Props = {
  slug: string;
  attemptId: string;
  title: string;
  instructions: string;
  durationMinutes: number;
};

export function ExamInstructionsClient({ slug, attemptId, title, instructions, durationMinutes }: Props) {
  const router = useRouter();
  const session = readExamHubSession(slug);
  const [ack, setAck] = useState(false);

  useEffect(() => {
    if (!session) toast.error("Session expired. Please register again.");
  }, [session]);

  return (
    <section className="min-h-[70vh] bg-gradient-to-b from-sage-red-50 to-white py-16">
      <Container className="max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-sage-border bg-white p-6 shadow-xl sm:p-8"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sage-primary">Before you begin</p>
          <h1 className="bn-headline mt-3 text-3xl font-bold text-sage-secondary">{title}</h1>
          <div className="mt-6 flex items-center gap-2 rounded-2xl bg-sage-cream/70 px-4 py-3 text-sm font-semibold text-sage-secondary">
            <Clock3 className="size-4 text-sage-primary" />
            You have {durationMinutes} minutes once the exam starts. Timer cannot be paused.
          </div>
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <p>Do not refresh or leave the page during the exam. Your answers auto-save, but the timer keeps running.</p>
            </div>
          </div>
          <div className="bn-text mt-6 whitespace-pre-wrap text-sm leading-8 text-sage-gray-700">
            {instructions || "Read all questions carefully. Select one option per question."}
          </div>
          <label className="mt-8 flex items-start gap-3 rounded-2xl border border-sage-border px-4 py-3">
            <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} className="mt-1" />
            <span className="bn-text text-sm text-sage-gray-700">I have read the instructions and I am ready to begin.</span>
          </label>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              disabled={!ack || !session}
              onClick={() => router.push(`/exams/${slug}/take/${attemptId}`)}
              className="h-12 rounded-xl bg-sage-primary px-6 font-bold hover:bg-sage-secondary"
            >
              Begin exam
            </Button>
            <Button asChild variant="outline" className="h-12 rounded-xl">
              <Link href={`/exams/${slug}`}>Back</Link>
            </Button>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
