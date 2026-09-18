import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { connectDB } from "@/lib/mongodb";
import AcademicBatch from "@/models/AcademicBatch";
import Teacher from "@/models/Teacher";
import { BatchCreateButton } from "@/components/admin/batches/BatchCreateButton";
import { BatchFilters } from "@/components/admin/batches/BatchFilters";
import { BatchTable } from "@/components/admin/batches/BatchTable";
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

const validClassLevels = ["5", "6", "7", "8", "9", "10", "11", "12"];
const PAGE_SIZE = 12;
const MAX_SEARCH_LENGTH = 80;
const SORT_OPTIONS: Record<string, Record<string, 1 | -1>> = {
  default: { createdAt: -1 },
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  class_asc: { classLevel: 1, title: 1 },
  title_asc: { title: 1 },
  title_desc: { title: -1 },
};

export default async function AcademicBatchesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const q = getParam(params, "q").trim().slice(0, MAX_SEARCH_LENGTH);
  const classLevel = getParam(params, "classLevel").trim();
  const genderGroup = getParam(params, "genderGroup", "all").trim().toLowerCase();
  const status = getParam(params, "status", "all").trim().toLowerCase();
  const sort = getParam(params, "sort", "default");
  const requestedPage = Number.parseInt(getParam(params, "page", "1"), 10);

  const query: Record<string, unknown> = {};

  if (q) {
    const safe = escapeRegex(q);
    query.$or = [
      { title: { $regex: safe, $options: "i" } },
      { batchCode: { $regex: safe, $options: "i" } },
    ];
  }
  if (validClassLevels.includes(classLevel)) query.classLevel = Number(classLevel);
  if (["male", "female", "combined"].includes(genderGroup)) query.genderGroup = genderGroup;
  
  if (status === "archived") {
    query.isArchived = true;
  } else {
    query.isArchived = { $ne: true };
    if (status === "active") query.isActive = true;
    if (status === "inactive") query.isActive = false;
  }

  await connectDB();
  const [total, teachers] = await Promise.all([
    AcademicBatch.countDocuments(query),
    Teacher.find({}).sort({ name: 1 }).select("name subject designation").lean(),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(
    Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1,
    totalPages
  );
  const batches = await AcademicBatch.find(query)
    .sort(SORT_OPTIONS[sort] ?? SORT_OPTIONS.default)
    .skip((page - 1) * PAGE_SIZE)
    .limit(PAGE_SIZE)
    .lean();

  const teacherOptions = teachers.map((teacher) => ({
    _id: teacher._id.toString(),
    name: teacher.name,
    subject: teacher.subject ?? "",
    designation: teacher.designation ?? "",
  }));

  return (
    <div>
      <AdminPageHeader
        title="Academic Batch Management"
        description="Manage internal batches, schedules, and seat capacity."
      />

      <BatchCreateButton />
      
      <BatchFilters
        q={q}
        classLevel={classLevel}
        genderGroup={genderGroup}
        status={status}
        sort={SORT_OPTIONS[sort] ? sort : "default"}
      />
      
      <BatchTable batches={JSON.parse(JSON.stringify(batches))} teachers={teacherOptions} />
      <Pagination
        totalPages={totalPages}
        currentPage={page}
        totalItems={total}
        pageSize={PAGE_SIZE}
        showWhenSinglePage
      />
    </div>
  );
}
