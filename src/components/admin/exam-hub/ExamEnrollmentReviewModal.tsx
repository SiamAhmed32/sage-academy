"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { toast } from "react-toastify";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export type EnrollmentDetail = {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  classLabel: string;
  schoolName?: string;
  message?: string;
  programTitle: string;
  programSlug?: string;
  programFeeAmount?: number;
  feeAmount?: number;
  status: string;
  paymentStatus: string;
  transactionId?: string;
  paymentProof?: { previewUrl?: string; url?: string } | null;
  adminNote?: string;
  verifiedAt?: string;
  createdAt: string;
};

type Props = {
  enrollmentId: string | null;
  mode: "view" | "review";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated?: () => void;
};

function formatDateTime(value?: string) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function DetailItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-sage-border bg-sage-cream/25 px-3 py-2.5">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-sage-gray-500">{label}</p>
      <div className="mt-1 text-sm font-semibold text-sage-secondary">{value}</div>
    </div>
  );
}

export function ExamEnrollmentReviewModal({
  enrollmentId,
  mode,
  open,
  onOpenChange,
  onUpdated,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [detail, setDetail] = useState<EnrollmentDetail | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [adminNote, setAdminNote] = useState("");

  useEffect(() => {
    if (!open || !enrollmentId) {
      setDetail(null);
      setRejecting(false);
      setAdminNote("");
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetch(`/api/admin/exam-hub/enrollments/${enrollmentId}`)
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(typeof data?.message === "string" ? data.message : "Could not load enrollment");
        return data.data as EnrollmentDetail;
      })
      .then((row) => {
        if (!cancelled) setDetail(row);
      })
      .catch((error) => {
        if (!cancelled) toast.error(error instanceof Error ? error.message : "Could not load enrollment");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, enrollmentId]);

  const canReview = mode === "review" && detail?.paymentStatus === "submitted";
  const proofUrl = detail?.paymentProof?.previewUrl || detail?.paymentProof?.url;

  async function submitReview(status: "confirmed" | "cancelled", paymentStatus?: "verified" | "rejected") {
    if (!detail) return;
    if (paymentStatus === "rejected" && !adminNote.trim()) {
      toast.error("Rejection message is required");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/exam-hub/enrollments/${detail._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          paymentStatus,
          adminNote: paymentStatus === "rejected" ? adminNote.trim() : undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(typeof data?.message === "string" ? data.message : "Update failed");
        return;
      }

      if (data?.data?.emailWarning) {
        toast.warn(String(data.data.emailWarning));
      } else if (paymentStatus === "verified" || status === "confirmed") {
        toast.success("Enrollment approved and customer notified");
      } else {
        toast.success("Enrollment rejected and customer notified");
      }

      onOpenChange(false);
      onUpdated?.();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-2xl">
        <DialogHeader className="border-b border-sage-border bg-sage-cream/30 px-5 py-4 text-left">
          <DialogTitle className="text-xl font-bold text-sage-secondary">
            {canReview ? "Review enrollment" : "Enrollment details"}
          </DialogTitle>
          {detail ? (
            <p className="text-sm text-sage-gray-600">
              {detail.name} · {detail.programTitle}
            </p>
          ) : null}
        </DialogHeader>

        <div className="max-h-[calc(90vh-11rem)] space-y-4 overflow-y-auto p-5">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-sage-gray-500">
              <Loader2 className="size-6 animate-spin" />
            </div>
          ) : detail ? (
            <>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{detail.status}</Badge>
                <Badge variant="outline">{detail.paymentStatus}</Badge>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <DetailItem label="Student" value={detail.name} />
                <DetailItem label="Phone" value={detail.phone} />
                <DetailItem label="Email" value={detail.email?.trim() || "—"} />
                <DetailItem label="Class" value={detail.classLabel} />
                <DetailItem label="Exam" value={detail.programTitle} />
                <DetailItem label="Fee" value={`৳${detail.feeAmount ?? detail.programFeeAmount ?? 0}`} />
                <DetailItem label="Transaction ID" value={detail.transactionId?.trim() || "—"} />
                <DetailItem label="Submitted" value={formatDateTime(detail.createdAt)} />
                {detail.verifiedAt ? (
                  <DetailItem label="Reviewed" value={formatDateTime(detail.verifiedAt)} />
                ) : null}
              </div>

              {detail.schoolName?.trim() ? (
                <div className="rounded-xl border border-sage-border bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-sage-gray-500">School</p>
                  <p className="mt-2 text-sm text-sage-gray-700">{detail.schoolName}</p>
                </div>
              ) : null}

              {detail.message?.trim() ? (
                <div className="rounded-xl border border-sage-border bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-sage-gray-500">Message</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-sage-gray-700">{detail.message}</p>
                </div>
              ) : null}

              {detail.adminNote?.trim() ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-red-700">Admin note</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-red-900">{detail.adminNote}</p>
                </div>
              ) : null}

              {proofUrl ? (
                <div className="rounded-xl border border-sage-border bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-sage-gray-500">Payment proof</p>
                  <div className="relative mt-3 aspect-[4/3] overflow-hidden rounded-xl border border-sage-border bg-sage-cream/40">
                    <Image src={proofUrl} alt="Payment proof" fill className="object-contain" unoptimized />
                  </div>
                </div>
              ) : null}

              {canReview && rejecting ? (
                <div className="space-y-2 rounded-xl border border-red-200 bg-red-50/60 p-4">
                  <Label htmlFor="reject-note" className="text-sm font-semibold text-red-900">
                    Rejection message for customer
                  </Label>
                  <Textarea
                    id="reject-note"
                    rows={4}
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    placeholder="Explain why the payment could not be verified..."
                  />
                </div>
              ) : null}
            </>
          ) : (
            <p className="py-10 text-center text-sm text-sage-gray-500">No enrollment selected.</p>
          )}
        </div>

        <DialogFooter className="gap-2 border-t border-sage-border bg-sage-cream/20 p-4">
          {canReview && !rejecting ? (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              <Button
                variant="destructive"
                disabled={submitting}
                onClick={() => setRejecting(true)}
              >
                <XCircle className="size-4" />
                Reject
              </Button>
              <Button
                className="bg-sage-primary hover:bg-sage-secondary"
                disabled={submitting}
                onClick={() => submitReview("confirmed", "verified")}
              >
                {submitting ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                Approve
              </Button>
            </>
          ) : canReview && rejecting ? (
            <>
              <Button variant="outline" disabled={submitting} onClick={() => setRejecting(false)}>
                Back
              </Button>
              <Button
                variant="destructive"
                disabled={submitting}
                onClick={() => submitReview("cancelled", "rejected")}
              >
                {submitting ? <Loader2 className="size-4 animate-spin" /> : "Send rejection"}
              </Button>
            </>
          ) : (
            <Button className="bg-sage-primary hover:bg-sage-secondary" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
