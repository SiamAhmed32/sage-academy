import { Metadata } from "next";
import { connectDB } from "@/lib/mongodb";
import AdmissionRequest from "@/models/AdmissionRequest";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdmissionTable } from "@/components/admin/admissions/AdmissionTable";
import { AdmissionFilters } from "@/components/admin/admissions/AdmissionFilters";
import { Pagination } from "@/components/admin/shared/Pagination";
import { formatAdminNumber } from "@/lib/admin-format";

export const metadata: Metadata = {
  title: "Admission Management | SAGE Admin",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface AdmissionPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const PAGE_SIZE_OPTIONS = [25, 50, 100] as const;
const STATUSES = ["new", "contacted", "qualified", "closed", "spam"] as const;
const CLASS_NAMES = ["5", "6", "7", "8", "9", "10", "11", "12"] as const;

function getParam(params: Record<string, string | string[] | undefined>, key: string, fallback = "") {
  const value = params[key];
  return Array.isArray(value) ? value[0] ?? fallback : value ?? fallback;
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export default async function AdmissionPage({ searchParams }: AdmissionPageProps) {
  const params = await searchParams;
  const search = getParam(params, "search").trim().slice(0, 100);
  const rawStatus = getParam(params, "status", "all");
  const status = STATUSES.includes(rawStatus as (typeof STATUSES)[number]) ? rawStatus : "all";
  const rawClassName = getParam(params, "class", "all");
  const className = CLASS_NAMES.includes(rawClassName as (typeof CLASS_NAMES)[number]) ? rawClassName : "all";
  const view = getParam(params, "view") === "archived" ? "archived" : "active";
  const dateRange = ["today", "week", "month"].includes(getParam(params, "dateRange"))
    ? getParam(params, "dateRange")
    : "all";
  const sort = getParam(params, "sort") === "asc" ? "asc" : "desc";
  const requestedPage = Math.max(1, Math.trunc(Number(getParam(params, "page", "1"))) || 1);
  const rawLimit = Number(getParam(params, "limit", "25"));
  const limit = PAGE_SIZE_OPTIONS.includes(rawLimit as (typeof PAGE_SIZE_OPTIONS)[number]) ? rawLimit : 25;

  await connectDB();
  const query: Record<string, unknown> = {
    isArchived: view === "archived" ? true : { $ne: true },
  };
  
  if (search) {
    const regex = { $regex: escapeRegex(search), $options: "i" };
    query.$or = [
      { studentName: regex },
      { phone: regex },
      { guardianName: regex },
      { email: regex },
      { schoolName: regex },
    ];
  }

  if (status !== "all") query.status = status;
  if (className !== "all") query.className = className;
  if (dateRange !== "all") {
    const now = new Date();
    const start = new Date(now);
    if (dateRange === "today") start.setHours(0, 0, 0, 0);
    else if (dateRange === "week") start.setDate(now.getDate() - 7);
    else start.setDate(now.getDate() - 30);
    query.createdAt = { $gte: start };
  }

  const totalDocs = await AdmissionRequest.countDocuments(query);
  const totalPages = Math.max(1, Math.ceil(totalDocs / limit));
  const page = Math.min(requestedPage, totalPages);
  const rawRequests = await AdmissionRequest.find(query)
    .sort({ createdAt: sort === "asc" ? 1 : -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();
  const requests = JSON.parse(JSON.stringify(rawRequests));
  const from = totalDocs === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, totalDocs);

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <AdminPageHeader
        title="Admission Applications"
        description={`Manage ${view === "archived" ? "archived" : "active"} SAGE Academy admission applications.`}
      />

      <div className="space-y-4">
        <div className="rounded-xl border border-gray-200 bg-white px-5 py-4 text-sm font-semibold text-gray-600">
          <span className="font-black text-sage-primary">{formatAdminNumber(totalDocs)}</span> applications
          {totalDocs > 0 ? ` · Showing ${formatAdminNumber(from)}–${formatAdminNumber(to)}` : ""}
        </div>
        <AdmissionFilters
          key={[search, status, className, view, sort, dateRange, limit].join("|")}
          search={search}
          status={status}
          className={className}
          view={view}
          sort={sort}
          dateRange={dateRange}
          limit={limit}
          pageSizeOptions={[...PAGE_SIZE_OPTIONS]}
        />
        <AdmissionTable requests={requests} />
        <Pagination
          totalPages={totalPages}
          currentPage={page}
          totalItems={totalDocs}
          pageSize={limit}
          showWhenSinglePage={totalDocs > 0}
        />
      </div>
    </div>
  );
}
