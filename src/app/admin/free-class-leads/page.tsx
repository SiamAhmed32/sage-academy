import Link from "next/link";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Pagination } from "@/components/admin/shared/Pagination";
import { FreeClassLeadFilters } from "@/components/admin/free-class-leads/FreeClassLeadFilters";
import { FreeClassLeadTable } from "@/components/admin/free-class-leads/FreeClassLeadTable";
import { buildFreeClassLeadFilter } from "@/lib/admin-free-class-lead-query";
import { connectDB } from "@/lib/mongodb";
import FreeClassLead from "@/models/FreeClassLead";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getParam(params: Record<string, string | string[] | undefined>, key: string, fallback = "") {
  const value = params[key];
  if (Array.isArray(value)) return value[0] ?? fallback;
  return value ?? fallback;
}

const PAGE_SIZE_OPTIONS = [25, 50, 100] as const;

function parseLimit(raw: string): number {
  const n = Number(raw);
  return PAGE_SIZE_OPTIONS.includes(n as (typeof PAGE_SIZE_OPTIONS)[number]) ? n : 25;
}

export default async function AdminFreeClassLeadsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const q = getParam(params, "q").trim();
  const status = getParam(params, "status", "all").trim();
  const source = getParam(params, "source", "all").trim();
  const classLabel = getParam(params, "classLabel", "all").trim();
  const sort = getParam(params, "sort", "desc").trim();
  const dateRange = getParam(params, "dateRange", "all").trim();
  const page = Math.max(1, Number(getParam(params, "page", "1")) || 1);
  const limit = parseLimit(getParam(params, "limit", "25"));

  const query = buildFreeClassLeadFilter({ q, status, source, classLabel, dateRange });

  await connectDB();
  const totalDocs = await FreeClassLead.countDocuments(query);
  const totalPages = Math.max(1, Math.ceil(totalDocs / limit));
  const safePage = Math.min(page, totalPages);

  const leads = await FreeClassLead.find(query)
    .sort({ createdAt: sort === "asc" ? 1 : -1 })
    .skip((safePage - 1) * limit)
    .limit(limit)
    .lean();

  const exportQuery = new URLSearchParams();
  if (q) exportQuery.set("q", q);
  if (status !== "all") exportQuery.set("status", status);
  if (source !== "all") exportQuery.set("source", source);
  if (classLabel !== "all") exportQuery.set("classLabel", classLabel);
  if (sort !== "desc") exportQuery.set("sort", sort);
  if (dateRange !== "all") exportQuery.set("dateRange", dateRange);

  const from = totalDocs === 0 ? 0 : (safePage - 1) * limit + 1;
  const to = Math.min(safePage * limit, totalDocs);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="ফ্রি ক্লাস লিড"
        description="হোমপেজের ফ্রি ক্লাস নিবন্ধন। ফিল্টার, পেজিনেশন ও CSV এক্সপোর্ট—হাজার হাজার লিডও নিয়ন্ত্রণে।"
      />

      <div className="flex flex-col gap-3 rounded-2xl border border-sage-border bg-white px-5 py-4 shadow-sm sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4 md:px-6 md:py-5">
        <div className="text-base font-semibold leading-snug text-sage-secondary md:text-lg">
          <span className="font-black text-sage-primary">{totalDocs.toLocaleString("bn-BD")}</span> টি মোট রেকর্ড
          {totalDocs > 0 ? (
            <span className="mt-1 block text-sm font-medium text-sage-gray-600 sm:mt-0 sm:inline sm:before:content-['_·_']">
              দেখানো হচ্ছে{" "}
              <span className="font-bold text-sage-secondary">
                {from.toLocaleString("bn-BD")}–{to.toLocaleString("bn-BD")}
              </span>{" "}
              (পৃষ্ঠা {safePage.toLocaleString("bn-BD")}/{totalPages.toLocaleString("bn-BD")})
            </span>
          ) : null}
        </div>
        <Link
          href={`/api/admin/free-class-leads/export?${exportQuery.toString()}`}
          className="inline-flex h-12 shrink-0 items-center justify-center rounded-xl border border-sage-border bg-sage-red-50 px-5 text-base font-bold text-sage-secondary transition hover:border-sage-primary hover:bg-sage-primary hover:text-white"
        >
          CSV এক্সপোর্ট
        </Link>
      </div>

      <FreeClassLeadFilters
        q={q}
        status={status}
        source={source}
        classLabel={classLabel}
        sort={sort}
        dateRange={dateRange}
        limit={limit}
        pageSizeOptions={[...PAGE_SIZE_OPTIONS]}
      />

      <FreeClassLeadTable initialLeads={JSON.parse(JSON.stringify(leads))} />

      <Pagination
        totalPages={totalPages}
        currentPage={safePage}
        totalItems={totalDocs}
        pageSize={limit}
        showWhenSinglePage={totalDocs > 0}
      />
    </div>
  );
}
