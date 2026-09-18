import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AssessmentManager } from "@/components/admin/assessments/AssessmentManager";
import { Pagination } from "@/components/admin/shared/Pagination";
import {
  boundedAdminSearch,
  clampAdminPage,
  escapeAdminRegex,
  getAdminParam,
  parseAdminPage,
  pickAdminSort,
} from "@/lib/admin-query";
import { connectDB } from "@/lib/mongodb";
import ModelTest from "@/models/ModelTest";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const PAGE_SIZE = 20;
const statuses = new Set(["draft", "published", "hidden", "archived"]);
const sortOptions: Record<string, Record<string, 1 | -1>> = {
  order: { order: 1, createdAt: -1 },
  newest: { createdAt: -1 },
  title: { title: 1, createdAt: -1 },
  startDate: { startDate: 1, createdAt: -1 },
};

export default async function AdminModelTestsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const q = boundedAdminSearch(getAdminParam(params, "q"));
  const status = getAdminParam(params, "status");
  const classLevel = getAdminParam(params, "classLevel");
  const sort = getAdminParam(params, "sort", "order");
  const requestedPage = parseAdminPage(getAdminParam(params, "page"));
  const filter: Record<string, unknown> = {};

  if (q) {
    const regex = new RegExp(escapeAdminRegex(q), "i");
    filter.$or = [{ title: regex }, { slug: regex }, { schoolFocus: regex }];
  }
  if (statuses.has(status)) filter.status = status;
  const parsedClass = Number(classLevel);
  if (Number.isInteger(parsedClass) && parsedClass >= 4 && parsedClass <= 12) {
    filter.classLevels = parsedClass;
  }

  await connectDB();
  const total = await ModelTest.countDocuments(filter);
  const { page, totalPages } = clampAdminPage(requestedPage, total, PAGE_SIZE);
  const items = await ModelTest.find(filter)
    .select("title slug image classLevels version schoolFocus startDate endDate routineTitle routineSubtitle scheduleNote fees classSpecificInfo features status featured order")
    .sort(pickAdminSort(sort, sortOptions, "order"))
    .skip((page - 1) * PAGE_SIZE)
    .limit(PAGE_SIZE)
    .lean();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Model Tests"
        description="Manage scheduled model tests by class, subject, school focus, fees, and solve class."
      />
      <AssessmentManager
        type="modelTest"
        items={JSON.parse(JSON.stringify(items))}
        filters={{ q, status, classLevel, sort }}
      />
      <Pagination totalPages={totalPages} currentPage={page} totalItems={total} pageSize={PAGE_SIZE} showWhenSinglePage />
    </div>
  );
}
