"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { toast } from "react-toastify";

import { updatePaymentAmountAction } from "@/app/admin/actions";
import type { AdminPayment } from "./PaymentManager";
import { methodLabels } from "./payment-options";

type Props = { payment: AdminPayment; onClose: () => void; onUpdated: (payment: AdminPayment) => void };

export function PaymentEditModal({ payment, onClose, onUpdated }: Props) {
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
      onUpdated(res.data as AdminPayment);
      onClose();
    } else {
      toast.error(res.message || "পেমেন্ট আপডেট করা যায়নি।");
    }
  }

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-sage-border bg-sage-red-50/50 p-5">
          <div>
            <h3 className="text-xl font-bold text-sage-secondary">পেমেন্ট এডিট</h3>
            <p className="mt-1 text-sm text-sage-gray-500">বাস্তবে পাওয়া টাকার পরিমাণ ঠিক করুন।</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-sage-gray-500 hover:bg-white hover:text-sage-primary">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="grid gap-4 p-5">
          <label className="grid gap-2 text-sm font-bold text-sage-secondary">
            জমা টাকা
            <input type="number" min="0" value={amount} onChange={(e) => setAmount(Number(e.target.value) || 0)} className="h-12 rounded-xl border border-sage-border px-4 outline-none focus:border-sage-primary" />
          </label>
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
            <button type="button" onClick={onClose} className="h-11 rounded-xl border border-sage-border bg-white px-5 font-bold text-sage-secondary">
              বাতিল
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
