import jsPDF from "jspdf";

import { renderPaymentReceipt } from "./payment-receipt-layout";

export type ReceiptPayment = {
  _id: string;
  student: { nameEnglish: string; studentId: string };
  amount: number;
  expectedAmount?: number;
  dueAmount?: number;
  month: string;
  year: number;
  paymentMethod: string;
  createdAt: string;
  receivedBy?: { name?: string };
  receiptSummary?: {
    previousPaid: number;
    currentPaid: number;
    totalPaid: number;
    remainingDue: number;
  };
  lineItems?: ReceiptLineItem[];
  transactions?: ReceiptTransaction[];
};

export type ReceiptLineItem = {
  type: "tuition" | "admission" | "previous_due" | "advance" | "other";
  label: string;
  fee: number;
  discount: number;
  amount: number;
  paidAmount?: number;
  month?: string;
  year?: number;
};

export type ReceiptTransaction = {
  _id?: string;
  amount: number;
  status?: "active" | "reversed";
  kind?: "payment" | "advance_applied";
  paymentMethod: string;
  paymentDate: string;
  receivedBy?: { name?: string };
  lineItems?: ReceiptLineItem[];
};

export function money(value = 0) {
  return `BDT ${Number(value || 0).toLocaleString("en-US")}`;
}

function rows(payment: ReceiptPayment): ReceiptLineItem[] {
  if (payment.lineItems?.length) return payment.lineItems;
  return [{
    type: "tuition",
    label: "Tuition Fee",
    fee: payment.expectedAmount || payment.amount,
    discount: 0,
    amount: payment.amount,
    month: payment.month,
    year: payment.year,
  }];
}

function transactionRows(transaction: ReceiptTransaction): ReceiptLineItem[] {
  if (!transaction.lineItems?.length) {
    return [{
      type: "other",
      label: "Payment received",
      fee: transaction.amount,
      discount: 0,
      amount: transaction.amount,
    }];
  }

  return transaction.lineItems.map((item) => ({
    ...item,
    amount: item.paidAmount ?? item.amount,
  }));
}

export function downloadPaymentReceipt(payment: ReceiptPayment, transaction?: ReceiptTransaction) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const activeTransactions = (payment.transactions ?? []).filter((item) => item.status !== "reversed");
  const transactionIndex = transaction?._id
    ? activeTransactions.findIndex((item) => item._id === transaction._id)
    : -1;
  const previousPaid = transaction && transactionIndex >= 0
    ? activeTransactions.slice(0, transactionIndex).reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
    : 0;
  const currentPaid = transaction ? transaction.amount : payment.amount;
  const totalPaid = transaction ? previousPaid + currentPaid : payment.amount;
  const expectedAmountForSummary = payment.expectedAmount || Math.max(payment.amount, totalPaid);
  const remainingDue = Math.max(0, expectedAmountForSummary - totalPaid);
  const paymentForReceipt = transaction
    ? {
        ...payment,
        amount: transaction.amount,
        paymentMethod: transaction.paymentMethod,
        createdAt: transaction.paymentDate,
        receivedBy: transaction.receivedBy || payment.receivedBy,
        receiptSummary: {
          previousPaid,
          currentPaid,
          totalPaid,
          remainingDue,
        },
      }
    : {
        ...payment,
        receiptSummary: {
          previousPaid,
          currentPaid,
          totalPaid,
          remainingDue,
        },
      };
  const items = transaction ? transactionRows(transaction) : rows(payment);
  const totalDiscount = items.reduce((sum, item) => sum + (item.discount || 0), 0);
  const due = transaction ? remainingDue : payment.dueAmount ?? remainingDue;

  renderPaymentReceipt(doc, paymentForReceipt, items, totalDiscount, due);
  const suffix = transaction?._id ? `-${transaction._id.slice(-6)}` : "";
  doc.save(`sage-receipt-${payment.student.studentId}-${payment.month}-${payment.year}${suffix}.pdf`);
}
