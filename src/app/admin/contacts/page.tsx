import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { connectDB } from "@/lib/mongodb";
import ContactRequest from "@/models/ContactRequest";
import { ContactFilters } from "@/components/admin/contacts/ContactFilters";
import { ContactTable } from "@/components/admin/contacts/ContactTable";
import { Pagination } from "@/components/admin/shared/Pagination";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getParam(params: Record<string, string | string[] | undefined>, key: string, fallback = "") {
  const value = params[key];
  if (Array.isArray(value)) return value[0] ?? fallback;
  return value ?? fallback;
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export default async function AdminContactsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const q = getParam(params, "q").trim().slice(0, 100);
  const rawStatus = getParam(params, "status", "all").trim();
  const status = ["new", "contacted", "closed", "spam"].includes(rawStatus) ? rawStatus : "all";
  const sort = getParam(params, "sort") === "asc" ? "asc" : "desc";
  const rawDateRange = getParam(params, "dateRange", "all").trim();
  const dateRange = ["today", "week", "month"].includes(rawDateRange) ? rawDateRange : "all";
  const requestedPage = Math.max(1, Math.trunc(Number(getParam(params, "page", "1"))) || 1);
  const limit = 10;

  const query: Record<string, unknown> = {};
  if (q) {
    const regex = { $regex: escapeRegex(q), $options: "i" };
    query.$or = [
      { name: regex },
      { phone: regex },
    ];
  }
  if (status !== "all") query.status = status;

  if (dateRange !== "all") {
    const now = new Date();
    const start = new Date();
    if (dateRange === "today") start.setHours(0, 0, 0, 0);
    else if (dateRange === "week") start.setDate(now.getDate() - 7);
    else if (dateRange === "month") start.setDate(now.getDate() - 30);
    query.createdAt = { $gte: start };
  }

  await connectDB();
  const totalDocs = await ContactRequest.countDocuments(query);
  const totalPages = Math.max(1, Math.ceil(totalDocs / limit));
  const page = Math.min(requestedPage, totalPages);
  
  const rawRequests = await ContactRequest.find(query)
    .sort({ createdAt: sort === "asc" ? 1 : -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();
  const requests = JSON.parse(JSON.stringify(rawRequests));

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Contact Messages"
        description="Review and follow up on messages submitted through the homepage contact form."
      />

      <ContactFilters
        key={[q, status, sort, dateRange].join("|")}
        q={q}
        status={status}
        sort={sort}
        dateRange={dateRange}
      />
      
      <ContactTable requests={requests} />

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
