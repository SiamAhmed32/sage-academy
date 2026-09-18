import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { connectDB } from "@/lib/mongodb";
import BatchGroup from "@/models/BatchGroup";
import Subject from "@/models/Subject";
import SubjectBatch from "@/models/SubjectBatch";
import Teacher from "@/models/Teacher";
import Enrollment from "@/models/Enrollment";
import { addSubjectBatchAction } from "@/app/admin/actions/academic-structure";
import type { BatchGroupRow, SubjectBatchRow } from "@/components/admin/academic-structure/types";
import { formatAdminCurrency } from "@/lib/admin-format";

type SubjectOptionRow = { _id: string; name: string; baseMonthlyFee: number };
type TeacherOptionRow = { _id: string; name: string };

export const metadata: Metadata = { title: "Batch Group | SAGE Admin" };
export const dynamic = "force-dynamic";

export default async function BatchGroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await connectDB();

  const groupDoc = await BatchGroup.findById(id).populate("classId", "name").lean();
  if (!groupDoc) notFound();
  const group = groupDoc as unknown as { _id: unknown; classId: { _id: string; name: string } };

  const subjects = await Subject.find({ classId: group.classId._id }).sort({ name: 1 }).lean();
  const teachers = await Teacher.find().sort({ name: 1 }).lean();
  const slots = await SubjectBatch.find({ batchGroupId: id })
    .populate("subjectId", "name code baseMonthlyFee")
    .populate("teacherId", "name")
    .sort({ createdAt: 1 })
    .lean();

  const slotIds = slots.map((s) => s._id);
  const seatCounts: Array<{ _id: string; count: number }> = slotIds.length
    ? await Enrollment.aggregate([
        { $match: { subjectBatchId: { $in: slotIds }, status: "ACTIVE" } },
        { $group: { _id: "$subjectBatchId", count: { $sum: 1 } } },
      ])
    : [];
  const seatMap = new Map(seatCounts.map((s) => [String(s._id), s.count]));

  const groupData: BatchGroupRow = JSON.parse(JSON.stringify(group));
  const subjectRows: SubjectOptionRow[] = JSON.parse(JSON.stringify(subjects));
  const teacherRows: TeacherOptionRow[] = JSON.parse(JSON.stringify(teachers));
  const slotRows: SubjectBatchRow[] = JSON.parse(JSON.stringify(slots));

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <Link href="/admin/academic-structure/batch-groups" className="inline-flex items-center gap-1 text-sm font-bold text-sage-gray-500 hover:text-sage-primary">
        <ChevronLeft size={16} /> Back to batch groups
      </Link>

      <AdminPageHeader
        title={groupData.name}
        description={`${groupData.classId?.name ?? ""} · ${groupData.gender} · ${groupData.medium} · Batch ${groupData.batchNumber}`}
      />

      {subjectRows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-sage-border bg-white p-6 text-sm text-sage-gray-500">
          No subjects exist for this class yet. Add subjects for {groupData.classId?.name} first.
        </div>
      ) : (
        <form action={addSubjectBatchAction} className="flex flex-wrap items-end gap-3 rounded-xl border border-sage-border bg-white p-4">
          <input type="hidden" name="batchGroupId" value={groupData._id} />
          <div className="grid gap-1">
            <label className="text-xs font-bold text-sage-secondary">Subject</label>
            <select name="subjectId" required className="h-10 w-48 rounded-lg border border-sage-border px-3 text-sm">
              {subjectRows.map((s) => (
                <option key={s._id} value={s._id}>{s.name} ({formatAdminCurrency(s.baseMonthlyFee)})</option>
              ))}
            </select>
          </div>
          <div className="grid gap-1">
            <label className="text-xs font-bold text-sage-secondary">Teacher (optional)</label>
            <select name="teacherId" className="h-10 w-40 rounded-lg border border-sage-border px-3 text-sm">
              <option value="">— none —</option>
              {teacherRows.map((t) => (
                <option key={t._id} value={t._id}>{t.name}</option>
              ))}
            </select>
          </div>
          <div className="grid gap-1">
            <label className="text-xs font-bold text-sage-secondary">Max seats</label>
            <input name="maxSeats" type="number" min={1} defaultValue={30} className="h-10 w-24 rounded-lg border border-sage-border px-3 text-sm" />
          </div>
          <div className="grid gap-1">
            <label className="text-xs font-bold text-sage-secondary">Monthly fee (optional override)</label>
            <input name="monthlyFee" type="number" min={0} placeholder="uses subject's base fee" className="h-10 w-56 rounded-lg border border-sage-border px-3 text-sm" />
          </div>
          <button type="submit" className="h-10 rounded-lg bg-sage-primary px-4 text-sm font-bold text-white">
            Add subject slot
          </button>
        </form>
      )}

      <div className="overflow-hidden rounded-xl border border-sage-border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-sage-red-50/40 text-xs font-black uppercase tracking-wide text-sage-secondary">
            <tr>
              <th className="px-4 py-3">Subject</th>
              <th className="px-4 py-3">Teacher</th>
              <th className="px-4 py-3">Monthly fee</th>
              <th className="px-4 py-3">Seats</th>
            </tr>
          </thead>
          <tbody>
            {slotRows.map((s) => {
              const used = seatMap.get(String(s._id)) ?? 0;
              const full = used >= s.maxSeats;
              return (
                <tr key={s._id} className="border-t border-sage-border">
                  <td className="px-4 py-3 font-bold text-sage-secondary">{s.subjectId?.name ?? "—"}</td>
                  <td className="px-4 py-3">{s.teacherId?.name ?? "—"}</td>
                  <td className="px-4 py-3">{formatAdminCurrency(s.monthlyFee)}</td>
                  <td className={`px-4 py-3 font-bold ${full ? "text-red-600" : "text-sage-secondary"}`}>
                    {used}/{s.maxSeats} {full && "(full — new enrollments roll over)"}
                  </td>
                </tr>
              );
            })}
            {slotRows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-sage-gray-400">
                  No subject slots yet. Add one above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
