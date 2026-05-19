import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminNoticeTable } from "@/components/admin/notices/AdminNoticeTable";
import { NoticeCreatePanel } from "@/components/admin/notices/NoticeCreatePanel";
import { NoticeFilters } from "@/components/admin/notices/NoticeFilters";
import type { NoticeBatchOption } from "@/components/admin/notices/NoticeCreateForm";
import { Pagination } from "@/components/admin/shared/Pagination";
import { fetchAdminNotices } from "@/lib/admin-notices";
import { connectDB } from "@/lib/mongodb";
import AcademicBatch from "@/models/AcademicBatch";
import Student from "@/models/Student";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getParam(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default async function AdminNoticesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const q = getParam(params, "q");
  const type = getParam(params, "type");
  const classLevel = getParam(params, "classLevel");
  const batch = getParam(params, "batch");
  const status = getParam(params, "status");
  const page = getParam(params, "page");

  await connectDB();
  const [batchResult, noticeResult, studentCounts] = await Promise.all([
    AcademicBatch.find({ isActive: true }).select("title batchCode classLevel").sort({ classLevel: 1, title: 1 }).lean(),
    fetchAdminNotices({ q, type, classLevel, batch, status, page }),
    Student.aggregate<{ _id: unknown; count: number }>([
      { $match: { isActive: true, batch: { $ne: null } } },
      { $group: { _id: "$batch", count: { $sum: 1 } } },
    ]),
  ]);

  const countMap = new Map(studentCounts.map((row) => [String(row._id), row.count]));
  const batchOptions: NoticeBatchOption[] = JSON.parse(JSON.stringify(batchResult)).map(
    (item: { _id: string; title: string; batchCode?: string; classLevel: number }) => ({
      ...item,
      studentCount: countMap.get(String(item._id)) ?? 0,
    })
  );

  return (
    <div>
      <AdminPageHeader
        title="নোটিশ ম্যানেজমেন্ট"
        description="শ্রেণি ও ব্যাচ বেছে নোটিশ পাঠান — শুধুমাত্র ওই ব্যাচে ভর্তি শিক্ষার্থীরা দেখবে।"
      />

      <NoticeCreatePanel batches={batchOptions} />
      <NoticeFilters
        q={q}
        type={type}
        classLevel={classLevel}
        batch={batch}
        status={status}
        batches={batchOptions}
      />
      <AdminNoticeTable notices={noticeResult.notices} batches={batchOptions} />
      <Pagination
        totalPages={noticeResult.totalPages}
        currentPage={noticeResult.page}
        totalItems={noticeResult.total}
        pageSize={noticeResult.pageSize}
        showWhenSinglePage
      />
    </div>
  );
}
