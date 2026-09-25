"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Info, Receipt, UserRound, X } from "lucide-react";

import { SaSelect } from "@/components/admin/sa/SaSelect";
import { Avatar, StatusChip } from "@/components/admin/sa/ui";
import { collectPaymentAction, paymentContextAction, type PaymentContext } from "@/app/admin/academy/_actions/finance";
import { DUE_KIND_LABELS, PAYMENT_METHODS, PAYMENT_METHOD_LABELS, type PaymentMethod } from "@/lib/academy/constants";
import { currentMonthKey, formatTaka, monthLabel } from "@/lib/academy/codes";
import { AddChargeButton } from "./StudentWidgets";
import { StudentPicker } from "./StudentPicker";
import { ErrorNotice, useAction } from "./use-action";

function todayInput() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function CollectPayment({
  initialStudentId,
  initialContext,
}: {
  initialStudentId: string;
  initialContext: PaymentContext | null;
}) {
  const router = useRouter();
  const [studentId, setStudentId] = useState(initialStudentId);
  const [context, setContext] = useState<PaymentContext | null>(initialContext);
  const [loadFailed, setLoadFailed] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set((initialContext?.openDues ?? []).filter((due) => due.month <= currentMonthKey()).map((due) => due.id))
  );
  const [advance, setAdvance] = useState<string[]>([]);
  const [amount, setAmount] = useState<string | null>(null);
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [transactionId, setTransactionId] = useState("");
  const [paidAt, setPaidAt] = useState(todayInput());
  const [note, setNote] = useState("");
  // One-time discount: this payment only; future months keep the normal fees.
  const [discountType, setDiscountType] = useState<"amount" | "percent">("amount");
  const [discountValue, setDiscountValue] = useState("");
  const [discountNote, setDiscountNote] = useState("");
  const { pending, error, setError, run } = useAction();
  const month = currentMonthKey();

  // Loading until the chosen student's bills have arrived (or failed).
  const loading = Boolean(studentId) && context?.student.id !== studentId && !loadFailed;

  const apply = useCallback(
    (result: Awaited<ReturnType<typeof paymentContextAction>>) => {
      if (!result.ok || !result.data) {
        setLoadFailed(true);
        setError(result.ok ? "Could not load this student." : result.message);
        return;
      }
      setLoadFailed(false);
      setContext(result.data);
      // Everything owed up to this month is selected by default.
      setSelected(new Set(result.data.openDues.filter((due) => due.month <= month).map((due) => due.id)));
      setAdvance([]);
      setAmount(null);
    },
    [month, setError]
  );

  // Fetched from event handlers only; a `?student=` link arrives with its bills already loaded.
  const load = useCallback(async (id: string) => apply(await paymentContextAction(id)), [apply]);

  const openDues = useMemo(() => context?.openDues ?? [], [context]);
  const selectedDues = openDues.filter((due) => selected.has(due.id));
  const advanceRows = (context?.advance ?? []).filter((row) => advance.includes(row.month));
  const selectedTotal =
    selectedDues.reduce((sum, due) => sum + (due.amount - due.paid), 0) + advanceRows.reduce((sum, row) => sum + row.amount, 0);
  const rawDiscount = Math.max(0, Number(discountValue || 0));
  const oneTimeDiscount = Math.min(
    Math.max(0, selectedTotal - 1),
    Math.round(discountType === "percent" ? (selectedTotal * Math.min(100, rawDiscount)) / 100 : rawDiscount)
  );
  const payableTotal = selectedTotal - oneTimeDiscount;
  const amountValue = amount === null ? payableTotal : Number(amount || 0);
  const discountTotal = selectedDues.reduce((sum, due) => sum + due.lines.reduce((acc, line) => acc + line.discount, 0), 0);
  const owedNow = openDues.filter((due) => due.month <= month).reduce((sum, due) => sum + (due.amount - due.paid), 0);

  const byMonth = useMemo(() => {
    const groups = new Map<string, typeof openDues>();
    for (const due of openDues) groups.set(due.month, [...(groups.get(due.month) ?? []), due]);
    return [...groups.entries()];
  }, [openDues]);

  function toggleDue(id: string) {
    setSelected((value) => {
      const next = new Set(value);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setAmount(null);
  }

  function toggleAdvance(target: string) {
    const months = (context?.advance ?? []).map((row) => row.month);
    const index = months.indexOf(target);
    // Advance months are paid in order: ticking March ticks February too.
    setAdvance(advance.includes(target) ? months.slice(0, index) : months.slice(0, index + 1));
    setAmount(null);
  }

  function submit() {
    if (!context) return;
    if (oneTimeDiscount > 0 && !discountNote.trim()) return setError("Write a reason for the one-time discount.");
    if (amountValue <= 0) return setError("Enter the amount received.");
    if (amountValue > payableTotal) return setError("The amount is more than the selected bills. Tick more months or lower the amount.");
    if (method !== "cash" && !transactionId.trim()) return setError("Enter the transaction ID for online payments.");
    run(
      () =>
        collectPaymentAction({
          studentId: context.student.id,
          dueIds: selectedDues.map((due) => due.id),
          advanceMonths: advanceRows.map((row) => row.month),
          amount: amountValue,
          method,
          transactionId,
          paidAt,
          note,
          oneTimeDiscount,
          oneTimeDiscountNote: discountNote,
        }),
      { refresh: false, onSuccess: (data) => data && router.push(`/admin/academy/receipts/${data.receiptNo}`) }
    );
  }

  if (!studentId) {
    return (
      <section className="panel" style={{ maxWidth: 760 }}>
        <div className="panel-head">
          <div>
            <h2>Find the student</h2>
            <p>Search by name, student ID or guardian phone.</p>
          </div>
        </div>
        <div className="panel-body">
          <StudentPicker
            onPick={(student) => {
              setLoadFailed(false);
              setStudentId(student.id);
              load(student.id);
            }}
            autoFocus
          />
        </div>
      </section>
    );
  }

  return (
    <div className="two-panels">
      <div className="stack">
        <section className="panel">
          <div className="panel-head">
            <div style={{ display: "flex", gap: 12, alignItems: "center", minWidth: 0 }}>
              <Avatar name={context?.student.name ?? "?"} />
              <div style={{ minWidth: 0 }}>
                <h2>{context?.student.name ?? (loading ? "Loading..." : "Student")}</h2>
                {context ? (
                  <p>
                    {context.student.studentId} · {context.student.className} · {context.student.batchCode} · {context.student.guardianPhone}
                  </p>
                ) : null}
              </div>
            </div>
            <div className="heading-actions">
              {context ? (
                <Link href={`/admin/academy/students/${context.student.id}?tab=billing`} className="row-action">
                  <UserRound size={14} /> Profile
                </Link>
              ) : null}
              <button type="button" className="row-action" onClick={() => { setStudentId(""); setContext(null); router.replace("/admin/academy/payments"); }}>
                <X size={14} /> Change
              </button>
            </div>
          </div>
          {context?.student.status === "inactive" ? (
            <div className="panel-body" style={{ paddingBottom: 12 }}>
              <div className="notice warn">
                <Info size={16} />
                <span>This student has left. You can still collect old dues.</span>
              </div>
            </div>
          ) : null}
        </section>

        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>What are they paying for?</h2>
              <p>Money clears the oldest bill first. Anything unpaid stays as due.</p>
            </div>
            {context ? <AddChargeButton studentId={context.student.id} onDone={() => load(context.student.id)} /> : null}
          </div>
          <div className="panel-body">
            {loading ? <p className="cell-sub">Loading bills...</p> : null}
            {!loading && context && openDues.length === 0 && context.advance.length === 0 ? (
              <div className="notice success">
                <CheckCircle2 size={16} />
                <span>Nothing is due.</span>
              </div>
            ) : null}
            <div style={{ display: "grid", gap: 10 }}>
              {byMonth.map(([dueMonth, dues]) =>
                dues.map((due) => {
                  const remaining = due.amount - due.paid;
                  return (
                    <label key={due.id} className={`check-card${selected.has(due.id) ? " selected" : ""}`} style={{ alignItems: "flex-start" }}>
                      <input type="checkbox" checked={selected.has(due.id)} onChange={() => toggleDue(due.id)} />
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                          <strong style={{ fontSize: 14 }}>
                            {monthLabel(dueMonth)} · {due.label || DUE_KIND_LABELS[due.kind]}
                          </strong>
                          <strong style={{ fontSize: 15 }}>{formatTaka(remaining)}</strong>
                        </span>
                        <small style={{ display: "block", color: "var(--muted)", marginTop: 4 }}>
                          {due.lines.length > 0
                            ? due.lines.map((line) => `${line.subjectName} ${formatTaka(line.amount)}${line.discount ? ` (−${formatTaka(line.discount)})` : ""}`).join(" · ")
                            : DUE_KIND_LABELS[due.kind]}
                          {due.paid > 0 ? ` · ${formatTaka(due.paid)} already paid` : ""}
                        </small>
                        {dueMonth < month ? <StatusChip tone="warning">Previous due</StatusChip> : null}
                        {dueMonth > month ? <StatusChip tone="info">Advance</StatusChip> : null}
                      </span>
                    </label>
                  );
                })
              )}
            </div>

            {context && context.advance.length > 0 ? (
              <>
                <p className="eyebrow" style={{ margin: "20px 0 10px" }}>
                  Pay in advance
                </p>
                <div className="segmented">
                  {context.advance.map((row) => (
                    <button key={row.month} type="button" className={advance.includes(row.month) ? "active" : ""} onClick={() => toggleAdvance(row.month)}>
                      {monthLabel(row.month, true)} · {formatTaka(row.amount)}
                    </button>
                  ))}
                </div>
              </>
            ) : null}
          </div>
        </section>
      </div>

      <aside className="panel" style={{ position: "sticky", top: 100 }}>
        <div className="panel-head">
          <div>
            <h2>Payment</h2>
            <p>A receipt number is given when you save.</p>
          </div>
        </div>
        <div className="panel-body">
          <ErrorNotice message={error} />
          <div className="summary-list" style={{ marginBottom: 16 }}>
            <div>
              <span>Owed up to {monthLabel(month, true)}</span>
              <span>{formatTaka(owedNow)}</span>
            </div>
            <div>
              <span>Selected bills</span>
              <span>{selectedDues.length + advanceRows.length}</span>
            </div>
            <div>
              <span>Discount on these bills</span>
              <span>{discountTotal ? formatTaka(discountTotal) : "—"}</span>
            </div>
            <div>
              <span>Selected total</span>
              <span>{formatTaka(selectedTotal)}</span>
            </div>
            {oneTimeDiscount > 0 ? (
              <div>
                <span>One-time discount</span>
                <span>−{formatTaka(oneTimeDiscount)}</span>
              </div>
            ) : null}
            <div className="total">
              <span>To pay</span>
              <span>{formatTaka(payableTotal)}</span>
            </div>
          </div>
          <div className="field">
            One-time discount
            <div className="discount-row">
              <SaSelect
                size="sm"
                style={{ width: 96 }}
                value={discountType}
                ariaLabel="Discount type"
                onChange={(value) => {
                  setDiscountType(value as "amount" | "percent");
                  setAmount(null);
                }}
                options={[
                  { value: "amount", label: "Tk" },
                  { value: "percent", label: "%" },
                ]}
              />
              <input
                className="input sm"
                type="number"
                min={0}
                max={discountType === "percent" ? 100 : selectedTotal}
                value={discountValue}
                placeholder="0"
                aria-label="Discount"
                onChange={(event) => {
                  setDiscountValue(event.target.value);
                  setAmount(null);
                }}
              />
            </div>
            <small>This payment only — next months keep the normal fees. For a monthly discount, use the Subjects tab.</small>
          </div>
          {oneTimeDiscount > 0 ? (
            <label className="field">
              Discount reason<span className="req">*</span>
              <input className="input" value={discountNote} maxLength={120} placeholder="e.g. Sibling, hardship, late admission" onChange={(event) => setDiscountNote(event.target.value)} />
            </label>
          ) : null}
          <label className="field">
            Amount received<span className="req">*</span>
            <input className="input" type="number" min={1} max={payableTotal} value={amount ?? String(payableTotal)} onChange={(event) => setAmount(event.target.value)} />
            <small>
              {amountValue < payableTotal && amountValue > 0
                ? `Partial payment — ${formatTaka(payableTotal - amountValue)} stays due.`
                : "Pays the selected bills in full."}
            </small>
          </label>
          <div className="form-grid">
            <label className="field">
              Method
              <SaSelect
                value={method}
                onChange={(value) => setMethod(value as PaymentMethod)}
                options={PAYMENT_METHODS.map((value) => ({ value, label: PAYMENT_METHOD_LABELS[value] }))}
              />
            </label>
            <label className="field">
              Date
              <input className="input" type="date" value={paidAt} max={todayInput()} onChange={(event) => setPaidAt(event.target.value)} />
            </label>
          </div>
          {method !== "cash" ? (
            <label className="field">
              Transaction ID<span className="req">*</span>
              <input className="input" value={transactionId} onChange={(event) => setTransactionId(event.target.value)} />
            </label>
          ) : null}
          <label className="field">
            Note (optional)
            <input className="input" value={note} onChange={(event) => setNote(event.target.value)} />
          </label>
          <button type="button" className="btn-primary" style={{ width: "100%" }} disabled={pending || !context || selectedTotal <= 0} onClick={submit}>
            <Receipt size={17} /> {pending ? "Saving..." : `Save & print receipt · ${formatTaka(amountValue)}`}
          </button>
        </div>
      </aside>
    </div>
  );
}
