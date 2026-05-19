import { monthLabels, months } from "@/components/admin/payments/payment-options";

export function SubjectChangeEffectiveFields() {
  const now = new Date();

  return (
    <div className="rounded-xl border border-sage-border bg-white p-3">
      <div className="mb-3">
        <p className="text-sm font-bold text-sage-secondary">Subject change effective from</p>
        <p className="text-xs text-sage-gray-500">
          Used for add/remove history. Old payment receipts stay unchanged.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-[1fr_120px_1.5fr]">
        <select name="subjectChangeMonth" defaultValue={months[now.getMonth()]} className="h-10 rounded-lg border border-sage-border bg-white px-3 text-sm">
          {months.map((month) => <option key={month} value={month}>{monthLabels[month]}</option>)}
        </select>
        <input name="subjectChangeYear" type="number" defaultValue={now.getFullYear()} className="h-10 rounded-lg border border-sage-border px-3 text-sm" />
        <input name="subjectChangeNote" placeholder="Optional note, e.g. parent requested subject removal" className="h-10 rounded-lg border border-sage-border px-3 text-sm" />
      </div>
    </div>
  );
}
