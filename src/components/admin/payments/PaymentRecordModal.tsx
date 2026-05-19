"use client";

import { X } from "lucide-react";

import type { AdminPayment } from "./PaymentManager";
import { PaymentRecordForm, type PaymentRecordForForm, type PaymentStudentForForm } from "./PaymentRecordForm";

type Props = {
  onClose: () => void;
  onSaved: (payment: AdminPayment) => void;
  initialStudent?: PaymentStudentForForm | null;
  existingPayments?: PaymentRecordForForm[];
};

export function PaymentRecordModal({ onClose, onSaved, initialStudent = null, existingPayments = [] }: Props) {
  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-start justify-between gap-4 border-b border-sage-border bg-sage-red-50/70 px-5 py-4 sm:px-6">
          <div>
            <h3 className="text-xl font-black text-sage-secondary">
              নতুন পেমেন্ট রেকর্ড
            </h3>
            <p className="mt-1 text-sm text-sage-gray-500">
              বাস্তবে পাওয়া টাকা সংরক্ষণ করুন, তারপর প্রয়োজন হলে রসিদ প্রিন্ট করুন।
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-sage-gray-500 transition hover:bg-white hover:text-sage-primary"
            aria-label="পেমেন্ট ফর্ম বন্ধ করুন"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-5 sm:p-6">
          <PaymentRecordForm
            initialStudent={initialStudent}
            existingPayments={existingPayments}
            onSaved={onSaved}
            onCancel={onClose}
          />
        </div>
      </div>
    </div>
  );
}
