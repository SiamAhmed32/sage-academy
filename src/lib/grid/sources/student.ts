import "server-only";

import { currentMonthKey } from "@/lib/academy/codes";
import { DUE_KIND_LABELS, PAYMENT_METHOD_LABELS } from "@/lib/academy/constants";
import { AppError } from "@/lib/errors";
import { discountLabel } from "@/lib/academy/fees";
import { getStudentDetail } from "@/lib/academy/queries";
import { runGridInMemory, type GridField, type GridRequest } from "@/lib/grid/query";
import type { GridSource } from "@/lib/grid/registry";

// One student's lists are small, so these reuse the profile's own data
// (same numbers as the rest of the page) and filter/sort it in memory.

async function detailFor(request: GridRequest) {
  const id = request.params?.studentId ?? "";
  if (!/^[a-f0-9]{24}$/i.test(id)) throw new AppError("Choose a student first.", 400);
  const detail = await getStudentDetail(id);
  if (!detail) throw new AppError("That student no longer exists.", 404);
  return detail;
}

// ───────────── Subjects & fees ─────────────

const subjectFields: Record<string, GridField> = {
  name: { path: "name", type: "text" },
  teacherName: { path: "teacherName", type: "text" },
  batchCode: { path: "batchCode", type: "text" },
  fee: { path: "fee", type: "number" },
  discountText: { path: "discountText", type: "text" },
  monthly: { path: "monthly", type: "number" },
  startMonth: { path: "startMonth", type: "text" },
  status: { path: "status", type: "set" },
};

export const studentSubjectsSource: GridSource = {
  access: "staff",
  run: async (request) => {
    const detail = await detailFor(request);
    const rows = detail.subjects.map((row) => ({
      id: row.enrollmentId,
      enrollmentId: row.enrollmentId,
      name: row.name,
      teacherName: row.teacherName || "",
      batchId: row.batchId,
      batchCode: row.batchCode,
      transferred: row.batchId !== detail.student.homeBatchId,
      fee: row.fee,
      discount: row.discount,
      discountType: row.discountType,
      discountValue: row.discountValue,
      discountNote: row.discountNote,
      discountText: row.discount > 0 ? discountLabel(row.discountType, row.discountValue) : "",
      monthly: row.monthly,
      startMonth: row.startMonth,
      endMonth: row.endMonth ?? "",
      status: row.status,
    }));
    return runGridInMemory({
      rows,
      request,
      fields: subjectFields,
      searchPaths: ["name", "teacherName", "batchCode", "discountNote"],
      defaultSort: [
        { path: "status", dir: 1 },
        { path: "name", dir: 1 },
      ],
    });
  },
};

// ───────────── Bills ─────────────

const dueFields: Record<string, GridField> = {
  month: { path: "month", type: "text" },
  kind: { path: "kind", type: "set" },
  label: { path: "label", type: "text" },
  details: { path: "details", type: "text", sortable: false },
  amount: { path: "amount", type: "number" },
  paid: { path: "paid", type: "number" },
  remaining: { path: "remaining", type: "number" },
  status: { path: "status", type: "set" },
};

export const studentDuesSource: GridSource = {
  access: "staff",
  run: async (request) => {
    const detail = await detailFor(request);
    const month = currentMonthKey();
    const rows = detail.dues.map((due) => {
      const parts = due.lines.map((line) => `${line.subjectName} ৳${line.amount.toLocaleString("en-IN")}`); // admin-language-allow
      if (due.adjustment) parts.push(`Adjustment ${due.adjustment > 0 ? "+" : "−"}৳${Math.abs(due.adjustment).toLocaleString("en-IN")}`); // admin-language-allow
      return {
        id: due.id,
        month: due.month,
        advance: due.month > month,
        kind: due.kind,
        label: due.label || DUE_KIND_LABELS[due.kind],
        details: parts.length ? parts.join(" · ") : due.note || "",
        amount: due.amount,
        paid: due.paid,
        remaining: due.status === "void" ? 0 : Math.max(0, due.amount - due.paid),
        status: due.status,
      };
    });
    const openOnly = request.preset === "open";
    const scoped = openOnly ? rows.filter((row) => row.status === "unpaid" || row.status === "partial") : rows;
    return runGridInMemory({
      rows: scoped,
      request,
      fields: dueFields,
      searchPaths: ["label", "details", "month"],
      defaultSort: [{ path: "month", dir: -1 }],
    });
  },
};

// ───────────── Receipts ─────────────

const receiptFields: Record<string, GridField> = {
  receiptNo: { path: "receiptNo", type: "text" },
  paidAt: { path: "paidAt", type: "date" },
  monthsText: { path: "monthsText", type: "text" },
  method: { path: "method", type: "set" },
  amount: { path: "amount", type: "number" },
  receivedBy: { path: "receivedBy", type: "text" },
  status: { path: "status", type: "set" },
};

export const studentReceiptsSource: GridSource = {
  access: "staff",
  run: async (request) => {
    const detail = await detailFor(request);
    const rows = detail.payments.map((payment) => ({
      id: payment.id,
      receiptNo: payment.receiptNo,
      paidAt: payment.paidAt,
      months: payment.months,
      monthsText: payment.months.join(" "),
      method: payment.method,
      methodLabel: PAYMENT_METHOD_LABELS[payment.method],
      amount: payment.amount,
      receivedBy: payment.receivedBy,
      status: payment.status,
    }));
    return runGridInMemory({
      rows,
      request,
      fields: receiptFields,
      searchPaths: ["receiptNo", "receivedBy", "monthsText", "methodLabel"],
      defaultSort: [{ path: "paidAt", dir: -1 }],
    });
  },
};

// ───────────── Activity ─────────────

const activityFields: Record<string, GridField> = {
  message: { path: "message", type: "text" },
  type: { path: "type", type: "set" },
  by: { path: "by", type: "text" },
  at: { path: "at", type: "date" },
};

function activityType(action: string) {
  if (action.startsWith("payment") || action.startsWith("receipt")) return "payment";
  if (action.startsWith("discount")) return "discount";
  if (action.startsWith("subject")) return "subjects";
  if (action.startsWith("due") || action.startsWith("charge")) return "bills";
  return "profile";
}

export const studentActivitySource: GridSource = {
  access: "staff",
  run: async (request) => {
    const detail = await detailFor(request);
    const rows = detail.activity.map((entry) => ({
      id: entry.id,
      message: entry.message,
      action: entry.action,
      type: activityType(entry.action),
      by: entry.by,
      at: entry.at,
    }));
    return runGridInMemory({
      rows,
      request,
      fields: activityFields,
      searchPaths: ["message", "by"],
      defaultSort: [{ path: "at", dir: -1 }],
    });
  },
};
