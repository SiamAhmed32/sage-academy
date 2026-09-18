import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { connectDB } from "@/lib/mongodb";
import QuizSubmission from "@/models/QuizSubmission";
import { QuizLeadTable } from "@/components/admin/quizzes/QuizLeadTable";
import { Pagination } from "@/components/admin/shared/Pagination";
import { formatAdminNumber } from "@/lib/admin-format";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const PAGE_SIZE_OPTIONS = [25, 50, 100] as const;
const STATUSES = ["new", "contacted", "invalid", "qualified"] as const;

function getParam(params: Record<string, string | string[] | undefined>, key: string, fallback = "") {
  const value = params[key];
  return Array.isArray(value) ? value[0] ?? fallback : value ?? fallback;
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export default async function AdminQuizLeadsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const q = getParam(params, "q").trim().slice(0, 100);
  const rawStatus = getParam(params, "status", "all");
  const status = STATUSES.includes(rawStatus as (typeof STATUSES)[number]) ? rawStatus : "all";
  const rawClassLevel = Number(getParam(params, "classLevel"));
  const classLevel = Number.isInteger(rawClassLevel) && rawClassLevel >= 1 && rawClassLevel <= 12
    ? rawClassLevel
    : null;
  const whatsapp = ["yes", "no"].includes(getParam(params, "whatsapp"))
    ? getParam(params, "whatsapp")
    : "all";
  const dateRange = ["today", "week", "month"].includes(getParam(params, "dateRange"))
    ? getParam(params, "dateRange")
    : "all";
  const sort = ["oldest", "score-desc", "score-asc"].includes(getParam(params, "sort"))
    ? getParam(params, "sort")
    : "newest";
  const requestedPage = Math.max(1, Math.trunc(Number(getParam(params, "page", "1"))) || 1);
  const rawLimit = Number(getParam(params, "limit", "25"));
  const limit = PAGE_SIZE_OPTIONS.includes(rawLimit as (typeof PAGE_SIZE_OPTIONS)[number]) ? rawLimit : 25;

  await connectDB();
  const query: Record<string, unknown> = {};
  if (q) {
    const regex = { $regex: escapeRegex(q), $options: "i" };
    query.$or = [{ name: regex }, { phone: regex }];
  }
  if (status !== "all") query.status = status;
  if (classLevel != null) query.classLevel = classLevel;
  if (whatsapp !== "all") query.whatsappRequested = whatsapp === "yes";
  if (dateRange !== "all") {
    const now = new Date();
    const start = new Date(now);
    if (dateRange === "today") start.setHours(0, 0, 0, 0);
    else if (dateRange === "week") start.setDate(now.getDate() - 7);
    else start.setDate(now.getDate() - 30);
    query.createdAt = { $gte: start };
  }

  const sortSpec: Record<string, 1 | -1> =
    sort === "oldest"
      ? { createdAt: 1 }
      : sort === "score-desc"
        ? { score: -1, createdAt: -1 }
        : sort === "score-asc"
          ? { score: 1, createdAt: -1 }
          : { createdAt: -1 };
  const totalDocs = await QuizSubmission.countDocuments(query);
  const totalPages = Math.max(1, Math.ceil(totalDocs / limit));
  const page = Math.min(requestedPage, totalPages);
  const [leads, classLevels] = await Promise.all([
    QuizSubmission.find(query)
      .populate("answers.question", "questionText explanation")
      .sort(sortSpec)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    QuizSubmission.distinct("classLevel"),
  ]);
  const from = totalDocs === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, totalDocs);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Quiz Lead Management"
        description="Review quiz participants, results, and follow-up status."
      />
      <div className="rounded-xl border border-sage-border bg-white px-5 py-4 text-sm font-semibold text-sage-gray-600 shadow-sm">
        <span className="font-black text-sage-primary">{formatAdminNumber(totalDocs)}</span> leads
        {totalDocs > 0 ? ` · Showing ${formatAdminNumber(from)}–${formatAdminNumber(to)}` : ""}
      </div>
      <QuizLeadTable
        key={[q, status, classLevel, whatsapp, dateRange, sort, limit, page].join("|")}
        initialLeads={JSON.parse(JSON.stringify(leads))}
        filters={{
          q,
          status,
          classLevel: classLevel?.toString() ?? "all",
          whatsapp,
          dateRange,
          sort,
          limit,
          pageSizeOptions: [...PAGE_SIZE_OPTIONS],
          classLevels: (classLevels as number[]).filter(Number.isFinite).sort((a, b) => a - b),
        }}
      />
      <Pagination
        totalPages={totalPages}
        currentPage={page}
        totalItems={totalDocs}
        pageSize={limit}
        showWhenSinglePage={totalDocs > 0}
      />
    </div>
  );
}
