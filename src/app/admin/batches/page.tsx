import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { BatchCreateButton } from "@/components/admin/batches/BatchCreateButton";
import { BatchFilters } from "@/components/admin/batches/BatchFilters";
import { BatchTable } from "@/components/admin/batches/BatchTable";
import { connectDB } from "@/lib/mongodb";
import AcademicBatch from "@/models/AcademicBatch";
import Teacher from "@/models/Teacher";

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

export default async function AdminBatchesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const q = getParam(params, "q").trim();
  const classLevel = getParam(params, "classLevel").trim();
  const genderGroup = getParam(params, "genderGroup", "all").trim().toLowerCase();
  const status = getParam(params, "status", "all").trim().toLowerCase();

  const query: Record<string, unknown> = {};

  if (q) {
    const safe = escapeRegex(q);
    query.$or = [
      { title: { $regex: safe, $options: "i" } },
      { slug: { $regex: safe, $options: "i" } },
      { batchCode: { $regex: safe, $options: "i" } },
      { shift: { $regex: safe, $options: "i" } },
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
  const [batches, teachers] = await Promise.all([
    AcademicBatch.find(query).sort({ order: 1, createdAt: -1 }).lean(),
    Teacher.find({}).sort({ order: 1, name: 1 }).select("name subject designation").lean(),
  ]);
  const teacherOptions = teachers.map((teacher) => ({
    _id: teacher._id.toString(),
    name: teacher.name,
    subject: teacher.subject ?? "",
    designation: teacher.designation ?? "",
  }));

  return (
    <div>
      <AdminPageHeader
        title="ব্যাচ ম্যানেজমেন্ট"
        description="ব্যাচ তৈরি, খোঁজা, ফিল্টার, এডিট ও আর্কাইভ এখান থেকেই নিয়ন্ত্রণ করুন।"
      />

      <BatchCreateButton />
      <BatchFilters q={q} classLevel={classLevel} genderGroup={genderGroup} status={status} />
      <BatchTable batches={JSON.parse(JSON.stringify(batches))} teachers={teacherOptions} />
    </div>
  );
}

