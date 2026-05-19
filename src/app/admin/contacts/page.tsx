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

export default async function AdminContactsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const q = getParam(params, "q").trim();
  const status = getParam(params, "status", "all").trim();
  const sort = getParam(params, "sort", "desc").trim();
  const dateRange = getParam(params, "dateRange", "all").trim();
  const page = Number(getParam(params, "page", "1"));
  const limit = 10;

  const query: any = {};
  if (q) {
    query.$or = [
      { name: { $regex: q, $options: "i" } },
      { phone: { $regex: q, $options: "i" } },
    ];
  }
  if (status !== "all") query.status = status;

  if (dateRange !== "all") {
    const now = new Date();
    const start = new Date();
    if (dateRange === "today") start.setHours(0, 0, 0, 0);
    else if (dateRange === "week") start.setDate(now.getDate() - 7);
    else if (dateRange === "month") start.setMonth(now.getMonth() - 1);
    query.createdAt = { $gte: start };
  }

  await connectDB();
  const totalDocs = await ContactRequest.countDocuments(query);
  const totalPages = Math.ceil(totalDocs / limit);
  
  const requests = await ContactRequest.find(query)
    .sort({ createdAt: sort === "asc" ? 1 : -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="যোগাযোগ বার্তা"
        description="হোমপেজের ছোট contact form থেকে আসা বার্তাগুলো এখানে follow-up হবে।"
      />

      <ContactFilters q={q} status={status} sort={sort} />
      
      <ContactTable requests={requests} />

      <Pagination totalPages={totalPages} currentPage={page} />
    </div>
  );
}
