"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { toast } from "react-toastify";

import type { AdminExamProgram } from "@/components/admin/exam-hub/ExamHubManager";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type AttemptRow = {
  _id: string;
  programTitle: string;
  programSlug: string;
  name: string;
  phone: string;
  status: string;
  score: number;
  totalMarks: number;
  durationSeconds: number;
  submittedAt?: string;
  startedAt: string;
};

type AttemptDetail = {
  _id: string;
  programTitle: string;
  name: string;
  phone: string;
  score: number;
  totalMarks: number;
  status: string;
  answers: Array<{
        questionText: string;
        image?: string;
        options: { text: string }[];
    correctIndex: number | null;
    selectedIndex: number | null;
    isCorrect: boolean | null;
    marksAwarded: number;
  }>;
};

export function ExamAttemptPanel({ programs }: { programs: AdminExamProgram[] }) {
  const [programId, setProgramId] = useState("all");
  const [status, setStatus] = useState("submitted");
  const [rows, setRows] = useState<AttemptRow[]>([]);
  const [detail, setDetail] = useState<AttemptDetail | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (programId && programId !== "all") params.set("programId", programId);
    if (status) params.set("status", status);
    const res = await fetch(`/api/admin/exam-hub/attempts?${params.toString()}`);
    const data = await res.json().catch(() => ({}));
    if (res.ok) setRows(data.data || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [programId, status]);

  async function openDetail(id: string) {
    const res = await fetch(`/api/admin/exam-hub/attempts/${id}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error("Could not load attempt");
      return;
    }
    setDetail(data.data);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Select value={programId} onValueChange={setProgramId}>
          <SelectTrigger className="w-64"><SelectValue placeholder="All programs" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All programs</SelectItem>
            {programs.filter((p) => p.deliveryMode === "online").map((p) => (
              <SelectItem key={p._id} value={p._id}>{p.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="in_progress">In progress</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={load}>Refresh</Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-sage-border bg-white">
        {loading ? (
          <p className="p-4 text-sm text-sage-gray-500">Loading...</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Exam</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Score</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row._id}>
                  <TableCell>
                    <p className="font-semibold">{row.name}</p>
                    <p className="text-xs text-sage-gray-500">{row.phone}</p>
                  </TableCell>
                  <TableCell>{row.programTitle}</TableCell>
                  <TableCell><Badge variant="outline">{row.status}</Badge></TableCell>
                  <TableCell>
                    {row.status === "submitted" ? `${row.score}/${row.totalMarks}` : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" onClick={() => openDetail(row._id)}>View</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={Boolean(detail)} onOpenChange={(open) => !open && setDetail(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          {detail ? (
            <>
              <DialogHeader>
                <DialogTitle>{detail.programTitle}</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-sage-gray-600">
                {detail.name} · {detail.phone} · {detail.score}/{detail.totalMarks}
              </p>
              <div className="mt-4 space-y-4">
                {detail.answers.map((answer, idx) => (
                  <div key={idx} className="rounded-xl border border-sage-border p-4">
                    <p className="font-semibold text-sage-secondary">Q{idx + 1}. {answer.questionText}</p>
                    {answer.image ? (
                      <div className="relative mt-3 aspect-[4/3] max-h-56 w-full overflow-hidden rounded-xl bg-sage-cream ring-1 ring-sage-border">
                        <Image src={answer.image} alt="" fill className="object-contain p-2" unoptimized />
                      </div>
                    ) : null}
                    <ul className="mt-2 space-y-1 text-sm">
                      {answer.options.map((opt, optIdx) => (
                        <li
                          key={optIdx}
                          className={
                            optIdx === answer.correctIndex
                              ? "font-semibold text-emerald-700"
                              : optIdx === answer.selectedIndex
                                ? "text-sage-primary"
                                : "text-sage-gray-700"
                          }
                        >
                          {String.fromCharCode(65 + optIdx)}. {opt.text}
                          {optIdx === answer.selectedIndex ? " (selected)" : ""}
                          {optIdx === answer.correctIndex ? " (correct)" : ""}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-2 text-xs text-sage-gray-500">
                      Marks: {answer.marksAwarded} · {answer.isCorrect ? "Correct" : "Incorrect / blank"}
                    </p>
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
