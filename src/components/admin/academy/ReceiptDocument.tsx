import { ACADEMY_CONTACT, DUE_KIND_LABELS, PAYMENT_METHOD_LABELS, VERSION_SHORT } from "@/lib/academy/constants";
import { formatDate, formatTaka, monthLabel } from "@/lib/academy/codes";
import type { ReceiptView } from "@/lib/academy/queries";
import { takaInWords } from "@/lib/academy/words";

function Box({ checked, label }: { checked: boolean; label: string }) {
  return (
    <span className="rc-check">
      <i className={checked ? "on" : ""}>{checked ? "✓" : ""}</i>
      {label}
    </span>
  );
}

/** The printable money receipt, laid out like SAGE's paper receipt. */
export function ReceiptDocument({ receipt }: { receipt: ReceiptView }) {
  const kinds = new Set(receipt.allocations.map((allocation) => allocation.kind));
  const months = [...new Set(receipt.allocations.map((allocation) => allocation.month))].sort();
  const online = receipt.method !== "cash";
  const rows = receipt.allocations.flatMap((allocation) =>
    allocation.kind === "tuition" && allocation.lines.length > 0
      ? allocation.lines.map((line) => ({
          key: `${allocation.month}-${line.subjectName}`,
          item: line.subjectName,
          month: monthLabel(allocation.month, true),
          fee: line.fee,
          discount: line.discount,
          amount: line.amount,
        }))
      : [
          {
            key: `${allocation.month}-${allocation.label}`,
            item: allocation.label || DUE_KIND_LABELS[allocation.kind],
            month: monthLabel(allocation.month, true),
            fee: allocation.dueAmount + allocation.discount,
            discount: allocation.discount,
            amount: allocation.dueAmount,
          },
        ]
  );
  const billed = receipt.allocations.reduce((sum, allocation) => sum + allocation.dueAmount, 0);
  const adjustments = billed - rows.reduce((sum, row) => sum + row.amount, 0);

  return (
    <article className="receipt-a4 print-area" id="receipt-document">
      {receipt.status === "void" ? <div className="rc-void">VOID</div> : null}

      <header className="rc-head">
        <div>
          <h1>SAGE Academy</h1>
          <p>Money Receipt</p>
        </div>
      </header>

      <div className="rc-meta">
        <span>
          Receipt No. <b>{receipt.receiptNo}</b>
        </span>
        <span>
          Student ID <b>{receipt.snapshot.studentCode}</b>
        </span>
        <span>
          Date <b>{formatDate(receipt.paidAt)}</b>
        </span>
      </div>

      <div className="rc-line full">
        <label>Name :</label>
        <span>{receipt.snapshot.studentName}</span>
      </div>
      <div className="rc-row">
        <div className="rc-line">
          <label>Class :</label>
          <span>{receipt.snapshot.className}</span>
        </div>
        <div className="rc-line">
          <label>Batch :</label>
          <span>
            {receipt.snapshot.batchCode}
            <small> · {VERSION_SHORT[receipt.snapshot.version]}</small>
          </span>
        </div>
      </div>

      <p className="rc-label">Subjects</p>
      <table className="rc-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Month</th>
            <th>Fee</th>
            <th>Discount</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key}>
              <td>
                <span className="rc-tick">✓</span> {row.item}
              </td>
              <td>{row.month}</td>
              <td>{formatTaka(row.fee)}</td>
              <td>{row.discount ? `−${formatTaka(row.discount)}` : "—"}</td>
              <td>{formatTaka(row.amount)}</td>
            </tr>
          ))}
          {adjustments !== 0 ? (
            <tr>
              <td colSpan={4}>First month adjustment</td>
              <td>
                {adjustments > 0 ? "+" : "−"}
                {formatTaka(Math.abs(adjustments))}
              </td>
            </tr>
          ) : null}
          {receipt.oneTimeDiscount > 0 ? (
            <tr>
              <td colSpan={4}>One-time discount{receipt.oneTimeDiscountNote ? ` (${receipt.oneTimeDiscountNote})` : ""}</td>
              <td>−{formatTaka(receipt.oneTimeDiscount)}</td>
            </tr>
          ) : null}
        </tbody>
      </table>

      <div className="rc-inline">
        <label>Fee type:</label>
        <Box checked={kinds.has("admission")} label="Admission" />
        {kinds.has("materials") ? <Box checked label="Materials" /> : null}
        <Box checked={kinds.has("exam")} label="Exam" />
        <Box checked={kinds.has("tuition")} label="Tuition" />
        {kinds.has("other") ? <Box checked label="Other" /> : null}
      </div>

      <div className="rc-row">
        <div className="rc-line">
          <label>Month :</label>
          <span>{months.map((value) => monthLabel(value, true)).join(", ")}</span>
        </div>
        <div className="rc-line">
          <label>Date :</label>
          <span>{formatDate(receipt.paidAt)}</span>
        </div>
      </div>

      <div className="rc-line full small">
        <label>Total payment :</label>
        <span>
          {formatTaka(receipt.amount)} <small>({takaInWords(receipt.amount)})</small>
        </span>
      </div>

      <div className="rc-inline">
        <label>Payment Method:</label>
        <Box checked={!online} label="Cash" />
        <Box checked={online} label={online ? `Online payment — ${PAYMENT_METHOD_LABELS[receipt.method]}${receipt.transactionId ? ` · ${receipt.transactionId}` : ""}` : "Online payment"} />
      </div>

      <div className="rc-row three">
        <div className="rc-line">
          <label>Paid :</label>
          <span>{formatTaka(receipt.amount)}</span>
        </div>
        <div className="rc-line">
          <label>Discount:</label>
          <span>{receipt.discountTotal ? formatTaka(receipt.discountTotal) : "—"}</span>
        </div>
        <div className="rc-line">
          <label>Due:</label>
          <span>{formatTaka(receipt.dueAfter)}</span>
        </div>
      </div>

      {receipt.note ? <p className="rc-note">Note: {receipt.note}</p> : null}

      <div className="rc-sign">
        <div>
          <span className="rc-sign-name">{receipt.receivedBy}</span>
          <span className="rc-sign-line" />
          <b>Signature</b>
        </div>
      </div>

      {/* admin-language-allow-start — printed message to guardians, as on the paper receipt */}
      <footer className="rc-foot">
        <b>প্রিয় অভিভাবক,</b>
        <p>সন্তানের সুন্দর ভবিষ্যতের পথে আপনার আস্থা আমাদের সবচেয়ে বড় প্রেরণা।</p>
        <p>আপনার স্বপ্ন, আমাদের যত্ন—একসাথে গড়ে উঠুক আগামী দিনের সাফল্য।</p>
        {/* admin-language-allow-end */}
        <small>
          {ACADEMY_CONTACT.name} · {ACADEMY_CONTACT.address} · {ACADEMY_CONTACT.phones.join(", ")} · {ACADEMY_CONTACT.email}
        </small>
      </footer>
    </article>
  );
}
