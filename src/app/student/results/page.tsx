import { StudentPageHeader } from "@/components/student/StudentPageHeader";
import { StudentResultCard } from "@/components/student/StudentResultCard";

export default function StudentResultsPage() {
  return (
    <section className="space-y-6">
      <StudentPageHeader
        title="ফলাফল"
        description="পরীক্ষার ফলাফল প্রকাশ হলে এখানে দেখতে পারবেন। এখনো কোনো ফলাফল প্রকাশ করা হয়নি।"
      />
      <StudentResultCard />
    </section>
  );
}
