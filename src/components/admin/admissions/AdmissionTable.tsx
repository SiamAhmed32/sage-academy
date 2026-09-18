"use client";

import { useRouter } from "next/navigation";
import { AdmissionTableRow } from "./AdmissionTableRow";
import type { AdmissionRequestItem } from "./types";

interface AdmissionTableProps {
  requests: AdmissionRequestItem[];
}

export function AdmissionTable({ requests }: AdmissionTableProps) {
  const router = useRouter();
  const hasData = requests.length > 0;

  function handleView(id: string) {
    router.push(`/admin/admissions/${id}`);
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className={`w-full ${hasData ? 'overflow-x-auto scrollbar-thin scrollbar-thumb-gray-200' : ''}`}>
        <table className={`w-full text-left text-sm border-collapse ${hasData ? 'min-w-[1150px]' : ''}`}>
          <thead className="bg-gray-50 text-xs font-bold uppercase tracking-wide text-gray-500">
            <tr className="border-b border-gray-200">
              <th className="p-4">Applicant</th>
              <th className="p-4">Class</th>
              <th className="p-4">Type</th>
              <th className="p-4">Phone</th>
              <th className="p-4">Date</th>
              <th className="p-4">Comments</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {hasData ? (
              requests.map((item) => (
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
                    <p className="text-lg font-bold text-gray-900">No applications found</p>
                    <p className="text-sm font-semibold text-gray-400">
                      Adjust the search or filters and try again.
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
