export type StudentPayment = {
  _id: string;
  student: { nameEnglish: string; studentId: string };
  amount: number;
  expectedAmount?: number;
  dueAmount?: number;
  month: string;
  year: number;
  paymentMethod: string;
  status?: string;
  paymentDate?: string;
  createdAt: string;
  receivedBy?: { name?: string };
  signedProof?: {
    url?: string;
    previewUrl?: string;
    publicId?: string;
    resourceType?: string;
    format?: string;
    originalName?: string;
    uploadedAt?: string;
  };
  lineItems?: Array<{
    type: "tuition" | "admission" | "previous_due" | "advance" | "other";
    label: string;
    fee: number;
    discount: number;
    amount: number;
    paidAmount?: number;
    month?: string;
    year?: number;
  }>;
  transactions?: Array<{
    _id: string;
    amount: number;
    status?: "active" | "reversed";
    kind?: "payment" | "advance_applied";
    paymentMethod: string;
    paymentDate: string;
    receivedBy?: { name?: string };
    reversedAt?: string;
    reversedBy?: { name?: string };
    reversalReason?: string;
    lineItems?: Array<{
      type: "tuition" | "admission" | "previous_due" | "advance" | "other";
      label: string;
      fee: number;
      discount: number;
      amount: number;
      paidAmount?: number;
      month?: string;
      year?: number;
    }>;
  }>;
};

export function paymentStatus(paid: number, expected: number) {
  if (expected <= 0 && paid > 0) return "Paid";
  if (paid >= expected && expected > 0) return "Paid";
  if (paid > 0) return "Partial";
  return "Unpaid";
}

export function paymentDue(paid: number, expected: number) {
  return Math.max(0, expected - paid);
}

export function paymentDateLabel(payment: StudentPayment) {
  const value = payment.paymentDate || payment.createdAt;
  return value ? new Date(value).toLocaleDateString("bn-BD") : "N/A";
}

export function paidBySubject(payment: StudentPayment) {
  const totals: Record<string, number> = {};
  (payment.transactions ?? [])
    .filter((transaction) => transaction.status !== "reversed")
    .forEach((transaction) => {
      (transaction.lineItems ?? []).forEach((item) => {
        if (item.type === "advance") return;
        const label = String(item.label || "");
        totals[label] = (totals[label] || 0) + Math.max(0, Number(item.paidAmount ?? item.amount) || 0);
      });
    });
  return totals;
}

export function statusTone(status: string) {
  const normalized = status.toLowerCase();
  if (normalized === "paid") return "bg-emerald-50 text-emerald-700 ring-emerald-100";
  if (normalized === "unpaid") return "bg-amber-50 text-amber-800 ring-amber-100";
  if (normalized === "partial") return "bg-orange-50 text-orange-700 ring-orange-100";
  return "bg-sage-red-50 text-sage-primary ring-sage-red-100";
}

export function bnMonthLabel(month: string) {
  const index = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ].indexOf(month);
  if (index < 0) return month;
  return [
    "জানুয়ারি",
    "ফেব্রুয়ারি",
    "মার্চ",
    "এপ্রিল",
    "মে",
    "জুন",
    "জুলাই",
    "আগস্ট",
    "সেপ্টেম্বর",
    "অক্টোবর",
    "নভেম্বর",
    "ডিসেম্বর",
  ][index];
}
