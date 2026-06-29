"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Crown, Loader2 } from "lucide-react";
import { toast } from "react-toastify";

import { Container } from "@/components/shared/Container";
import { Button } from "@/components/ui/button";

type Row = {
  rank: number;
  name: string;
  score: number;
  totalMarks: number;
  durationSeconds: number;
};

export function ExamLeaderboardClient({ slug, title }: { slug: string; title: string }) {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/exam-hub/programs/${slug}/leaderboard`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(typeof data?.message === "string" ? data.message : "Could not load leaderboard");
        return;
      }
      setRows(data?.data?.items || []);
      setLoading(false);
    }
    load();
  }, [slug]);

  return (
    <section className="py-16">
      <Container className="max-w-3xl">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sage-primary">Leaderboard</p>
          <h1 className="bn-headline mt-2 text-3xl font-bold text-sage-secondary">{title}</h1>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="size-8 animate-spin text-sage-primary" />
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-sage-border bg-white px-6 py-16 text-center text-sage-gray-500">
            No submissions yet.
          </div>
        ) : (
          <div className="space-y-3">
            {rows.map((row, index) => (
              <motion.div
                key={`${row.rank}-${row.name}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className={`flex items-center justify-between rounded-2xl border px-4 py-4 ${
                  row.rank <= 3 ? "border-sage-gold/40 bg-sage-gold-soft/40" : "border-sage-border bg-white"
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className="flex size-10 items-center justify-center rounded-full bg-white font-black text-sage-secondary ring-1 ring-sage-border">
                    {row.rank <= 3 ? <Crown className="size-4 text-amber-600" /> : row.rank}
                  </span>
                  <div>
                    <p className="font-bold text-sage-secondary">{row.name}</p>
                    <p className="text-xs text-sage-gray-500">
                      {Math.floor(row.durationSeconds / 60)}m {row.durationSeconds % 60}s
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-black text-sage-primary">
                    {row.score}/{row.totalMarks}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        <div className="mt-8 text-center">
          <Button asChild variant="outline" className="rounded-xl">
            <Link href={`/exams/${slug}`}>Back to exam</Link>
          </Button>
        </div>
      </Container>
    </section>
  );
}
