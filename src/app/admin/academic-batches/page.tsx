import { isValidObjectId } from "mongoose";

import { WebsiteBatchCreateButton, WebsiteBatchesGrid, type WebsiteBatchRow } from "@/components/admin/grids/WebsiteBatchesGrid";
import { PageHeading } from "@/components/admin/sa/ui";
import { serializeWebsiteBatch } from "@/lib/grid/sources/content";
import { websiteBatchTiles } from "@/lib/grid/tiles-content";
import { connectDB } from "@/lib/mongodb";
import AcademicBatch from "@/models/AcademicBatch";
import Teacher from "@/models/Teacher";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function teacherOptions() {
  await connectDB();
  const teachers = await Teacher.find({})
    .sort({ name: 1 })
    .select("name subject designation")
    .lean<{ _id: unknown; name: string; subject?: string; designation?: string }[]>();
  return teachers.map((teacher) => ({
    _id: String(teacher._id),
    name: teacher.name,
    subject: teacher.subject ?? "",
    designation: teacher.designation ?? "",
  }));
}

/** A batch that was just created opens its schedule straight away. */
async function routineBatch(id: string): Promise<WebsiteBatchRow | null> {
  if (!id || !isValidObjectId(id)) return null;
  await connectDB();
  const batch = await AcademicBatch.findById(id).lean<Record<string, unknown>>();
  return batch ? serializeWebsiteBatch(batch) : null;
}

export default async function AcademicBatchesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const openRoutine = Array.isArray(params.openRoutine) ? params.openRoutine[0] ?? "" : params.openRoutine ?? "";
  const [tiles, teachers, routine] = await Promise.all([websiteBatchTiles(), teacherOptions(), routineBatch(openRoutine)]);

  return (
    <div>
      <PageHeading
        title="Academic Batch Management"
        description="Manage internal batches, schedules, and seat capacity."
        actions={<WebsiteBatchCreateButton />}
      />
      <WebsiteBatchesGrid tiles={tiles} teachers={teachers} openRoutine={routine} />
    </div>
  );
}
