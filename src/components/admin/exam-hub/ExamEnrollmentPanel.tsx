"use client";

import { useEffect, useState } from "react";
import { Eye } from "lucide-react";

import type { AdminExamProgram } from "@/components/admin/exam-hub/ExamHubManager";
import {
  ExamEnrollmentReviewModal,
  type EnrollmentDetail,
} from "@/components/admin/exam-hub/ExamEnrollmentReviewModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

export function ExamEnrollmentPanel({ programs }: { programs: AdminExamProgram[] }) {
  const [rows, setRows] = useState<Enrollment[]>([]);
  const [filter, setFilter] = useState("submitted");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<"view" | "review">("view");

  async function load() {
    const params = new URLSearchParams();
    if (filter) params.set("paymentStatus", filter);
    const res = await fetch(`/api/admin/exam-hub/enrollments?${params.toString()}`);
    const data = await res.json().catch(() => ({}));
    if (res.ok) setRows(data.data || []);
  }

  useEffect(() => {
    load();
  }, [filter]);

  function openModal(id: string, mode: "view" | "review") {
    setSelectedId(id);
    setModalMode(mode);
    setModalOpen(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="submitted">Payment submitted</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="not_required">No payment</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={load}>Refresh</Button>
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
            {rows.map((row) => (
              <TableRow key={row._id}>
                <TableCell>
                  <p className="font-semibold">{row.name}</p>
                  <p className="text-xs text-sage-gray-500">{row.phone} · {row.classLabel}</p>
                </TableCell>
                <TableCell>{row.programTitle}</TableCell>
                <TableCell>
                  <Badge variant="outline">{row.paymentStatus}</Badge>
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
      </div>

      <ExamEnrollmentReviewModal
        enrollmentId={selectedId}
        mode={modalMode}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onUpdated={load}
      />
    </div>
  );
}
