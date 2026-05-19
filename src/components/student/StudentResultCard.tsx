import { FileCheck2 } from "lucide-react";

export function StudentResultCard() {
  return (
    <section className="rounded-xl border border-sage-border bg-white p-5 shadow-sm sm:p-6">
      <header className="flex items-center gap-3">
        <span className="rounded-xl bg-sage-red-50 p-3 text-sage-primary">
          <FileCheck2 className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-xl font-bold text-sage-secondary">রেজাল্ট</h2>
          <p className="mt-1 text-sm text-sage-gray-500">পরীক্ষার ফলাফল প্রকাশ হলে এখানে দেখাবে।</p>
        </div>
      </header>

      <p className="mt-5 rounded-xl border border-dashed border-sage-border p-8 text-center text-sm font-semibold text-sage-gray-500">
        এখনো কোনো রেজাল্ট প্রকাশ করা হয়নি। ফলাফল আপলোড হলে এই পেজে স্বয়ংক্রিয়ভাবে দেখা যাবে।
      </p>
    </section>
  );
}
