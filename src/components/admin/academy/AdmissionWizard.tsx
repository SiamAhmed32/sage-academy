"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, Printer, UserPlus, UserRound } from "lucide-react";

import { SaSelect } from "@/components/admin/sa/SaSelect";
import { SeatMeter, StatusChip } from "@/components/admin/sa/ui";
import { admitStudentAction, type AdmissionInput } from "@/app/admin/academy/_actions/students";
import {
  BATCH_GENDER_LABELS,
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
  VERSIONS,
  VERSION_LABELS,
  batchGenderForStudent,
  type DiscountType,
  type PaymentMethod,
  type StudentGender,
  type Version,
} from "@/lib/academy/constants";
import { currentMonthKey, formatTaka, monthLabel } from "@/lib/academy/codes";
import { discountAmount } from "@/lib/academy/fees";
import type { BatchOption, ClassOption } from "@/lib/academy/queries";
import { ErrorNotice, useAction } from "./use-action";

export type AdmissionPrefill = {
  requestId: string;
  name: string;
  nameBangla: string;
  gender: StudentGender | "";
  guardianName: string;
  guardianPhone: string;
  whatsapp: string;
  fatherName: string;
  motherName: string;
  schoolName: string;
  address: string;
  dateOfBirth: string;
  version: Version | "";
  classLevel: number | null;
};

type SubjectChoice = { selected: boolean; discountType: DiscountType; discountValue: string; discountNote: string };

const STEPS = ["Student details", "Choose batch", "Subjects & fees", "Review & payment"];

function today() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function AdmissionWizard({
  classes,
  batches,
  initialBatchId,
  prefill,
}: {
  classes: ClassOption[];
  batches: BatchOption[];
  initialBatchId: string;
  prefill: AdmissionPrefill | null;
}) {
  const initialBatch = batches.find((batch) => batch.id === initialBatchId);
  const prefillClass = prefill?.classLevel ? classes.find((item) => item.level === prefill.classLevel) : undefined;

  const [step, setStep] = useState(0);
  const [details, setDetails] = useState({
    name: prefill?.name ?? "",
    nameBangla: prefill?.nameBangla ?? "",
    gender: (prefill?.gender || (initialBatch ? (initialBatch.gender === "girls" ? "female" : "male") : "")) as StudentGender | "",
    phone: "",
    whatsapp: prefill?.whatsapp ?? "",
    guardianName: prefill?.guardianName ?? "",
    guardianRelation: "",
    guardianPhone: prefill?.guardianPhone ?? "",
    fatherName: prefill?.fatherName ?? "",
    motherName: prefill?.motherName ?? "",
    schoolName: prefill?.schoolName ?? "",
    dateOfBirth: prefill?.dateOfBirth ?? "",
    address: prefill?.address ?? "",
    admissionDate: today(),
    note: "",
  });
  const [classId, setClassId] = useState(initialBatch?.classId ?? prefillClass?.id ?? classes[0]?.id ?? "");
  const [version, setVersion] = useState<Version>(initialBatch?.version ?? (prefill?.version || "bangla"));
  const [batchId, setBatchId] = useState(initialBatch?.id ?? "");
  const [choices, setChoices] = useState<Record<string, SubjectChoice>>(() =>
    initialBatch ? Object.fromEntries(initialBatch.subjects.map((s) => [s.subjectId, { selected: true, discountType: "none", discountValue: "", discountNote: "" }])) : {}
  );
  const [firstMonth, setFirstMonth] = useState<string | null>(null);
  const [admissionFee, setAdmissionFee] = useState("");
  const [materialsFee, setMaterialsFee] = useState("");
  // Off by default: admitting a student only creates the bills. A receipt is
  // made only when staff tick this and type the amount actually received.
  const [collectNow, setCollectNow] = useState(false);
  const [payAmount, setPayAmount] = useState<string | null>(null);
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [transactionId, setTransactionId] = useState("");
  const [done, setDone] = useState<{ id: string; studentId: string; receiptNo: string | null } | null>(null);
  const { pending, error, setError, run } = useAction();

  const month = currentMonthKey();
  const gender = details.gender ? batchGenderForStudent(details.gender) : null;
  const matching = batches.filter(
    (batch) => batch.classId === classId && batch.version === version && (!gender || batch.gender === gender)
  );
  const batch = batches.find((item) => item.id === batchId) ?? null;

  const lines = useMemo(
    () =>
      (batch?.subjects ?? []).map((subject) => {
        const choice = choices[subject.subjectId] ?? { selected: false, discountType: "none" as DiscountType, discountValue: "", discountNote: "" };
        const discount = discountAmount(subject.fee, choice.discountType, Number(choice.discountValue || 0));
        return { ...subject, choice, discount, net: subject.fee - discount };
      }),
    [batch, choices]
  );
  const selectedLines = lines.filter((line) => line.choice.selected);
  const monthly = selectedLines.reduce((sum, line) => sum + line.net, 0);
  const discountTotal = selectedLines.reduce((sum, line) => sum + line.discount, 0);
  const firstMonthValue = firstMonth === null ? monthly : Number(firstMonth || 0);
  const admissionValue = Number(admissionFee || 0);
  const materialsValue = Number(materialsFee || 0);
  const totalNow = firstMonthValue + admissionValue + materialsValue;
  const payValue = payAmount === null ? 0 : Number(payAmount || 0);

  function pickBatch(id: string) {
    const next = batches.find((item) => item.id === id);
    if (!next) return;
    setBatchId(id);
    setChoices(Object.fromEntries(next.subjects.map((s) => [s.subjectId, { selected: true, discountType: "none", discountValue: "", discountNote: "" }])));
    setFirstMonth(null);
    setPayAmount(null);
  }

  function setChoice(subjectId: string, patch: Partial<SubjectChoice>) {
    setChoices((value) => ({ ...value, [subjectId]: { ...value[subjectId], ...patch } }));
    setFirstMonth(null);
    setPayAmount(null);
  }

  function validateStep(target: number) {
    setError("");
    if (target >= 1) {
      if (details.name.trim().length < 2) return "Enter the student's name.";
      if (!details.gender) return "Choose the student's gender.";
      if (details.guardianName.trim().length < 2) return "Enter the guardian's name.";
      if (!/^(\+?88)?01[3-9]\d{8}$/.test(details.guardianPhone.replace(/[\s-]/g, ""))) return "Enter a valid guardian phone (11 digits, starting with 01).";
    }
    if (target >= 2) {
      if (!batch) return "Choose a batch.";
      if (batch.students >= batch.capacity) return `${batch.code} is full. Choose another batch or raise its size.`;
      if (selectedLines.length === 0) return "Choose at least one subject.";
    }
    if (target >= 3) {
      if (selectedLines.length === 0) return "Choose at least one subject.";
      for (const line of selectedLines) {
        const value = Number(line.choice.discountValue || 0);
        if (line.choice.discountType === "percent" && value > 100) return `${line.name}: a discount cannot be more than 100%.`;
        if (line.choice.discountType === "amount" && value > line.fee) return `${line.name}: the discount is more than the fee.`;
      }
    }
    return "";
  }

  function go(target: number) {
    const problem = target > step ? validateStep(target) : "";
    if (problem) {
      setError(problem);
      return;
    }
    setStep(target);
  }

  function submit() {
    const problem = validateStep(3);
    if (problem) {
      setError(problem);
      return;
    }
    if (collectNow && payValue <= 0) {
      setError("Enter the amount received, or untick “Collect payment now” to only create the bills.");
      return;
    }
    if (collectNow && payValue > totalNow) {
      setError("The amount received is more than the total due now.");
      return;
    }
    if (collectNow && payValue > 0 && method !== "cash" && !transactionId.trim()) {
      setError("Enter the transaction ID for online payments.");
      return;
    }
    const payload: AdmissionInput = {
      details: { ...details, gender: details.gender as StudentGender },
      batchId,
      subjects: selectedLines.map((line) => ({
        subjectId: line.subjectId,
        discountType: line.choice.discountType,
        discountValue: Number(line.choice.discountValue || 0),
        discountNote: line.choice.discountNote,
      })),
      firstMonthTuition: firstMonthValue,
      admissionFee: admissionValue,
      materialsFee: materialsValue,
      admissionRequestId: prefill?.requestId ?? "",
      payment: collectNow && payValue > 0 ? { amount: payValue, method, transactionId } : null,
    };
    run(() => admitStudentAction(payload), { onSuccess: (data) => data && setDone(data), quiet: false });
  }

  if (done) {
    return (
      <section className="panel" style={{ maxWidth: 720 }}>
        <div className="panel-body" style={{ paddingTop: 28, textAlign: "center" }}>
          <div className="empty-icon" style={{ width: 60, height: 60, borderRadius: 16, margin: "0 auto 14px", display: "grid", placeItems: "center", background: "#e8f8f2", color: "#1b9b70" }}>
            <CheckCircle2 size={30} />
          </div>
          <span className="eyebrow">Admission complete</span>
          <h2 style={{ fontSize: 24, fontWeight: 700, margin: "8px 0 4px" }}>{details.name}</h2>
          <p style={{ color: "var(--muted)", margin: "0 0 16px" }}>
            Student ID <code>{done.studentId}</code> · Batch <code>{batch?.code}</code>
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            {done.receiptNo ? (
              <Link href={`/admin/academy/receipts/${done.receiptNo}`} className="btn-primary">
                <Printer size={17} /> Print receipt {done.receiptNo}
              </Link>
            ) : null}
            <Link href={`/admin/academy/students/${done.id}`} className="btn-secondary">
              <UserRound size={17} /> Open profile
            </Link>
            <button type="button" className="btn-secondary" onClick={() => window.location.assign("/admin/academy/admission")}>
              <UserPlus size={17} /> Admit another
            </button>
          </div>
        </div>
      </section>
    );
  }

  const field = (key: keyof typeof details) => ({
    value: details[key],
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setDetails((value) => ({ ...value, [key]: event.target.value })),
  });

  return (
    <>
      <div className="stepper">
        {STEPS.map((label, index) => (
          <div
            key={label}
            role="button"
            tabIndex={0}
            className={index === step ? "active" : index < step ? "done" : ""}
            style={{ cursor: "pointer" }}
            onClick={() => go(index)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") go(index);
            }}
          >
            <b>{index < step ? "✓" : index + 1}</b>
            {label}
          </div>
        ))}
      </div>

      <div className="two-panels">
        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>{STEPS[step]}</h2>
              <p>
                {
                  [
                    prefill ? "Filled from the admission request. Check every field." : "Enter the student and guardian details.",
                    "Only batches that match the student's gender, class and version are shown.",
                    "Fees come from each subject's version fee. Give a discount per subject in % or Tk.",
                    "Check everything, then save. You can collect the first payment now.",
                  ][step]
                }
              </p>
            </div>
          </div>
          <div className="panel-body">
            <ErrorNotice message={error} />

            {step === 0 ? (
              <div className="form-grid">
                <label className="field">
                  Student name (English)<span className="req">*</span>
                  <input className="input" {...field("name")} placeholder="e.g. Rafiul Islam" />
                </label>
                <label className="field">
                  Student name (Bangla)
                  <input className="input" {...field("nameBangla")} />
                </label>
                <div className="field">
                  Gender<span className="req">*</span>
                  <div className="segmented">
                    {(["male", "female"] as const).map((value) => (
                      <button
                        key={value}
                        type="button"
                        className={details.gender === value ? "active" : ""}
                        onClick={() => {
                          setDetails((current) => ({ ...current, gender: value }));
                          if (batch && batch.gender !== batchGenderForStudent(value)) setBatchId("");
                        }}
                      >
                        {value === "male" ? "Male (boys batch)" : "Female (girls batch)"}
                      </button>
                    ))}
                  </div>
                </div>
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
                  <SaSelect
                    value={details.guardianRelation}
                    onChange={(value) => setDetails((current) => ({ ...current, guardianRelation: value }))}
                    placeholder="Choose"
                    options={["Father", "Mother", "Brother", "Sister", "Uncle", "Aunt", "Other"].map((value) => ({ value, label: value }))}
                  />
                </label>
                <label className="field">
                  Guardian phone<span className="req">*</span>
                  <input className="input" inputMode="tel" {...field("guardianPhone")} placeholder="01XXXXXXXXX" />
                </label>
                <label className="field">
                  WhatsApp (for receipts)
                  <input className="input" inputMode="tel" {...field("whatsapp")} placeholder="01XXXXXXXXX" />
                </label>
                <label className="field">
                  Student phone
                  <input className="input" inputMode="tel" {...field("phone")} placeholder="Optional" />
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
                  <textarea className="textarea" {...field("note")} placeholder="Anything the office should remember" />
                </label>
              </div>
            ) : null}

            {step === 1 ? (
              <>
                <div className="form-grid">
                  <label className="field">
                    Class
                    <SaSelect
                      value={classId}
                      onChange={(value) => {
                        setClassId(value);
                        setBatchId("");
                      }}
                      options={classes.map((item) => ({ value: item.id, label: item.name }))}
                    />
                  </label>
                  <div className="field">
                    Version
                    <div className="segmented">
                      {VERSIONS.map((value) => (
                        <button
                          key={value}
                          type="button"
                          className={version === value ? "active" : ""}
                          onClick={() => {
                            setVersion(value);
                            setBatchId("");
                          }}
                        >
                          {VERSION_LABELS[value]}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                {matching.length === 0 ? (
                  <div className="notice warn">
                    <AlertTriangle size={16} />
                    <span>
                      No active {gender ? BATCH_GENDER_LABELS[gender].toLowerCase() : ""} {VERSION_LABELS[version].toLowerCase()} batch for this class.{" "}
                      <Link href="/admin/academy/batches/new" className="text-button">
                        Create one
                      </Link>
                    </span>
                  </div>
                ) : (
                  <div className="option-grid">
                    {matching.map((item) => {
                      const full = item.students >= item.capacity;
                      return (
                        <label key={item.id} className={`check-card${batchId === item.id ? " selected" : ""}${full ? " disabled" : ""}`} style={{ alignItems: "flex-start" }}>
                          <input type="radio" name="batch" checked={batchId === item.id} disabled={full} onChange={() => pickBatch(item.id)} />
                          <span style={{ flex: 1, minWidth: 0 }}>
                            <span style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
                              <code>{item.code}</code>
                              {full ? <StatusChip tone="danger">Full</StatusChip> : null}
                            </span>
                            <small style={{ display: "block", color: "var(--muted)", margin: "8px 0" }}>
                              {item.subjects.map((subject) => subject.name).join(", ") || "No subjects"}
                            </small>
                            <SeatMeter used={item.students} capacity={item.capacity} />
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}

                {batch ? (
                  <div style={{ marginTop: 20 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
                      <strong style={{ fontSize: 15 }}>Subjects the student will take in {batch.code}</strong>
                      {lines.length > 1 ? (
                        <button
                          type="button"
                          className="text-button"
                          onClick={() => {
                            const all = selectedLines.length < lines.length;
                            for (const line of lines) setChoice(line.subjectId, { selected: all });
                          }}
                        >
                          {selectedLines.length < lines.length ? "Select all" : "Clear"}
                        </button>
                      ) : null}
                    </div>
                    <small style={{ display: "block", color: "var(--muted)", margin: "2px 0 10px" }}>
                      All subjects, or only some. Discounts come in the next step.
                    </small>
                    <div className="subject-pick-grid">
                      {lines.map((line) => (
                        <label key={line.subjectId} className={`check-card subject-pick${line.choice.selected ? " selected" : ""}`}>
                          <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <input
                              type="checkbox"
                              checked={line.choice.selected}
                              onChange={(event) => setChoice(line.subjectId, { selected: event.target.checked })}
                            />
                            <span>
                              <strong>{line.name}</strong>
                              <small>
                                {formatTaka(line.fee)} / month{line.teacherName ? ` · ${line.teacherName}` : ""}
                              </small>
                            </span>
                          </span>
                        </label>
                      ))}
                    </div>
                    <small style={{ display: "block", marginTop: 8, color: "var(--muted)" }}>
                      {selectedLines.length} of {lines.length} subject{lines.length === 1 ? "" : "s"} · {formatTaka(selectedLines.reduce((sum, line) => sum + line.fee, 0))} a month before discounts
                    </small>
                  </div>
                ) : null}
              </>
            ) : null}

            {step === 2 && batch ? (
              <>
                <div className="table-wrap" style={{ margin: "0 -22px" }}>
                  <table className="data-table" style={{ minWidth: 560 }}>
                    <thead>
                      <tr>
                        <th style={{ width: 40 }} />
                        <th>Subject</th>
                        <th className="num">Fee</th>
                        <th>Discount</th>
                        <th className="num">Monthly</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lines.map((line) => (
                        <tr key={line.subjectId} style={{ opacity: line.choice.selected ? 1 : 0.5 }}>
                          <td>
                            <input
                              type="checkbox"
                              checked={line.choice.selected}
                              onChange={(event) => setChoice(line.subjectId, { selected: event.target.checked })}
                              aria-label={`Take ${line.name}`}
                              style={{ width: 18, height: 18 }}
                            />
                          </td>
                          <td>
                            <strong>{line.name}</strong>
                            <span className="cell-sub">{line.teacherName || "Teacher not set"}</span>
                          </td>
                          <td className="num">{formatTaka(line.fee)}</td>
                          <td>
                            <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                              <SaSelect
                                size="sm"
                                style={{ width: 92 }}
                                value={line.choice.discountType}
                                disabled={!line.choice.selected}
                                onChange={(value) => setChoice(line.subjectId, { discountType: value as DiscountType, discountValue: "" })}
                                options={[
                                  { value: "none", label: "None" },
                                  { value: "percent", label: "%" },
                                  { value: "amount", label: "Tk" },
                                ]}
                              />
                              {line.choice.discountType !== "none" ? (
                                <>
                                  <input
                                    className="input sm"
                                    style={{ width: 72 }}
                                    type="number"
                                    min={0}
                                    max={line.choice.discountType === "percent" ? 100 : line.fee}
                                    value={line.choice.discountValue}
                                    onChange={(event) => setChoice(line.subjectId, { discountValue: event.target.value })}
                                    aria-label="Discount value"
                                  />
                                  <input
                                    className="input sm"
                                    style={{ width: 120 }}
                                    placeholder="Reason"
                                    value={line.choice.discountNote}
                                    onChange={(event) => setChoice(line.subjectId, { discountNote: event.target.value })}
                                    aria-label="Discount reason"
                                  />
                                </>
                              ) : null}
                            </div>
                          </td>
                          <td className="num">
                            <strong>{formatTaka(line.choice.selected ? line.net : 0)}</strong>
                            {line.choice.selected && line.discount > 0 ? <span className="cell-sub">−{formatTaka(line.discount)}</span> : null}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="form-grid three" style={{ marginTop: 20 }}>
                  <label className="field">
                    First month tuition
                    <input
                      className="input"
                      type="number"
                      min={0}
                      value={firstMonth ?? String(monthly)}
                      onChange={(event) => {
                        setFirstMonth(event.target.value);
                        setPayAmount(null);
                      }}
                    />
                    <small>
                      For {monthLabel(month)}. Full month is {formatTaka(monthly)}; change it if the student joins mid-month.
                    </small>
                  </label>
                  <label className="field">
                    Admission fee
                    <input
                      className="input"
                      type="number"
                      min={0}
                      value={admissionFee}
                      placeholder="0"
                      onChange={(event) => {
                        setAdmissionFee(event.target.value);
                        setPayAmount(null);
                      }}
                    />
                    <small>Typed in by hand for each student.</small>
                  </label>
                  <label className="field">
                    Materials fee
                    <input
                      className="input"
                      type="number"
                      min={0}
                      value={materialsFee}
                      placeholder="0"
                      onChange={(event) => {
                        setMaterialsFee(event.target.value);
                        setPayAmount(null);
                      }}
                    />
                    <small>Books, sheets and other materials. Leave empty if none.</small>
                  </label>
                </div>
              </>
            ) : null}

            {step === 3 && batch ? (
              <>
                <div className="summary-list" style={{ marginBottom: 18 }}>
                  <div>
                    <span>Student</span>
                    <span>
                      {details.name} · {details.gender === "female" ? "Female" : "Male"}
                    </span>
                  </div>
                  <div>
                    <span>Guardian</span>
                    <span>
                      {details.guardianName} · {details.guardianPhone}
                    </span>
                  </div>
                  <div>
                    <span>Batch</span>
                    <span>
                      <code>{batch.code}</code>
                    </span>
                  </div>
                  <div>
                    <span>Subjects</span>
                    <span>{selectedLines.map((line) => line.name).join(", ")}</span>
                  </div>
                  <div>
                    <span>Student ID</span>
                    <span>Given on save ({String(new Date().getFullYear() % 100)}{String(batch.classLevel).padStart(2, "0")}###)</span>
                  </div>
                </div>

                <label className="check-card" style={{ marginBottom: 16 }}>
                  <input type="checkbox" checked={collectNow} onChange={(event) => setCollectNow(event.target.checked)} />
                  <span>
                    <strong style={{ display: "block", fontSize: 14 }}>Collect payment now</strong>
                    <small style={{ color: "var(--muted)" }}>
                      Tick only if the guardian is paying right now — a receipt is created. Otherwise the bills stay as dues and you collect later.
                    </small>
                  </span>
                </label>

                {collectNow ? (
                  <div className="form-grid">
                    <label className="field">
                      Amount received
                      <input
                        className="input"
                        type="number"
                        min={0}
                        max={totalNow}
                        value={payAmount ?? ""}
                        placeholder="Type the amount received"
                        onChange={(event) => setPayAmount(event.target.value)}
                      />
                      <small>
                        {payValue <= 0 ? (
                          <>
                            Nothing entered yet.{" "}
                            <button type="button" className="text-button" onClick={() => setPayAmount(String(totalNow))}>
                              Full amount ({formatTaka(totalNow)})
                            </button>
                          </>
                        ) : payValue < totalNow ? (
                          `${formatTaka(totalNow - payValue)} will stay as due.`
                        ) : (
                          "Pays everything due now."
                        )}
                      </small>
                    </label>
                    <label className="field">
                      Method
                      <SaSelect
                        value={method}
                        onChange={(value) => setMethod(value as PaymentMethod)}
                        options={PAYMENT_METHODS.map((value) => ({ value, label: PAYMENT_METHOD_LABELS[value] }))}
                      />
                    </label>
                    {method !== "cash" ? (
                      <label className="field wide">
                        Transaction ID<span className="req">*</span>
                        <input className="input" value={transactionId} onChange={(event) => setTransactionId(event.target.value)} />
                      </label>
                    ) : null}
                  </div>
                ) : null}
              </>
            ) : null}
          </div>
          <div className="form-footer">
            <button type="button" className="btn-secondary" onClick={() => go(step - 1)} disabled={step === 0 || pending}>
              <ArrowLeft size={17} /> Back
            </button>
            {step < 3 ? (
              <button type="button" className="btn-primary" onClick={() => go(step + 1)}>
                Continue <ArrowRight size={17} />
              </button>
            ) : (
              <button type="button" className="btn-primary" onClick={submit} disabled={pending}>
                <CheckCircle2 size={17} /> {pending ? "Saving..." : collectNow && payValue > 0 ? "Admit & create receipt" : "Admit student"}
              </button>
            )}
          </div>
        </section>

        <aside className="panel" style={{ position: "sticky", top: 100 }}>
          <div className="panel-head">
            <div>
              <h2>Summary</h2>
              <p>{batch ? batch.label : "Choose a batch to see fees"}</p>
            </div>
          </div>
          <div className="panel-body">
            <div className="summary-list">
              <div>
                <span>Batch</span>
                <span>{batch ? <code>{batch.code}</code> : "—"}</span>
              </div>
              <div>
                <span>Subjects</span>
                <span>{batch ? selectedLines.length : "—"}</span>
              </div>
              <div>
                <span>Monthly tuition</span>
                <span>{formatTaka(monthly)}</span>
              </div>
              <div>
                <span>Monthly discount</span>
                <span>{discountTotal ? `−${formatTaka(discountTotal)}` : "—"}</span>
              </div>
              <div>
                <span>{monthLabel(month)} tuition</span>
                <span>{formatTaka(firstMonthValue)}</span>
              </div>
              <div>
                <span>Admission fee</span>
                <span>{formatTaka(admissionValue)}</span>
              </div>
              {materialsValue > 0 ? (
                <div>
                  <span>Materials fee</span>
                  <span>{formatTaka(materialsValue)}</span>
                </div>
              ) : null}
              <div className="total">
                <span>Due now</span>
                <span>{formatTaka(totalNow)}</span>
              </div>
              {step === 3 && collectNow ? (
                <div>
                  <span>Paying now</span>
                  <span>{formatTaka(payValue)}</span>
                </div>
              ) : null}
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
