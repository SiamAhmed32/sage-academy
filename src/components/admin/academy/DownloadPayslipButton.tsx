"use client";

import { useRef, useState } from "react";
import { FileText } from "lucide-react";
import { toast } from "react-toastify";

import type { RoutineSheetInfo } from "@/components/admin/sa/RoutineSheet";
import { exportElementToPdf } from "@/components/admin/sa/export-pdf";
import { ACADEMY_CONTACT } from "@/lib/academy/constants";
import { formatDate, formatTaka, monthLabel } from "@/lib/academy/codes";

export type PayslipBill = {
  id: string;
  month: string;
  label: string;
  details: string;
  amount: number;
  paid: number;
};

/**
 * Downloads a payslip: what the student owes right now, to hand to the
 * guardian before they pay. It records nothing — money is only counted when
 * staff use Collect payment, which issues the receipt.
 */
export function DownloadPayslipButton({ bills, info, fileName }: { bills: PayslipBill[]; info: RoutineSheetInfo; fileName: string }) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const total = bills.reduce((sum, bill) => sum + Math.max(0, bill.amount - bill.paid), 0);

  async function download() {
    if (bills.length === 0) {
      toast.info("Nothing is due right now, so there is no payslip to give.");
      return;
    }
    if (!sheetRef.current) return;
    setBusy(true);
    try {
      const result = await exportElementToPdf(sheetRef.current, fileName, { orientation: "portrait", marginMm: 8 });
      if (result === "saved") toast.success("Payslip downloaded.");
    } catch {
      toast.error("Could not download the payslip.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button type="button" className="btn-secondary" onClick={download} disabled={busy}>
        <FileText size={17} /> {busy ? "Preparing…" : "Download payslip"}
      </button>

      <div className="routine-sheet-host" aria-hidden="true">
        <div className="routine-sheet payslip-sheet" ref={sheetRef}>
          <header className="routine-sheet-head">
            <div className="routine-sheet-brand">
              {/* eslint-disable-next-line @next/next/no-img-element -- drawn into the PDF, needs a plain <img> */}
              <img src="/sage-wordmark.png" alt="SAGE" />
              <div>
                <strong>{ACADEMY_CONTACT.name}</strong>
                <span>{ACADEMY_CONTACT.address}</span>
                <span>
                  {ACADEMY_CONTACT.phones.join(" · ")} · {ACADEMY_CONTACT.email}
                </span>
              </div>
            </div>
            <div className="routine-sheet-title">
              <h1>Payslip</h1>
              <span>Issued {formatDate(new Date().toISOString())}</span>
            </div>
          </header>

          <dl className="routine-sheet-info">
            {info.map((item) => (
              <div key={item.label}>
                <dt>{item.label}</dt>
                <dd>{item.value || "—"}</dd>
              </div>
            ))}
          </dl>

          <table className="payslip-table">
            <thead>
              <tr>
                <th>Month</th>
                <th>Bill</th>
                <th>Details</th>
                <th className="num">Amount</th>
                <th className="num">Paid</th>
                <th className="num">Due</th>
              </tr>
            </thead>
            <tbody>
              {bills.map((bill) => (
                <tr key={bill.id}>
                  <td>{monthLabel(bill.month, true)}</td>
                  <td>{bill.label}</td>
                  <td className="muted">{bill.details || "—"}</td>
                  <td className="num">{formatTaka(bill.amount)}</td>
                  <td className="num">{bill.paid ? formatTaka(bill.paid) : "—"}</td>
                  <td className="num strong">{formatTaka(Math.max(0, bill.amount - bill.paid))}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={5}>Total to pay</td>
                <td className="num">{formatTaka(total)}</td>
              </tr>
            </tfoot>
          </table>

          <div className="payslip-note">
            <strong>How to pay</strong>
            <span>
              Pay at the SAGE Academy office in cash, or by bKash, Nagad or bank transfer. Please quote the Student ID. A money receipt is given when
              the payment is received.
            </span>
          </div>

          <footer className="routine-sheet-foot">
            <span>This is a payslip, not a receipt.</span>
            <span>
              {ACADEMY_CONTACT.name} · {ACADEMY_CONTACT.phones[0]}
            </span>
          </footer>
        </div>
      </div>
    </>
  );
}
