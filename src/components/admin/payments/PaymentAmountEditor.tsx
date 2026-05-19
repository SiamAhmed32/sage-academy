"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

import { updatePaymentAmountAction } from "@/app/admin/actions";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { AdminPayment } from "./PaymentManager";
import { methodLabels } from "./payment-options";

type EditablePayment = Pick<AdminPayment, "_id" | "amount" | "expectedAmount" | "dueAmount" | "paymentMethod">;
type Props = { payment: EditablePayment; onUpdated?: (payment: AdminPayment) => void };

export function PaymentAmountEditor({ payment, onUpdated }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(payment.amount);
  const [method, setMethod] = useState(payment.paymentMethod);
  const [isSaving, setIsSaving] = useState(false);
  const expected = Math.max(payment.expectedAmount || 0, payment.amount + (payment.dueAmount || 0));
  const due = Math.max(0, expected - amount);

  async function save() {
    const formData = new FormData();
    formData.append("paymentId", payment._id);
    formData.append("amount", String(Math.max(0, amount)));
    formData.append("paymentMethod", method);
    setIsSaving(true);
    const res = await updatePaymentAmountAction(formData);
    setIsSaving(false);
    if (res.ok && res.data) {
      toast.success("পেমেন্ট আপডেট হয়েছে।");
      onUpdated?.(res.data as AdminPayment);
      if (!onUpdated) router.refresh();
      setOpen(false);
    } else {
      toast.error(res.message || "পেমেন্ট আপডেট করা যায়নি।");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button type="button" className="inline-flex items-center gap-1 rounded-lg border border-sage-border bg-white px-3 py-1.5 text-sm font-bold text-sage-secondary hover:border-sage-primary hover:text-sage-primary">
          <Pencil className="h-3 w-3" />
          এডিট
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md overflow-hidden border-sage-border bg-white p-0 shadow-2xl" showCloseButton>
        <DialogHeader className="border-b border-sage-border bg-sage-red-50/50 p-5">
          <DialogTitle className="text-xl font-bold text-sage-secondary">পেমেন্ট এডিট</DialogTitle>
          <DialogDescription className="text-sm text-sage-gray-500">বাস্তবে পাওয়া টাকার পরিমাণ ঠিক করুন।</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 p-5">
          <PaymentInput label="জমা টাকা" value={amount} onChange={setAmount} />
          <label className="grid gap-2 text-sm font-bold text-sage-secondary">
            পেমেন্ট মাধ্যম
            <select value={method} onChange={(e) => setMethod(e.target.value)} className="h-12 rounded-xl border border-sage-border bg-white px-4">
              {Object.entries(methodLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <div className="rounded-xl border border-sage-border bg-sage-red-50/30 p-4 text-sm font-bold text-sage-secondary">
            মোট পাওনা ৳{expected} · জমা ৳{amount} · বকেয়া ৳{due}
          </div>
          <div className="flex gap-3">
            <button type="button" disabled={isSaving} onClick={save} className="h-11 flex-1 rounded-xl bg-sage-primary font-bold text-white disabled:opacity-50">
              {isSaving ? "সেভ হচ্ছে..." : "সেভ করুন"}
            </button>
            <button type="button" onClick={() => setOpen(false)} className="h-11 rounded-xl border border-sage-border bg-white px-5 font-bold text-sage-secondary">
              বাতিল
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PaymentInput({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="grid gap-2 text-sm font-bold text-sage-secondary">
      {label}
      <input type="number" min="0" value={value} onChange={(e) => onChange(Number(e.target.value) || 0)} className="h-12 rounded-xl border border-sage-border px-4 outline-none focus:border-sage-primary" />
    </label>
  );
}
