import { Metadata } from "next";
import Link from "next/link";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { connectDB } from "@/lib/mongodb";
import Class from "@/models/Class";
import BatchGroup from "@/models/BatchGroup";
import SubjectBatch from "@/models/SubjectBatch";
import { createBatchGroupAction } from "@/app/admin/actions/academic-structure";
import type { ClassRow, BatchGroupRow } from "@/components/admin/academic-structure/types";

export const metadata: Metadata = { title: "Batch Groups | SAGE Admin" };
export const dynamic = "force-dynamic";

export default async function BatchGroupsPage() {
  await connectDB();
  const classes = await Class.find().sort({ orderIndex: 1, name: 1 }).lean();
  const groups = await BatchGroup.find({ isArchived: { $ne: true } })
    .populate("classId", "name")
    .sort({ createdAt: -1 })
    .lean();

  const classRows: ClassRow[] = JSON.parse(JSON.stringify(classes));
  const groupRows: BatchGroupRow[] = JSON.parse(JSON.stringify(groups));

  const slotCounts: Array<{ _id: string; count: number }> = await SubjectBatch.aggregate([
    { $match: { batchGroupId: { $in: groupRows.map((g) => g._id) } } },
    { $group: { _id: "$batchGroupId", count: { $sum: 1 } } },
  ]);
  const slotCountMap = new Map(slotCounts.map((s) => [String(s._id), s.count]));

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <AdminPageHeader
        title="Batch Groups"
        description="The umbrella cohort a student is admitted into: class + gender + medium + section. Subjects are added as separate slots after creating the group."
      />

      {classRows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-sage-border bg-white p-6 text-sm text-sage-gray-500">
          Create a class first before adding batch groups.
        </div>
      ) : (
        <form action={createBatchGroupAction} className="flex flex-wrap items-end gap-3 rounded-xl border border-sage-border bg-white p-4">
          <div className="grid gap-1">
            <label className="text-xs font-bold text-sage-secondary">Name</label>
            <input name="name" required placeholder="Class 7 - Boys - Bangla - Batch 1" className="h-10 w-72 rounded-lg border border-sage-border px-3 text-sm" />
          </div>
          <div className="grid gap-1">
            <label className="text-xs font-bold text-sage-secondary">Class</label>
            <select name="classId" required className="h-10 w-40 rounded-lg border border-sage-border px-3 text-sm">
              {classRows.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="grid gap-1">
            <label className="text-xs font-bold text-sage-secondary">Gender</label>
            <select name="gender" required className="h-10 w-32 rounded-lg border border-sage-border px-3 text-sm">
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="COMBINED">Combined</option>
            </select>
          </div>
          <div className="grid gap-1">
            <label className="text-xs font-bold text-sage-secondary">Medium</label>
            <select name="medium" required className="h-10 w-32 rounded-lg border border-sage-border px-3 text-sm">
              <option value="BANGLA">Bangla</option>
              <option value="ENGLISH">English</option>
            </select>
          </div>
          <div className="grid gap-1">
            <label className="text-xs font-bold text-sage-secondary">Batch #</label>
            <input name="batchNumber" type="number" min={1} defaultValue={1} className="h-10 w-24 rounded-lg border border-sage-border px-3 text-sm" />
          </div>
          <button type="submit" className="h-10 rounded-lg bg-sage-primary px-4 text-sm font-bold text-white">
            Create batch group
          </button>
        </form>
      )}

      <div className="overflow-hidden rounded-xl border border-sage-border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-sage-red-50/40 text-xs font-black uppercase tracking-wide text-sage-secondary">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Class</th>
              <th className="px-4 py-3">Gender</th>
              <th className="px-4 py-3">Medium</th>
              <th className="px-4 py-3">Batch #</th>
              <th className="px-4 py-3">Subject slots</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {groupRows.map((g) => (
              <tr key={g._id} className="border-t border-sage-border">
                <td className="px-4 py-3 font-bold text-sage-secondary">{g.name}</td>
                <td className="px-4 py-3">{g.classId?.name ?? "—"}</td>
                <td className="px-4 py-3">{g.gender}</td>
                <td className="px-4 py-3">{g.medium}</td>
                <td className="px-4 py-3">{g.batchNumber}</td>
                <td className="px-4 py-3">{slotCountMap.get(String(g._id)) ?? 0}</td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/academic-structure/batch-groups/${g._id}`}
                    className="text-xs font-bold text-sage-primary hover:underline"
                  >
                    Manage subjects →
                  </Link>
                </td>
              </tr>
            ))}
            {groupRows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-sage-gray-400">
                  No batch groups yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
