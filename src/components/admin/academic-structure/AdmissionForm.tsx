"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Printer } from "lucide-react";

import type { ClassRow } from "@/components/admin/academic-structure/types";

type SlotOption = {
  _id: string;
  monthlyFee: number;
  maxSeats: number;
  seatsUsed: number;
  seatsAvailable: number;
  subjectId?: { _id: string; name: string };
  teacherId?: { name: string } | null;
};

type BatchGroupOption = {
  _id: string;
  name: string;
  batchNumber: number;
  subjectBatches: SlotOption[];
};

type AdmittedStudent = {
  _id: string;
  nameEnglish: string;
  nameBangla?: string;
  studentId: string;
  phone?: string;
  whatsapp?: string;
  guardianPhone?: string;
  guardianName?: string;
  fatherName?: string;
  motherName?: string;
  schoolName?: string;
  section?: string;
  roll?: string;
  dateOfBirth?: string | null;
  admissionDate?: string;
  presentAddress?: string;
  permanentAddress?: string;
};

type AdmitResponse = {
  student: AdmittedStudent;
  enrollments: Array<{ status: string; message: string; finalSubjectBatchId: string }>;
  invoice: { totalAmount: number; billingCycle: string; items: Array<{ subjectName: string; amount: number }> };
};

// Initial form state mirrors the public admission form's field set
// (admissionRequestBaseSchema) so a walk-in admission captures the same
// information a website lead would, and it shows up on the printed receipt.
const initialDetails = {
  name: "",
  nameBangla: "",
  phone: "",
  guardianPhone: "",
  studentWhatsapp: "",
  gender: "male",
  dateOfBirth: "",
  medium: "bangla",
  fatherName: "",
  motherName: "",
  guardianName: "",
  schoolName: "",
  section: "",
  roll: "",
  admissionDate: "",
  presentAddress: "",
  permanentAddress: "",
};

export function AdmissionForm({ classes }: { classes: ClassRow[] }) {
  const [details, setDetails] = useState(initialDetails);
  const [classId, setClassId] = useState(classes[0]?._id ?? "");
  const [sameAddress, setSameAddress] = useState(false);
  const [discount, setDiscount] = useState(0);

  // Flow: pick a Class -> that class's batches load into a plain dropdown ->
  // picking a Batch reveals just its subjects as a flat checklist. No nested
  // accordions or medium/gender pre-filtering — one batch at a time, so the
  // subject list never grows past what a single batch actually offers.
  const [groups, setGroups] = useState<BatchGroupOption[]>([]);
  const [batchGroupId, setBatchGroupId] = useState("");
  const [loadingBatches, setLoadingBatches] = useState(Boolean(classes[0]?._id));
  const [selectedSlotIds, setSelectedSlotIds] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<AdmitResponse | null>(null);

  function updateField<K extends keyof typeof initialDetails>(key: K, value: (typeof initialDetails)[K]) {
    setDetails((current) => {
      const next = { ...current, [key]: value };
      if (key === "presentAddress" && sameAddress) {
        next.permanentAddress = value as string;
      }
      return next;
    });
  }

  function toggleSameAddress(checked: boolean) {
    setSameAddress(checked);
    if (checked) {
      setDetails((current) => ({ ...current, permanentAddress: current.presentAddress }));
    }
  }

  const loadBatches = useCallback(async (signal?: AbortSignal) => {
    if (!classId) return;
    try {
      const params = new URLSearchParams({ classId });
      const res = await fetch(`/api/batches/available?${params.toString()}`, { signal });
      const json: { data?: BatchGroupOption[] } = await res.json();
      if (signal?.aborted) return;
      const list = json.data ?? [];
      setGroups(list);
      // Default to the class's first batch so most admins never have to touch
      // this dropdown — a class usually only has one or two batches anyway.
      setBatchGroupId(list[0]?._id ?? "");
    } finally {
      if (!signal?.aborted) setLoadingBatches(false);
    }
  }, [classId]);

  useEffect(() => {
    const controller = new AbortController();
    void loadBatches(controller.signal);
    return () => controller.abort();
  }, [loadBatches]);

  function toggleSlot(slotId: string) {
    setSelectedSlotIds((prev) => {
      const next = new Set(prev);
      if (next.has(slotId)) next.delete(slotId);
      else next.add(slotId);
      return next;
    });
  }

  const selectedGroup = groups.find((g) => g._id === batchGroupId) ?? null;
  const selectedSlots = (selectedGroup?.subjectBatches ?? []).filter((s) => selectedSlotIds.has(s._id));
  const subtotal = selectedSlots.reduce((sum, s) => sum + s.monthlyFee, 0);
  const netPayable = Math.max(0, subtotal - discount);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!details.name.trim() || !details.phone.trim() || !details.guardianPhone.trim()) {
      toast.error("Fill in student name, phone and guardian phone.");
      return;
    }
    if (selectedSlotIds.size === 0) {
      toast.error("Select at least one subject.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/students/admit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: details.name.trim(),
          nameBangla: details.nameBangla,
          phone: details.phone,
          guardianPhone: details.guardianPhone,
          studentWhatsapp: details.studentWhatsapp,
          gender: details.gender,
          dateOfBirth: details.dateOfBirth || null,
          classId,
          medium: details.medium,
          fatherName: details.fatherName,
          motherName: details.motherName,
          guardianName: details.guardianName,
          schoolName: details.schoolName,
          section: details.section,
          roll: details.roll,
          admissionDate: details.admissionDate || null,
          presentAddress: details.presentAddress,
          permanentAddress: details.permanentAddress,
          subjectBatchIds: Array.from(selectedSlotIds),
          discount,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to admit student");
      }
      toast.success("Student admitted successfully.");
      setReceipt(json.data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to admit student");
    } finally {
      setSubmitting(false);
    }
  }

  if (receipt) {
    return <AdmissionReceipt data={receipt} onDone={() => window.location.reload()} />;
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-6">
        <div className="rounded-xl border border-sage-border bg-white p-4">
          <h3 className="mb-3 text-sm font-black uppercase tracking-wide text-sage-secondary">Student details</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1">
              <label className="text-xs font-bold text-sage-secondary">Name (English)</label>
              <input value={details.name} onChange={(e) => updateField("name", e.target.value)} className="h-10 rounded-lg border border-sage-border px-3 text-sm" />
            </div>
            <div className="grid gap-1">
              <label className="text-xs font-bold text-sage-secondary">Name (Bangla)</label>
              <input value={details.nameBangla} onChange={(e) => updateField("nameBangla", e.target.value)} className="h-10 rounded-lg border border-sage-border px-3 text-sm" />
            </div>
            <div className="grid gap-1">
              <label className="text-xs font-bold text-sage-secondary">Date of birth</label>
              <input type="date" value={details.dateOfBirth} onChange={(e) => updateField("dateOfBirth", e.target.value)} className="h-10 rounded-lg border border-sage-border px-3 text-sm" />
            </div>
            <div className="grid gap-1">
              <label className="text-xs font-bold text-sage-secondary">Gender</label>
              <select
                value={details.gender}
                onChange={(e) => updateField("gender", e.target.value)}
                className="h-10 rounded-lg border border-sage-border px-3 text-sm"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="grid gap-1">
              <label className="text-xs font-bold text-sage-secondary">Phone</label>
              <input value={details.phone} onChange={(e) => updateField("phone", e.target.value)} placeholder="01XXXXXXXXX" className="h-10 rounded-lg border border-sage-border px-3 text-sm" />
            </div>
            <div className="grid gap-1">
              <label className="text-xs font-bold text-sage-secondary">WhatsApp number</label>
              <input value={details.studentWhatsapp} onChange={(e) => updateField("studentWhatsapp", e.target.value)} placeholder="01XXXXXXXXX" className="h-10 rounded-lg border border-sage-border px-3 text-sm" />
            </div>
            <div className="grid gap-1">
              <label className="text-xs font-bold text-sage-secondary">Class</label>
              <select
                value={classId}
                onChange={(e) => {
                  setLoadingBatches(true);
                  setSelectedSlotIds(new Set());
                  setClassId(e.target.value);
                }}
                className="h-10 rounded-lg border border-sage-border px-3 text-sm"
              >
                {classes.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-1">
              <label className="text-xs font-bold text-sage-secondary">Medium</label>
              <select
                value={details.medium}
                onChange={(e) => updateField("medium", e.target.value)}
                className="h-10 rounded-lg border border-sage-border px-3 text-sm"
              >
                <option value="bangla">Bangla</option>
                <option value="english">English</option>
              </select>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-sage-border bg-white p-4">
          <h3 className="mb-3 text-sm font-black uppercase tracking-wide text-sage-secondary">Guardian &amp; school</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1">
              <label className="text-xs font-bold text-sage-secondary">Guardian phone</label>
              <input value={details.guardianPhone} onChange={(e) => updateField("guardianPhone", e.target.value)} placeholder="01XXXXXXXXX" className="h-10 rounded-lg border border-sage-border px-3 text-sm" />
            </div>
            <div className="grid gap-1">
              <label className="text-xs font-bold text-sage-secondary">Guardian name</label>
              <input value={details.guardianName} onChange={(e) => updateField("guardianName", e.target.value)} className="h-10 rounded-lg border border-sage-border px-3 text-sm" />
            </div>
            <div className="grid gap-1">
              <label className="text-xs font-bold text-sage-secondary">Father&apos;s name</label>
              <input value={details.fatherName} onChange={(e) => updateField("fatherName", e.target.value)} className="h-10 rounded-lg border border-sage-border px-3 text-sm" />
            </div>
            <div className="grid gap-1">
              <label className="text-xs font-bold text-sage-secondary">Mother&apos;s name</label>
              <input value={details.motherName} onChange={(e) => updateField("motherName", e.target.value)} className="h-10 rounded-lg border border-sage-border px-3 text-sm" />
            </div>
            <div className="grid gap-1">
              <label className="text-xs font-bold text-sage-secondary">School / College</label>
              <input value={details.schoolName} onChange={(e) => updateField("schoolName", e.target.value)} className="h-10 rounded-lg border border-sage-border px-3 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1">
                <label className="text-xs font-bold text-sage-secondary">Section</label>
                <input value={details.section} onChange={(e) => updateField("section", e.target.value)} className="h-10 rounded-lg border border-sage-border px-3 text-sm" />
              </div>
              <div className="grid gap-1">
                <label className="text-xs font-bold text-sage-secondary">Roll</label>
                <input value={details.roll} onChange={(e) => updateField("roll", e.target.value)} className="h-10 rounded-lg border border-sage-border px-3 text-sm" />
              </div>
            </div>
            <div className="grid gap-1">
              <label className="text-xs font-bold text-sage-secondary">Admission date</label>
              <input type="date" value={details.admissionDate} onChange={(e) => updateField("admissionDate", e.target.value)} className="h-10 rounded-lg border border-sage-border px-3 text-sm" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-sage-border bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-wide text-sage-secondary">Address</h3>
            <label className="flex items-center gap-2 text-xs font-bold text-sage-primary">
              <input type="checkbox" checked={sameAddress} onChange={(e) => toggleSameAddress(e.target.checked)} className="accent-sage-primary" />
              Same as present address
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1">
              <label className="text-xs font-bold text-sage-secondary">Present address</label>
              <input value={details.presentAddress} onChange={(e) => updateField("presentAddress", e.target.value)} className="h-10 rounded-lg border border-sage-border px-3 text-sm" />
            </div>
            <div className="grid gap-1">
              <label className="text-xs font-bold text-sage-secondary">Permanent address</label>
              <input
                value={details.permanentAddress}
                disabled={sameAddress}
                onChange={(e) => updateField("permanentAddress", e.target.value)}
                className="h-10 rounded-lg border border-sage-border px-3 text-sm disabled:bg-gray-50"
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-sage-border bg-white p-4">
          <h3 className="mb-3 text-sm font-black uppercase tracking-wide text-sage-secondary">
            Batch &amp; subjects {loadingBatches && "· loading…"}
          </h3>

          {groups.length === 0 && !loadingBatches ? (
            <p className="text-sm text-sage-gray-500">
              This class has no batches yet. Create one under Academic Structure → Create Batch.
            </p>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-1">
                <label className="text-xs font-bold text-sage-secondary">Batch</label>
                <select
                  value={batchGroupId}
                  onChange={(e) => {
                    setSelectedSlotIds(new Set());
                    setBatchGroupId(e.target.value);
                  }}
                  className="h-10 w-full max-w-sm rounded-lg border border-sage-border px-3 text-sm"
                >
                  {groups.map((g) => (
                    <option key={g._id} value={g._id}>
                      {g.name} · {g.subjectBatches.length} subject{g.subjectBatches.length === 1 ? "" : "s"}
                    </option>
                  ))}
                </select>
              </div>

              {selectedGroup && (
                <div className="grid gap-2 sm:grid-cols-2">
                  {selectedGroup.subjectBatches.length === 0 && (
                    <p className="text-sm text-sage-gray-500 sm:col-span-2">
                      This batch has no subjects set up yet.
                    </p>
                  )}
                  {selectedGroup.subjectBatches.map((slot) => {
                    const full = slot.seatsAvailable <= 0;
                    return (
                      <label key={slot._id} className="flex items-start gap-2 rounded-lg border border-sage-border p-2 text-sm hover:bg-sage-red-50/30">
                        <input
                          type="checkbox"
                          checked={selectedSlotIds.has(slot._id)}
                          onChange={() => toggleSlot(slot._id)}
                          className="mt-1 accent-sage-primary"
                        />
                        <span>
                          <span className="block font-bold text-sage-secondary">{slot.subjectId?.name}</span>
                          <span className={`block text-xs ${full ? "text-red-600 font-bold" : "text-sage-gray-500"}`}>
                            ৳{slot.monthlyFee} · {slot.seatsUsed}/{slot.maxSeats} seats
                            {full && " · full — will auto-move to next section"}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="h-fit space-y-4 rounded-xl border border-sage-border bg-white p-4 lg:sticky lg:top-4">
        <h3 className="text-sm font-black uppercase tracking-wide text-sage-secondary">Fee summary</h3>
        <div className="space-y-1 text-sm">
          {selectedSlots.length === 0 && <p className="text-sage-gray-400">No subjects selected yet.</p>}
          {selectedSlots.map((s) => (
            <div key={s._id} className="flex justify-between">
              <span>{s.subjectId?.name}</span>
              <span>৳{s.monthlyFee}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-sage-border pt-2 flex justify-between text-sm font-bold">
          <span>Subtotal</span>
          <span>৳{subtotal}</span>
        </div>
        <div className="grid gap-1">
          <label className="text-xs font-bold text-sage-secondary">Discount (৳)</label>
          <input
            type="number"
            min={0}
            value={discount}
            onChange={(e) => setDiscount(Number(e.target.value) || 0)}
            className="h-10 rounded-lg border border-sage-border px-3 text-sm"
          />
        </div>
        <div className="flex justify-between text-base font-black text-sage-primary">
          <span>Net payable</span>
          <span>৳{netPayable}</span>
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="h-12 w-full rounded-lg bg-sage-primary text-sm font-bold text-white disabled:opacity-50"
        >
          {submitting ? "Saving…" : "Save & Generate Invoice"}
        </button>
      </div>
    </form>
  );
}

function AdmissionReceipt({ data, onDone }: { data: AdmitResponse; onDone: () => void }) {
  const s = data.student;
  const guardianLine = [s.guardianName, s.fatherName, s.motherName].filter(Boolean).join(" / ");

  return (
    <div className="space-y-4">
      <div id="admission-receipt" className="rounded-xl border border-sage-border bg-white p-8 print:border-0">
        <h2 className="text-xl font-black text-sage-secondary">Admission Receipt</h2>
        <p className="mt-1 text-sm text-sage-gray-500">SAGE Academy</p>

        <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <p><span className="font-bold">Student:</span> {s.nameEnglish}</p>
          {s.nameBangla && <p><span className="font-bold">নাম:</span> {s.nameBangla}</p>}
          <p><span className="font-bold">Student ID:</span> {s.studentId}</p>
          <p><span className="font-bold">Billing cycle:</span> {data.invoice.billingCycle}</p>
          {s.phone && <p><span className="font-bold">Phone:</span> {s.phone}</p>}
          {s.whatsapp && <p><span className="font-bold">WhatsApp:</span> {s.whatsapp}</p>}
          {s.guardianPhone && <p><span className="font-bold">Guardian phone:</span> {s.guardianPhone}</p>}
          {guardianLine && <p><span className="font-bold">Guardian:</span> {guardianLine}</p>}
          {s.schoolName && <p><span className="font-bold">School:</span> {s.schoolName}</p>}
          {(s.section || s.roll) && (
            <p><span className="font-bold">Section / Roll:</span> {s.section || "—"} / {s.roll || "—"}</p>
          )}
          {s.dateOfBirth && <p><span className="font-bold">Date of birth:</span> {new Date(s.dateOfBirth).toLocaleDateString()}</p>}
          {s.admissionDate && <p><span className="font-bold">Admission date:</span> {new Date(s.admissionDate).toLocaleDateString()}</p>}
          {s.presentAddress && <p className="col-span-2"><span className="font-bold">Present address:</span> {s.presentAddress}</p>}
          {s.permanentAddress && <p className="col-span-2"><span className="font-bold">Permanent address:</span> {s.permanentAddress}</p>}
        </div>

        <table className="mt-4 w-full text-left text-sm">
          <thead>
            <tr className="border-b border-sage-border">
              <th className="py-2">Subject</th>
              <th className="py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {data.invoice.items.map((item, i) => (
              <tr key={i} className="border-b border-sage-border/50">
                <td className="py-2">{item.subjectName}</td>
                <td className="py-2 text-right">৳{item.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-3 flex justify-between text-base font-black text-sage-primary">
          <span>Total due</span>
          <span>৳{data.invoice.totalAmount}</span>
        </div>
        <div className="mt-6 space-y-1 text-xs text-sage-gray-500">
          {data.enrollments.map((e, i) => (
            <p key={i}>• {e.message}</p>
          ))}
        </div>
      </div>

      <div className="flex gap-3 print:hidden">
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 h-11 rounded-lg bg-sage-primary px-5 text-sm font-bold text-white"
        >
          <Printer size={16} /> Print receipt
        </button>
        <button onClick={onDone} className="h-11 rounded-lg border border-sage-border px-5 text-sm font-bold text-sage-secondary">
          Admit another student
        </button>
      </div>
    </div>
  );
}
