"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeftRight, BadgePercent, Ban, Pencil, Plus, Receipt, UserCheck, UserX, XCircle } from "lucide-react";

import { Modal } from "@/components/admin/sa/Modal";
import { SaSelect } from "@/components/admin/sa/SaSelect";
import {
  addStudentSubjectAction,
  changeDiscountAction,
  dropStudentSubjectAction,
  setStudentStatusAction,
  updateStudentDetailsAction,
  type StudentDetailsInput,
} from "@/app/admin/academy/_actions/students";
import { addChargeAction, waiveDueAction } from "@/app/admin/academy/_actions/finance";
import { addMonths, currentMonthKey, formatTaka, monthLabel } from "@/lib/academy/codes";
import { discountAmount } from "@/lib/academy/fees";
import type { DiscountType, DueKind } from "@/lib/academy/constants";
import { ErrorNotice, useAction } from "./use-action";

// ───────────── Edit details ─────────────

export function EditStudentButton({ id, initial }: { id: string; initial: StudentDetailsInput }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(initial);
  const { pending, error, run } = useAction();
  const field = (key: keyof StudentDetailsInput) => ({
    value: (form[key] as string) ?? "",
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((value) => ({ ...value, [key]: event.target.value })),
  });

  return (
    <>
      <button type="button" className="btn-secondary" onClick={() => { setForm(initial); setOpen(true); }}>
        <Pencil size={17} /> Edit details
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        eyebrow="Student"
        title="Edit details"
        description="Class, batch and version change through admission or subject transfer, not here."
        wide
        actions={
          <>
            <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button type="button" className="btn-primary" disabled={pending} onClick={() => run(() => updateStudentDetailsAction(id, form), { onSuccess: () => setOpen(false) })}>
              {pending ? "Saving..." : "Save details"}
            </button>
          </>
        }
      >
        <ErrorNotice message={error} />
        <div className="form-grid">
          <label className="field">
            Name (English)<span className="req">*</span>
            <input className="input" {...field("name")} />
          </label>
          <label className="field">
            Name (Bangla)
            <input className="input" {...field("nameBangla")} />
          </label>
          <label className="field">
            Gender
            <SaSelect
              value={form.gender}
              onChange={(value) => setForm((current) => ({ ...current, gender: value as "male" | "female" }))}
              options={[
                { value: "male", label: "Male" },
                { value: "female", label: "Female" },
              ]}
            />
          </label>
          <label className="field">
            Admission date
            <input className="input" type="date" {...field("admissionDate")} />
          </label>
          <label className="field">
            Guardian name<span className="req">*</span>
            <input className="input" {...field("guardianName")} />
          </label>
          <label className="field">
            Relation
            <input className="input" {...field("guardianRelation")} />
          </label>
          <label className="field">
            Guardian phone<span className="req">*</span>
            <input className="input" {...field("guardianPhone")} />
          </label>
          <label className="field">
            WhatsApp
            <input className="input" {...field("whatsapp")} />
          </label>
          <label className="field">
            Student phone
            <input className="input" {...field("phone")} />
          </label>
          <label className="field">
            School
            <input className="input" {...field("schoolName")} />
          </label>
          <label className="field">
            Father&apos;s name
            <input className="input" {...field("fatherName")} />
          </label>
          <label className="field">
            Mother&apos;s name
            <input className="input" {...field("motherName")} />
          </label>
          <label className="field">
            Date of birth
            <input className="input" type="date" {...field("dateOfBirth")} />
          </label>
          <label className="field">
            Address
            <input className="input" {...field("address")} />
          </label>
          <label className="field wide">
            Note
            <textarea className="textarea" {...field("note")} />
          </label>
        </div>
      </Modal>
    </>
  );
}

// ───────────── Left / active ─────────────

export function StudentStatusButton({ id, status }: { id: string; status: "active" | "inactive" }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const { pending, error, run } = useAction();
  if (status === "inactive") {
    return (
      <button type="button" className="btn-secondary" disabled={pending} onClick={() => run(() => setStudentStatusAction(id, "active"))}>
        <UserCheck size={17} /> Mark active
      </button>
    );
  }
  return (
    <>
      <button type="button" className="btn-secondary" onClick={() => setOpen(true)}>
        <UserX size={17} /> Mark as left
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        eyebrow="Student"
        title="Mark as left"
        description={`All subjects are dropped and their seats freed. Billing stops after ${monthLabel(currentMonthKey())}. Unpaid dues stay on record.`}
        actions={
          <>
            <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button type="button" className="btn-danger" disabled={pending} onClick={() => run(() => setStudentStatusAction(id, "inactive", note), { onSuccess: () => setOpen(false) })}>
              {pending ? "Saving..." : "Mark as left"}
            </button>
          </>
        }
      >
        <ErrorNotice message={error} />
        <label className="field">
          Reason (optional)
          <input className="input" value={note} onChange={(event) => setNote(event.target.value)} placeholder="e.g. Moved to another city" />
        </label>
      </Modal>
    </>
  );
}

// ───────────── Subject row actions ─────────────

export type SubjectRowData = {
  enrollmentId: string;
  name: string;
  fee: number;
  discountType: DiscountType;
  discountValue: number;
  discountNote: string;
};

export function SubjectRowActions({ row, studentId, compact = false }: { row: SubjectRowData; studentId: string; compact?: boolean }) {
  const [mode, setMode] = useState<"discount" | "drop" | null>(null);
  const [type, setType] = useState<DiscountType>(row.discountType);
  const [value, setValue] = useState(String(row.discountValue || ""));
  const [note, setNote] = useState(row.discountNote);
  const [applyNow, setApplyNow] = useState(false);
  const [dropNote, setDropNote] = useState("");
  const { pending, error, setError, run } = useAction();
  const month = currentMonthKey();
  const preview = discountAmount(row.fee, type, Number(value || 0));

  return (
    <>
      <button type="button" className={compact ? "sa-grid-icon-btn" : "row-action"} onClick={() => { setError(""); setMode("discount"); }} title="Change discount" aria-label="Change discount">
        <BadgePercent size={compact ? 16 : 14} />
        {compact ? null : " Discount"}
      </button>
      <Link
        href={`/admin/academy/transfer?student=${studentId}&enrollment=${row.enrollmentId}`}
        className={compact ? "sa-grid-icon-btn" : "row-action"}
        title="Transfer to another batch"
        aria-label="Transfer to another batch"
      >
        <ArrowLeftRight size={compact ? 16 : 14} />
        {compact ? null : " Transfer"}
      </Link>
      <button
        type="button"
        className={compact ? "sa-grid-icon-btn danger" : "row-action"}
        onClick={() => { setError(""); setMode("drop"); }}
        aria-label={`Drop ${row.name}`}
        title="Drop subject"
      >
        <XCircle size={compact ? 16 : 14} />
      </button>

      <Modal
        open={mode === "discount"}
        onClose={() => setMode(null)}
        eyebrow={row.name}
        title="Change discount"
        description={`Fee ${formatTaka(row.fee)} a month. The change is recorded with your name.`}
        actions={
          <>
            <button type="button" className="btn-secondary" onClick={() => setMode(null)}>
              Cancel
            </button>
            <button
              type="button"
              className="btn-primary"
              disabled={pending}
              onClick={() =>
                run(
                  () =>
                    changeDiscountAction({
                      enrollmentId: row.enrollmentId,
                      discountType: type,
                      discountValue: Number(value || 0),
                      discountNote: note,
                      applyThisMonth: applyNow,
                    }),
                  { onSuccess: () => setMode(null) }
                )
              }
            >
              {pending ? "Saving..." : "Save discount"}
            </button>
          </>
        }
      >
        <ErrorNotice message={error} />
        <div className="form-grid">
          <label className="field">
            Discount type
            <SaSelect
              value={type}
              onChange={(value) => { setType(value as DiscountType); setValue(""); }}
              options={[
                { value: "none", label: "No discount" },
                { value: "percent", label: "Percent (%)" },
                { value: "amount", label: "Taka (Tk)" },
              ]}
            />
          </label>
          <label className="field">
            {type === "percent" ? "Percent" : "Amount"}
            <input className="input" type="number" min={0} value={value} disabled={type === "none"} onChange={(event) => setValue(event.target.value)} />
            <small>New monthly fee: {formatTaka(row.fee - preview)}</small>
          </label>
          <label className="field wide">
            Reason
            <input className="input" value={note} onChange={(event) => setNote(event.target.value)} placeholder="e.g. Sibling discount" />
          </label>
        </div>
        <label className="check-card" style={{ marginBottom: 16 }}>
          <input type="checkbox" checked={applyNow} onChange={(event) => setApplyNow(event.target.checked)} />
          <span>
            <strong style={{ display: "block", fontSize: 14 }}>Also change {monthLabel(month)}&apos;s bill</strong>
            <small style={{ color: "var(--muted)" }}>Otherwise the new discount starts from {monthLabel(addMonths(month, 1))}.</small>
          </span>
        </label>
      </Modal>

      <Modal
        open={mode === "drop"}
        onClose={() => setMode(null)}
        eyebrow={row.name}
        title="Drop this subject?"
        description={`It stays on ${monthLabel(month)}'s bill and is not billed after that. The seat is freed.`}
        actions={
          <>
            <button type="button" className="btn-secondary" onClick={() => setMode(null)}>
              Cancel
            </button>
            <button type="button" className="btn-danger" disabled={pending} onClick={() => run(() => dropStudentSubjectAction(row.enrollmentId, dropNote), { onSuccess: () => setMode(null) })}>
              {pending ? "Saving..." : "Drop subject"}
            </button>
          </>
        }
      >
        <ErrorNotice message={error} />
        <label className="field">
          Reason (optional)
          <input className="input" value={dropNote} onChange={(event) => setDropNote(event.target.value)} />
        </label>
      </Modal>
    </>
  );
}

// ───────────── Add subject ─────────────

export type AddSubjectOption = {
  batchId: string;
  batchCode: string;
  subjectId: string;
  name: string;
  fee: number;
  full: boolean;
};

export function AddSubjectButton({ studentId, options }: { studentId: string; options: AddSubjectOption[] }) {
  const [open, setOpen] = useState(false);
  const [choice, setChoice] = useState("");
  const [type, setType] = useState<DiscountType>("none");
  const [value, setValue] = useState("");
  const [note, setNote] = useState("");
  const [billFrom, setBillFrom] = useState<"this" | "next">("next");
  const { pending, error, setError, run } = useAction();
  const month = currentMonthKey();
  const selected = options.find((option) => `${option.batchId}:${option.subjectId}` === choice);

  return (
    <>
      <button type="button" className="btn-secondary btn-sm" onClick={() => { setError(""); setOpen(true); }} disabled={options.length === 0} title={options.length === 0 ? "No other subjects available for this student" : undefined}>
        <Plus size={15} /> Add subject
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        eyebrow="Subjects"
        title="Add a subject"
        description="Only batches of the student's class, gender and version are listed. Timetable clashes are checked."
        actions={
          <>
            <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button
              type="button"
              className="btn-primary"
              disabled={pending || !selected}
              onClick={() =>
                selected &&
                run(
                  () =>
                    addStudentSubjectAction({
                      studentId,
                      subjectId: selected.subjectId,
                      batchId: selected.batchId,
                      discountType: type,
                      discountValue: Number(value || 0),
                      discountNote: note,
                      billFrom,
                    }),
                  { onSuccess: () => setOpen(false) }
                )
              }
            >
              {pending ? "Adding..." : "Add subject"}
            </button>
          </>
        }
      >
        <ErrorNotice message={error} />
        <label className="field">
          Subject and batch
          <SaSelect
            value={choice}
            onChange={setChoice}
            placeholder="Choose"
            options={options.map((option) => ({
              value: `${option.batchId}:${option.subjectId}`,
              label: `${option.name} — ${option.batchCode} — ${formatTaka(option.fee)}${option.full ? " (full)" : ""}`,
              disabled: option.full,
            }))}
          />
        </label>
        <div className="form-grid">
          <label className="field">
            Discount
            <SaSelect
              value={type}
              onChange={(value) => { setType(value as DiscountType); setValue(""); }}
              options={[
                { value: "none", label: "No discount" },
                { value: "percent", label: "Percent (%)" },
                { value: "amount", label: "Taka (Tk)" },
              ]}
            />
          </label>
          <label className="field">
            Value
            <input className="input" type="number" min={0} value={value} disabled={type === "none"} onChange={(event) => setValue(event.target.value)} />
            {selected ? <small>Monthly: {formatTaka(selected.fee - discountAmount(selected.fee, type, Number(value || 0)))}</small> : null}
          </label>
          {type !== "none" ? (
            <label className="field wide">
              Reason
              <input className="input" value={note} onChange={(event) => setNote(event.target.value)} />
            </label>
          ) : null}
        </div>
        <div className="field">
          Start billing
          <div className="segmented">
            <button type="button" className={billFrom === "this" ? "active" : ""} onClick={() => setBillFrom("this")}>
              This month ({monthLabel(month, true)})
            </button>
            <button type="button" className={billFrom === "next" ? "active" : ""} onClick={() => setBillFrom("next")}>
              Next month ({monthLabel(addMonths(month, 1), true)})
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}

// ───────────── Charges and waivers ─────────────

export function AddChargeButton({ studentId, onDone }: { studentId: string; onDone?: () => void }) {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<Exclude<DueKind, "tuition">>("exam");
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [month, setMonth] = useState(currentMonthKey());
  const { pending, error, setError, run } = useAction();

  return (
    <>
      <button type="button" className="btn-secondary btn-sm" onClick={() => { setError(""); setOpen(true); }}>
        <Receipt size={15} /> Add fee
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        eyebrow="Bills"
        title="Add a fee"
        description="Exam, admission and other fees are entered by hand. Monthly tuition is billed automatically."
        actions={
          <>
            <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button
              type="button"
              className="btn-primary"
              disabled={pending}
              onClick={() => run(() => addChargeAction({ studentId, kind, label, amount: Number(amount || 0), month }), { onSuccess: () => { setOpen(false); setAmount(""); onDone?.(); } })}
            >
              {pending ? "Adding..." : "Add fee"}
            </button>
          </>
        }
      >
        <ErrorNotice message={error} />
        <div className="form-grid">
          <label className="field">
            Type
            <SaSelect
              value={kind}
              onChange={(value) => setKind(value as typeof kind)}
              options={[
                { value: "exam", label: "Exam fee" },
                { value: "admission", label: "Admission fee" },
                { value: "materials", label: "Materials fee" },
                { value: "other", label: "Other" },
              ]}
            />
          </label>
          <label className="field">
            Month
            <input className="input" type="month" value={month} onChange={(event) => setMonth(event.target.value)} />
          </label>
          <label className="field">
            Amount (Tk)<span className="req">*</span>
            <input className="input" type="number" min={1} value={amount} onChange={(event) => setAmount(event.target.value)} />
          </label>
          <label className="field">
            Label
            <input className="input" value={label} onChange={(event) => setLabel(event.target.value)} placeholder={kind === "exam" ? "e.g. Half-yearly exam" : ""} />
          </label>
        </div>
      </Modal>
    </>
  );
}

export function WaiveDueButton({ dueId, label }: { dueId: string; label: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const { pending, error, run } = useAction();
  return (
    <>
      <button type="button" className="row-action" onClick={() => setOpen(true)} title="Cancel this bill" aria-label="Cancel this bill">
        <Ban size={14} />
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        eyebrow="Bills"
        title={`Cancel ${label}?`}
        description="Use this for a waived month or a bill added by mistake. It stays on record as cancelled."
        actions={
          <>
            <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>
              Keep bill
            </button>
            <button type="button" className="btn-danger" disabled={pending} onClick={() => run(() => waiveDueAction(dueId, reason), { onSuccess: () => setOpen(false) })}>
              {pending ? "Saving..." : "Cancel bill"}
            </button>
          </>
        }
      >
        <ErrorNotice message={error} />
        <label className="field">
          Reason<span className="req">*</span>
          <input className="input" value={reason} onChange={(event) => setReason(event.target.value)} />
        </label>
      </Modal>
    </>
  );
}
