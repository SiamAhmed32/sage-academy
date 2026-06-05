import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AssessmentRegistrationFilters } from "@/components/admin/assessments/AssessmentRegistrationFilters";
import { AssessmentRegistrationTable } from "@/components/admin/assessments/AssessmentRegistrationTable";
import { Pagination } from "@/components/admin/shared/Pagination";
import { buildAssessmentRegistrationFilter } from "@/lib/admin-assessment-registration-query";
import { connectDB } from "@/lib/mongodb";
import AssessmentRegistration from "@/models/AssessmentRegistration";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const PAGE_SIZE_OPTIONS = [25, 50, 100] as const;

function getParam(params: Record<string, string | string[] | undefined>, key: string, fallback = "") {
  const value = params[key];
  if (Array.isArray(value)) return value[0] ?? fallback;
  return value ?? fallback;
}

function parseLimit(raw: string): number {
  const n = Number(raw);
  return PAGE_SIZE_OPTIONS.includes(n as (typeof PAGE_SIZE_OPTIONS)[number]) ? n : 25;
}

export default async function AdminAssessmentRegistrationsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const q = getParam(params, "q").trim();
  const status = getParam(params, "status", "all").trim();
  const assessmentKind = getParam(params, "assessmentKind", "all").trim();
  const assessmentType = getParam(params, "assessmentType", "all").trim();
  const classLabel = getParam(params, "classLabel", "all").trim();
  const applicantType = getParam(params, "applicantType", "all").trim();
  const sort = getParam(params, "sort", "desc").trim();
  const dateRange = getParam(params, "dateRange", "all").trim();
  const page = Math.max(1, Number(getParam(params, "page", "1")) || 1);
  const limit = parseLimit(getParam(params, "limit", "25"));
  const query = buildAssessmentRegistrationFilter({
    q,
    status,
    assessmentKind,
    assessmentType,
    classLabel,
    applicantType,
    dateRange,
  });

  await connectDB();
  const totalDocs = await AssessmentRegistration.countDocuments(query);
  const totalPages = Math.max(1, Math.ceil(totalDocs / limit));
  const safePage = Math.min(page, totalPages);
  const [items, assessmentTypes, classLabels] = await Promise.all([
    AssessmentRegistration.find(query)
      .sort({ createdAt: sort === "asc" ? 1 : -1 })
      .skip((safePage - 1) * limit)
      .limit(limit)
      .lean(),
    AssessmentRegistration.distinct("assessmentType"),
    AssessmentRegistration.distinct("classLabel"),
  ]);

  const from = totalDocs === 0 ? 0 : (safePage - 1) * limit + 1;
  const to = Math.min(safePage * limit, totalDocs);
  const filterKey = [q, status, assessmentKind, assessmentType, classLabel, applicantType, sort, dateRange, safePage, limit].join("|");

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="মডেল টেস্ট / Exam রেজিস্ট্রেশন"
        description="মডেল টেস্ট ও exam রেজিস্ট্রেশন আলাদা লিড হিসেবে ফলোআপ করুন।"
      />

      <div className="flex flex-col gap-3 rounded-2xl border border-sage-border bg-white px-5 py-4 shadow-sm sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4 md:px-6 md:py-5">
        <div className="text-base font-semibold leading-snug text-sage-secondary md:text-lg">
          <span className="font-black text-sage-primary">{totalDocs.toLocaleString("bn-BD")}</span> টি মোট রেজিস্ট্রেশন
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
      </div>

      <AssessmentRegistrationFilters
        key={`filters-${filterKey}`}
        q={q}
        status={status}
        assessmentKind={assessmentKind}
        assessmentType={assessmentType}
        classLabel={classLabel}
        applicantType={applicantType}
        sort={sort}
        dateRange={dateRange}
        limit={limit}
        pageSizeOptions={[...PAGE_SIZE_OPTIONS]}
        assessmentTypes={(assessmentTypes as string[]).filter(Boolean).sort((a, b) => a.localeCompare(b))}
        classLabels={(classLabels as string[]).filter(Boolean).sort((a, b) => a.localeCompare(b, "bn"))}
      />

      <AssessmentRegistrationTable key={`table-${filterKey}`} initialItems={JSON.parse(JSON.stringify(items))} />

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
