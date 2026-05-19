import { ClipboardList } from "lucide-react";

export function StudentNotesPanel({ note }: { note?: string }) {
  return (
    <section className="rounded-xl border border-sage-border bg-white shadow-sm">
      <div className="border-b border-sage-border bg-sage-red-50/40 p-4">
        <h3 className="flex items-center gap-2 text-lg font-bold text-sage-secondary">
          <ClipboardList className="h-5 w-5 text-sage-primary" />
          Admin Note
        </h3>
      </div>
      <div className="p-4">
        <p className="rounded-xl bg-sage-red-50/30 p-4 text-sm leading-6 text-sage-gray-600">
          {note || "কোনো নোট নেই।"}
        </p>
      </div>
    </section>
  );
}
