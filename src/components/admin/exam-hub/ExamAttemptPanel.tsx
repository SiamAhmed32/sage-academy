"use client";

import { useCallback, useDeferredValue, useEffect, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Loader2, Search } from "lucide-react";
import { toast } from "react-toastify";

import type { ExamProgramOption } from "@/components/admin/exam-hub/ExamHubManager";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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
import { formatAdminNumber } from "@/lib/admin-format";

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

const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;

type PageData = {
  items: AttemptRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

const attemptStatusLabels: Record<string, string> = {
  submitted: "Submitted",
  in_progress: "In progress",
  expired: "Expired",
};

export function ExamAttemptPanel({ programs }: { programs: ExamProgramOption[] }) {
  const [programId, setProgramId] = useState("all");
  const [status, setStatus] = useState("submitted");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("submittedAt:desc");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState<number>(PAGE_SIZE_OPTIONS[0]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [rows, setRows] = useState<AttemptRow[]>([]);
  const [detail, setDetail] = useState<AttemptDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const deferredQuery = useDeferredValue(query.trim());

  const load = useCallback(async (signal?: AbortSignal) => {
    const params = new URLSearchParams({
      sort,
      page: String(page),
      limit: String(limit),
    });
    if (deferredQuery) params.set("q", deferredQuery);
    if (programId !== "all") params.set("programId", programId);
    if (status !== "all") params.set("status", status);

    try {
      const res = await fetch(`/api/admin/exam-hub/attempts?${params.toString()}`, { signal });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (!signal?.aborted) {
          toast.error(typeof data?.message === "string" ? data.message : "Could not load exam attempts");
        }
        return;
      }
      const result = (data.data || {}) as PageData;
      if (page > Math.max(1, result.totalPages || 0)) {
        setPage(Math.max(1, result.totalPages || 0));
        return;
      }
      setRows(result.items || []);
      setTotal(result.total || 0);
      setTotalPages(result.totalPages || 0);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [deferredQuery, limit, page, programId, sort, status]);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  async function openDetail(id: string) {
    const res = await fetch(`/api/admin/exam-hub/attempts/${id}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(typeof data?.message === "string" ? data.message : "Could not load the exam attempt");
      return;
    }
    setDetail(data.data);
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 rounded-xl border border-sage-border bg-white p-4 md:grid-cols-2 xl:grid-cols-6">
        <div className="relative md:col-span-2">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-sage-gray-400" />
          <Input
            value={query}
            onChange={(event) => {
              setLoading(true);
              setPage(1);
              setQuery(event.target.value);
            }}
            placeholder="Search student, phone, or IP address..."
            className="pl-9"
          />
        </div>
        <Select
          value={programId}
          onValueChange={(value) => {
            setLoading(true);
            setPage(1);
            setProgramId(value);
          }}
        >
          <SelectTrigger><SelectValue placeholder="All programs" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All programs</SelectItem>
            {programs.filter((p) => p.deliveryMode === "online").map((p) => (
              <SelectItem key={p._id} value={p._id}>{p.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={status}
          onValueChange={(value) => {
            setLoading(true);
            setPage(1);
            setStatus(value);
          }}
        >
          <SelectTrigger><SelectValue placeholder="Attempt status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All attempt statuses</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="in_progress">In progress</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={sort}
          onValueChange={(value) => {
            setLoading(true);
            setPage(1);
            setSort(value);
          }}
        >
          <SelectTrigger><SelectValue placeholder="Sort" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="submittedAt:desc">Latest submissions</SelectItem>
            <SelectItem value="submittedAt:asc">Earliest submissions</SelectItem>
            <SelectItem value="score:desc">Highest scores</SelectItem>
            <SelectItem value="score:asc">Lowest scores</SelectItem>
            <SelectItem value="name:asc">Student name A–Z</SelectItem>
            <SelectItem value="name:desc">Student name Z–A</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          onClick={() => {
            setLoading(true);
            void load();
          }}
          disabled={loading}
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : null}
          Refresh
        </Button>
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
              {!loading && rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-28 text-center text-sage-gray-500">
                    No attempts match the selected filters.
                  </TableCell>
                </TableRow>
              ) : null}
              {rows.map((row) => (
                <TableRow key={row._id}>
                  <TableCell>
                    <p className="font-semibold">{row.name}</p>
                    <p className="text-xs text-sage-gray-500">{row.phone}</p>
                  </TableCell>
                  <TableCell>{row.programTitle}</TableCell>
                  <TableCell><Badge variant="outline">{attemptStatusLabels[row.status] || row.status}</Badge></TableCell>
                  <TableCell>
                    {row.status === "submitted"
                      ? `${formatAdminNumber(row.score)}/${formatAdminNumber(row.totalMarks)}`
                      : "—"}
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

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-sage-gray-600">
          Showing {total === 0 ? 0 : (page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
        </p>
        <div className="flex items-center gap-2">
          <Select
            value={String(limit)}
            onValueChange={(value) => {
              setLoading(true);
              setPage(1);
              setLimit(Number(value));
            }}
          >
            <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((size) => (
                <SelectItem key={size} value={String(size)}>{size} rows</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon-sm"
            disabled={page <= 1 || loading}
            onClick={() => {
              setLoading(true);
              setPage((value) => value - 1);
            }}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="min-w-20 text-center text-sm font-semibold">{page} / {Math.max(1, totalPages)}</span>
          <Button
            variant="outline"
            size="icon-sm"
            disabled={page >= totalPages || loading}
            onClick={() => {
              setLoading(true);
              setPage((value) => value + 1);
            }}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
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
                    <p className="font-semibold text-sage-secondary">
                      Question {idx + 1}. {answer.questionText}
                    </p>
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
