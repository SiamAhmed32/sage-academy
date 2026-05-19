import { StudentNoticeBoard } from "@/components/student/StudentNoticeBoard";
import { StudentPageHeader } from "@/components/student/StudentPageHeader";
import { getStudentNotices } from "@/lib/student-dashboard";

export default async function StudentNoticesPage() {
  const data = await getStudentNotices(30);
  if ("problem" in data) return null;

  return (
    <section className="space-y-5">
      <StudentPageHeader
        title="নোটিশ ও পরীক্ষা"
        description="আপনার ব্যাচের জন্য পাঠানো আপডেট এখানে দেখুন।"
      />
      <StudentNoticeBoard
        notices={data.notices}
        studentBatchCode={data.student.batch?.batchCode}
      />
    </section>
  );
}
