"use client";

import { useRouter } from "next/navigation";
import { AdmissionTableRow } from "./AdmissionTableRow";

interface AdmissionTableProps {
  requests: any[];
}

export function AdmissionTable({ requests }: AdmissionTableProps) {
  const router = useRouter();
  const hasData = requests.length > 0;

  function handleView(id: string) {
    router.push(`/admin/admissions/${id}`);
  }

  return (
    <div className="rounded-xl border border-sage-border bg-white shadow-sm overflow-hidden">
      <div className={`w-full ${hasData ? 'overflow-x-auto scrollbar-thin scrollbar-thumb-sage-red-100' : ''}`}>
        <table className={`w-full text-left text-sm border-collapse ${hasData ? 'min-w-[1150px]' : ''}`}>
          <thead className="bg-sage-red-50 text-sage-secondary">
            <tr className="border-b border-sage-border">
              <th className="p-4 font-bold">আবেদনকারী</th>
              <th className="p-4 font-bold">শ্রেণি</th>
              <th className="p-4 font-bold">টাইপ</th>
              <th className="p-4 font-bold">মোবাইল</th>
              <th className="p-4 font-bold">তারিখ</th>
              <th className="p-4 font-bold">মন্তব্য (Comments)</th>
              <th className="p-4 font-bold">স্ট্যাটাস</th>
              <th className="p-4 text-right font-bold">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sage-border">
            {hasData ? (
              requests.map((item: any) => (
                <AdmissionTableRow
                  key={item._id}
                  item={item}
                  onView={handleView}
                />
              ))
            ) : (
              <tr>
                <td colSpan={8} className="py-40 px-10 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 py-6">
                    <p className="text-lg font-bold text-sage-secondary">কোনো আবেদনপত্র পাওয়া যায়নি</p>
                    <p className="text-sm font-semibold text-sage-gray-400">
                      আপনার সার্চ বা ফিল্টার পরিবর্তন করে পুনরায় চেষ্টা করুন।
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
