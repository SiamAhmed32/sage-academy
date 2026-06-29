"use client";

import { useState } from "react";
import { Loader2, ShieldCheck, Upload } from "lucide-react";
import { toast } from "react-toastify";

import { BKASH_SEND_MONEY_DISPLAY } from "@/constants/exam-hub";
import { classLevelOptions } from "@/constants/class-levels";
import type { PublicExamProgram } from "@/lib/exam-hub";
import { saveExamHubSession } from "@/lib/exam-hub-session";
import { normalizeBangladeshPhone } from "@/lib/bd-phone";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  program: PublicExamProgram;
  onSuccess?: () => void;
};

export function ExamEnrollmentDialog({ open, onOpenChange, program, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    classLabel: classLevelOptions[2]?.label || "৬ষ্ঠ শ্রেণি",
    schoolName: "",
    message: "",
    transactionId: "",
  });
  const [proof, setProof] = useState<File | null>(null);

  const requiresPayment = program.requiresPayment && program.feeAmount > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("programSlug", program.slug);
      fd.append("name", form.name);
      fd.append("phone", form.phone);
      fd.append("email", form.email);
      fd.append("classLabel", form.classLabel);
      fd.append("schoolName", form.schoolName);
      fd.append("message", form.message);
      if (requiresPayment) {
        fd.append("transactionId", form.transactionId);
        if (proof) fd.append("paymentProof", proof);
      }

      const res = await fetch("/api/exam-hub/enrollments", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));

      if (res.status === 409 && data?.data?.enrollmentId) {
        saveExamHubSession({
          enrollmentId: data.data.enrollmentId,
          phone: normalizeBangladeshPhone(form.phone),
          programSlug: program.slug,
          name: data.data.name || form.name,
          status: data.data.status,
          paymentStatus: data.data.paymentStatus,
          statusLabel: data.data.statusLabel,
          adminNote: data.data.adminNote,
          canRegisterAgain: data.data.canRegisterAgain,
          canStartExam: data.data.canStartExam,
        });
        toast.info(typeof data?.message === "string" ? data.message : "Registration already submitted.");
        onOpenChange(false);
        onSuccess?.();
        return;
      }

      if (!res.ok) {
        toast.error(typeof data?.message === "string" ? data.message : "Enrollment failed");
        return;
      }

      const enrollmentId = data?.data?.enrollmentId;
      if (enrollmentId) {
        saveExamHubSession({
          enrollmentId,
          phone: normalizeBangladeshPhone(form.phone),
          programSlug: program.slug,
          name: form.name,
          status: data?.data?.status,
          paymentStatus: data?.data?.paymentStatus,
          statusLabel:
            data?.data?.status === "confirmed"
              ? "Registration confirmed"
              : "Awaiting approval",
          canRegisterAgain: data?.data?.status !== "pending",
          canStartExam: data?.data?.status === "confirmed" && data?.data?.paymentStatus !== "submitted",
        });
      }

      if (requiresPayment) {
        toast.success("Registration submitted. Payment verification pending.");
      } else {
        toast.success("Registration confirmed!");
      }

      onOpenChange(false);
      onSuccess?.();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="bn-headline text-xl font-bold text-sage-secondary">
            {program.deliveryMode === "offline" ? "Offline registration" : "Exam enrollment"}
          </DialogTitle>
          <DialogDescription className="bn-text">
            {program.title} — fill in your details to continue.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Full name">
            <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Mobile number">
            <Input
              required
              placeholder="017xxxxxxxx"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </Field>
          <Field label="Email">
            <Input
              type="email"
              required
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </Field>
          <Field label="Class">
            <Select value={form.classLabel} onValueChange={(v) => setForm({ ...form, classLabel: v })}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {classLevelOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.label}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="School (optional)">
            <Input value={form.schoolName} onChange={(e) => setForm({ ...form, schoolName: e.target.value })} />
          </Field>
          <Field label="Message (optional)">
            <Textarea
              rows={3}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
            />
          </Field>

          {requiresPayment ? (
            <div className="space-y-4 rounded-2xl border border-sage-border bg-sage-cream/60 p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 size-5 text-sage-primary" />
                <div>
                  <p className="font-semibold text-sage-secondary">bKash Send Money</p>
                  <p className="bn-text mt-1 text-sm text-sage-gray-700">
                    Send ৳{program.feeAmount} to <strong>{BKASH_SEND_MONEY_DISPLAY}</strong>, then upload proof.
                  </p>
                </div>
              </div>
              <Field label="Transaction ID">
                <Input
                  required
                  value={form.transactionId}
                  onChange={(e) => setForm({ ...form, transactionId: e.target.value })}
                />
              </Field>
              <Field label="Payment screenshot">
                <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-sage-border bg-white px-4 py-6 text-sm text-sage-gray-700">
                  <Upload className="size-5 text-sage-primary" />
                  {proof ? proof.name : "Upload screenshot"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    required
                    onChange={(e) => setProof(e.target.files?.[0] || null)}
                  />
                </label>
              </Field>
            </div>
          ) : null}

          <Button
            type="submit"
            disabled={loading}
            className="h-12 w-full rounded-xl bg-sage-primary font-bold hover:bg-sage-secondary"
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : "Submit registration"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-semibold text-sage-secondary">{label}</Label>
      {children}
    </div>
  );
}
