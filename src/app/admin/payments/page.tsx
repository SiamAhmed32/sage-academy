import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { PaymentManager, type PaymentFilters } from "@/components/admin/payments/PaymentManager";
import { months } from "@/components/admin/payments/payment-options";
import { connectDB } from "@/lib/mongodb";
import { monthNumberFromName } from "@/lib/month-utils";
import { billingMonthEnd, ensureAllBillingMonthsForActiveStudents } from "@/lib/billing";
import Payment from "@/models/Payment";
import Student from "@/models/Student";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function single(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function numberParam(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function limitParam(value: string | undefined) {
  return Math.min(numberParam(value, 10), 10);
}

async function paymentQuery(filters: PaymentFilters) {
  const query: Record<string, unknown> = {};
  let monthNumber: number | undefined;
  if (filters.month !== "all") {
    monthNumber = monthNumberFromName(filters.month);
    query.$or = [
      { monthNumber },
      { month: filters.month, monthNumber: { $exists: false } },
    ];
  }
  if (filters.year !== "all") query.year = Number(filters.year);
  if (filters.method !== "all") query.paymentMethod = filters.method;
  if (filters.status === "paid") Object.assign(query, { amount: { $gt: 0 }, dueAmount: { $lte: 0 } });
  if (filters.status === "partial") Object.assign(query, { amount: { $gt: 0 }, dueAmount: { $gt: 0 } });
  if (filters.status === "unpaid") query.amount = { $lte: 0 };
  if (filters.status === "due") query.dueAmount = { $gt: 0 };
  if (filters.q) {
    const students = await Student.find({
      $or: [
        { nameEnglish: { $regex: filters.q, $options: "i" } },
        { studentId: { $regex: filters.q, $options: "i" } },
      ],
    }).select("_id").lean();
    query.student = { $in: students.map((s) => s._id) };
  }
  if (monthNumber && filters.year !== "all") {
    const eligibleStudents = await Student.find({
      isActive: true,
      $or: [
        { admissionDate: { $lte: billingMonthEnd(monthNumber, Number(filters.year)) } },
        { admissionDate: null },
        { admissionDate: { $exists: false } },
      ],
    }).select("_id").lean();
    const eligibleIds = eligibleStudents.map((s) => s._id);
    const currentStudentFilter = query.student as { $in?: unknown[] } | undefined;
    query.student = {
      $in: currentStudentFilter?.$in
        ? currentStudentFilter.$in.filter((id) => eligibleIds.some((eligibleId) => String(eligibleId) === String(id)))
        : eligibleIds,
    };
  }
  return query;
}

export default async function AdminPaymentsPage({ searchParams }: { searchParams: SearchParams }) {
  await connectDB();
  const params = await searchParams;
  const now = new Date();
  const page = numberParam(single(params.page), 1);
  const limit = limitParam(single(params.limit));
  const filters: PaymentFilters = {
    q: single(params.q) || "",
    month: single(params.month) || months[now.getMonth()],
    year: single(params.year) || String(now.getFullYear()),
    status: single(params.status) || "all",
    method: single(params.method) || "all",
  };

  const currentMonth = months[now.getMonth()];
  const currentYear = now.getFullYear();
  let automation = null;
  if (filters.month === currentMonth && filters.year === String(currentYear)) {
    const result = await ensureAllBillingMonthsForActiveStudents(now);
    automation = { ...result, month: currentMonth, year: currentYear };
  }

  const query = await paymentQuery(filters);
  type PaymentSummary = {
    expected: number;
    paid: number;
    due: number;
    paidCount: number;
    partialCount: number;
    unpaidCount: number;
    reversedCount: number;
  };
  const [payments, totalPayments, summaryAgg] = await Promise.all([
    Payment.find(query).populate("student", "nameEnglish studentId").populate("receivedBy", "name").populate("transactions.receivedBy", "name")
      .populate("transactions.reversedBy", "name")
      .sort({ year: -1, monthNumber: -1, createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Payment.countDocuments(query),
    Payment.aggregate<PaymentSummary>([
      { $match: query },
      {
        $project: {
          amount: { $ifNull: ["$amount", 0] },
          expectedAmount: { $ifNull: ["$expectedAmount", 0] },
          dueAmount: { $ifNull: ["$dueAmount", 0] },
          reversedCount: {
            $size: {
              $filter: {
                input: { $ifNull: ["$transactions", []] },
                as: "transaction",
                cond: { $eq: ["$$transaction.status", "reversed"] },
              },
            },
          },
        },
      },
      {
        $group: {
          _id: null,
          expected: { $sum: "$expectedAmount" },
          paid: { $sum: "$amount" },
          due: { $sum: "$dueAmount" },
          paidCount: {
            $sum: {
              $cond: [
                { $and: [{ $gt: ["$amount", 0] }, { $lte: ["$dueAmount", 0] }] },
                1,
                0,
              ],
            },
          },
          partialCount: {
            $sum: {
              $cond: [
                { $and: [{ $gt: ["$amount", 0] }, { $gt: ["$dueAmount", 0] }] },
                1,
                0,
              ],
            },
          },
          unpaidCount: {
            $sum: { $cond: [{ $lte: ["$amount", 0] }, 1, 0] },
          },
          reversedCount: { $sum: "$reversedCount" },
        },
      },
    ]),
  ]);
  const summary = summaryAgg[0] || { expected: 0, paid: 0, due: 0, paidCount: 0, partialCount: 0, unpaidCount: 0, reversedCount: 0 };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="পেমেন্ট ম্যানেজমেন্ট"
        description="শিক্ষার্থীদের অফলাইন পেমেন্ট রেকর্ড, বকেয়া হিসাব এবং রসিদ এক জায়গা থেকে পরিচালনা করুন।"
      />
      <PaymentManager
        key={`${filters.month}-${filters.year}-${filters.status}-${filters.method}-${filters.q}-${page}`}
        initialPayments={JSON.parse(JSON.stringify(payments))}
        filters={filters}
        pagination={{ page, limit, totalPayments }}
        summary={summary}
        automation={automation}
      />
    </div>
  );
}
