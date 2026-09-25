import { NoticeCreateButton, NoticesGrid } from "@/components/admin/grids/NoticesGrid";
import type { NoticeBatchOption } from "@/components/admin/notices/NoticeCreateForm";
import { PageHeading } from "@/components/admin/sa/ui";
import { batchStudentCounts } from "@/lib/academy/queries";
import { noticeTiles } from "@/lib/grid/tiles-content";
import { connectDB } from "@/lib/mongodb";
import AcademyBatch from "@/models/academy/AcademyBatch";

/** Notices target the new academy batches; students are counted from active enrollments. */
async function noticeBatchOptions(): Promise<NoticeBatchOption[]> {
  await connectDB();
  const batches = await AcademyBatch.find({ status: "active" })
    .select("code classLevel")
    .sort({ classLevel: 1, code: 1 })
    .lean<{ _id: unknown; code: string; classLevel: number }[]>();
  const counts = await batchStudentCounts(batches.map((batch) => String(batch._id)));
  return batches.map((batch) => ({
    _id: String(batch._id),
    title: batch.code,
    batchCode: batch.code,
    classLevel: batch.classLevel,
    studentCount: counts.get(String(batch._id)) ?? 0,
  }));
}

export default async function AdminNoticesPage() {
  const [tiles, batches] = await Promise.all([noticeTiles(), noticeBatchOptions()]);

  return (
    <div>
      <PageHeading
        title="Notice Management"
        description="Send notices to a class and batch so only enrolled students in that batch can view them."
        actions={<NoticeCreateButton batches={batches} />}
      />
      <NoticesGrid tiles={tiles} batches={batches} />
    </div>
  );
}
