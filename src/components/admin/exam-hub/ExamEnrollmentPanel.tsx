"use client";

import { useCallback, useDeferredValue, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Eye, Loader2, Search } from "lucide-react";
import { toast } from "react-toastify";

import type { ExamProgramOption } from "@/components/admin/exam-hub/ExamHubManager";
import {
  ExamEnrollmentReviewModal,
  type EnrollmentDetail,
} from "@/components/admin/exam-hub/ExamEnrollmentReviewModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

type Enrollment = EnrollmentDetail;

const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;

type PageData = {
  items: Enrollment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

const paymentStatusLabels: Record<string, string> = {
  not_required: "No payment required",
  pending: "Payment pending",
  submitted: "Payment submitted",
  verified: "Verified",
  rejected: "Rejected",
};

export function ExamEnrollmentPanel({ programs }: { programs: ExamProgramOption[] }) {
  const [rows, setRows] = useState<Enrollment[]>([]);
  const [query, setQuery] = useState("");
  const [programId, setProgramId] = useState("all");
  const [status, setStatus] = useState("all");
  const [paymentStatus, setPaymentStatus] = useState("submitted");
  const [sort, setSort] = useState("createdAt:desc");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState<number>(PAGE_SIZE_OPTIONS[0]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<"view" | "review">("view");
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
    if (paymentStatus !== "all") params.set("paymentStatus", paymentStatus);

    try {
      const res = await fetch(`/api/admin/exam-hub/enrollments?${params.toString()}`, { signal });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (!signal?.aborted) {
          toast.error(typeof data?.message === "string" ? data.message : "Could not load exam enrollments");
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
  }, [deferredQuery, limit, page, paymentStatus, programId, sort, status]);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  function openModal(id: string, mode: "view" | "review") {
    setSelectedId(id);
    setModalMode(mode);
    setModalOpen(true);
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
            placeholder="Search student, phone, email, or transaction..."
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
            {programs.map((program) => (
              <SelectItem key={program._id} value={program._id}>{program.title}</SelectItem>
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
          <SelectTrigger><SelectValue placeholder="Enrollment status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All enrollment statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={paymentStatus}
          onValueChange={(value) => {
            setLoading(true);
            setPage(1);
            setPaymentStatus(value);
          }}
        >
          <SelectTrigger><SelectValue placeholder="Payment status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All payment statuses</SelectItem>
            <SelectItem value="submitted">Payment submitted</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="not_required">No payment</SelectItem>
            <SelectItem value="pending">Payment pending</SelectItem>
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
            <SelectItem value="createdAt:desc">Newest first</SelectItem>
            <SelectItem value="createdAt:asc">Oldest first</SelectItem>
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Exam</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Proof</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!loading && rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-28 text-center text-sage-gray-500">
                  No enrollments match the selected filters.
                </TableCell>
              </TableRow>
            ) : null}
            {rows.map((row) => (
              <TableRow key={row._id}>
                <TableCell>
                  <p className="font-semibold">{row.name}</p>
                  <p className="text-xs text-sage-gray-500">{row.phone} · {row.classLabel}</p>
                </TableCell>
                <TableCell>{row.programTitle}</TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {paymentStatusLabels[row.paymentStatus] || row.paymentStatus}
                  </Badge>
                  {row.transactionId ? <p className="mt-1 text-xs">Trx: {row.transactionId}</p> : null}
                </TableCell>
                <TableCell>
                  {row.paymentProof?.previewUrl || row.paymentProof?.url ? (
                    <Button
                      variant="link"
                      className="h-auto p-0 text-sage-primary"
                      onClick={() => openModal(row._id, row.paymentStatus === "submitted" ? "review" : "view")}
                    >
                      View
                    </Button>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {row.paymentStatus === "submitted" ? (
                    <Button
                      size="sm"
                      className="bg-sage-primary hover:bg-sage-secondary"
                      onClick={() => openModal(row._id, "review")}
                    >
                      Review
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => openModal(row._id, "view")}>
                      <Eye className="size-4" />
                      Details
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {loading ? (
          <div className="flex items-center justify-center gap-2 border-t border-sage-border p-5 text-sm text-sage-gray-500">
            <Loader2 className="size-4 animate-spin" />
            Loading enrollments...
          </div>
        ) : null}
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

      <ExamEnrollmentReviewModal
        enrollmentId={selectedId}
        mode={modalMode}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onUpdated={() => void load()}
      />
    </div>
  );
}
