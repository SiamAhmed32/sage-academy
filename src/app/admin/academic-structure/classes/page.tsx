import { Metadata } from "next";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { connectDB } from "@/lib/mongodb";
import Class from "@/models/Class";
import { createClassAction, deleteClassAction } from "@/app/admin/actions/academic-structure";
import type { ClassRow } from "@/components/admin/academic-structure/types";

export const metadata: Metadata = { title: "Classes | SAGE Admin" };
export const dynamic = "force-dynamic";

export default async function ClassesPage() {
  await connectDB();
  const classes = await Class.find().sort({ orderIndex: 1, name: 1 }).lean();
  const rows: ClassRow[] = JSON.parse(JSON.stringify(classes));

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <AdminPageHeader
        title="Classes"
        description="Independent academic grades (Class 6, Class 7, ..., SSC). Subjects and batch groups reference these instead of typing the class name repeatedly."
      />

      <form action={createClassAction} className="flex flex-wrap items-end gap-3 rounded-xl border border-sage-border bg-white p-4">
        <div className="grid gap-1">
          <label className="text-xs font-bold text-sage-secondary">Class name</label>
          <input name="name" required placeholder="Class 7" className="h-10 w-48 rounded-lg border border-sage-border px-3 text-sm" />
        </div>
        <div className="grid gap-1">
          <label className="text-xs font-bold text-sage-secondary">Order</label>
          <input name="orderIndex" type="number" defaultValue={0} className="h-10 w-24 rounded-lg border border-sage-border px-3 text-sm" />
        </div>
        <div className="grid gap-1">
          <label className="text-xs font-bold text-sage-secondary">Grade number (1-12)</label>
          <input
            name="legacyClassLevel"
            type="number"
            min={1}
            max={12}
            required
            placeholder="e.g. 7, or 10 for SSC"
            className="h-10 w-56 rounded-lg border border-sage-border px-3 text-sm"
          />
        </div>
        <button type="submit" className="h-10 rounded-lg bg-sage-primary px-4 text-sm font-bold text-white">
          Add class
        </button>
      </form>

      <div className="overflow-hidden rounded-xl border border-sage-border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-sage-red-50/40 text-xs font-black uppercase tracking-wide text-sage-secondary">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Grade #</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c._id} className="border-t border-sage-border">
                <td className="px-4 py-3 font-bold text-sage-secondary">{c.name}</td>
                <td className="px-4 py-3">{c.orderIndex}</td>
                <td className="px-4 py-3">{c.legacyClassLevel}</td>
                <td className="px-4 py-3 text-right">
                  <form action={deleteClassAction}>
                    <input type="hidden" name="id" value={c._id} />
                    <button type="submit" className="text-xs font-bold text-red-600 hover:underline">
                      Delete
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-sage-gray-400">
                  No classes yet. Add one above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
