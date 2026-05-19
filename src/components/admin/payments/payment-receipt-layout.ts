import type jsPDF from "jspdf";

import { methodLabelsReceiptEn } from "./payment-options";
import { money, type ReceiptLineItem, type ReceiptPayment } from "./payment-receipt";

/** Formal payslip palette: black/gray structure, minimal accent. */
const INK: [number, number, number] = [24, 24, 24];
const INK_MUTED: [number, number, number] = [82, 82, 90];
const GRID: [number, number, number] = [46, 46, 46];
const GRID_LIGHT: [number, number, number] = [190, 190, 195];
const ROW_ALT: [number, number, number] = [250, 250, 251];
const ACCENT: [number, number, number] = [109, 15, 18];

const M = 48;
const W = 595;
const PAGE_H = 842;
const INNER = W - M * 2;

const TABLE_TOP_FIRST = 292;
const TABLE_TOP_CONT = 72;
const TABLE_HEADER_H = 22;
const TABLE_ROW_H = 24;

type DrawContext = {
  doc: jsPDF;
  payment: ReceiptPayment;
  items: ReceiptLineItem[];
  totalDiscount: number;
  due: number;
};

function setFont(doc: jsPDF, style: "normal" | "bold" | "italic" = "normal") {
  doc.setFont("helvetica", style === "bold" ? "bold" : style === "italic" ? "italic" : "normal");
}

function paymentMethodEn(methodKey: string) {
  const k = String(methodKey || "").toLowerCase().trim();
  if (methodLabelsReceiptEn[k]) return methodLabelsReceiptEn[k];
  const raw = String(methodKey || "").trim();
  if (raw && /^[\x20-\x7E]+$/.test(raw)) return raw;
  return "Other";
}

function drawWrapped(
  doc: jsPDF,
  text: string,
  x: number,
  yStart: number,
  maxWidth: number,
  lineHeight: number,
  size: number
) {
  setFont(doc, "normal");
  doc.setFontSize(size);
  const lines = doc.splitTextToSize(text, maxWidth);
  doc.text(lines, x, yStart);
  return yStart + lines.length * lineHeight;
}

/** Bordered reference box: receipt # and date on separate bands with divider (no overlap). */
function drawReceiptReference(doc: jsPDF, payment: ReceiptPayment) {
  const boxW = 168;
  const boxX = M + INNER - boxW;
  const boxY = 44;
  const boxH = 96;
  const pad = 12;

  doc.setDrawColor(...GRID);
  doc.setLineWidth(0.6);
  doc.rect(boxX, boxY, boxW, boxH);

  doc.setTextColor(...INK_MUTED);
  setFont(doc, "normal");
  doc.setFontSize(8);
  doc.text("Receipt number", boxX + pad, boxY + 18);

  doc.setTextColor(...INK);
  setFont(doc, "bold");
  doc.setFontSize(11);
  const ref = payment._id.slice(-8).toUpperCase();
  doc.text(ref, boxX + pad, boxY + 34);

  doc.setDrawColor(...GRID_LIGHT);
  doc.setLineWidth(0.4);
  doc.line(boxX + pad, boxY + 44, boxX + boxW - pad, boxY + 44);

  doc.setTextColor(...INK_MUTED);
  setFont(doc, "normal");
  doc.setFontSize(8);
  doc.text("Date issued", boxX + pad, boxY + 58);

  doc.setTextColor(...INK);
  setFont(doc, "bold");
  doc.setFontSize(11);
  const dateStr = new Date(payment.createdAt).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  doc.text(dateStr, boxX + pad, boxY + 76);
}

function header({ doc, payment }: DrawContext) {
  doc.setDrawColor(...ACCENT);
  doc.setLineWidth(2);
  doc.line(M, 36, M + 140, 36);

  doc.setTextColor(...INK);
  setFont(doc, "bold");
  doc.setFontSize(18);
  doc.text("SAGE", M, 58);

  setFont(doc, "bold");
  doc.setFontSize(10);
  const legal = "Standard Academy for Greater Education";
  const yAfter = drawWrapped(doc, legal, M, 72, 320, 13, 10);

  doc.setTextColor(...INK_MUTED);
  setFont(doc, "normal");
  doc.setFontSize(9);
  doc.text("Institution address: H-36, R-3, Block-C, Banasree, Rampura, Dhaka", M, yAfter + 4);

  doc.setTextColor(...INK);
  setFont(doc, "bold");
  doc.setFontSize(11);
  doc.text("PAYMENT RECEIPT", M, yAfter + 22);
  doc.setDrawColor(...GRID_LIGHT);
  doc.setLineWidth(0.35);
  doc.line(M, yAfter + 26, M + 200, yAfter + 26);

  drawReceiptReference(doc, payment);
}

function labelValueRow(doc: jsPDF, label: string, value: string, x: number, y: number, labelW: number) {
  doc.setTextColor(...INK_MUTED);
  setFont(doc, "normal");
  doc.setFontSize(8);
  doc.text(label, x, y);
  doc.setTextColor(...INK);
  setFont(doc, "normal");
  doc.setFontSize(10);
  doc.text(value, x + labelW, y);
}

/** Space reserved below the fee table on the last page (summary + signatures + gap). */
const SUMMARY_AND_SIG_RESERVE = 190;

function rowsThatFit(tableTop: number, yMaxExclusive: number) {
  return Math.max(1, Math.floor((yMaxExclusive - tableTop - TABLE_HEADER_H) / TABLE_ROW_H));
}

/** Split line items: one chunk if everything fits on page 1 with summary; else table-only pages then a last chunk with room for summary. */
function chunkLineItems(items: ReceiptLineItem[]): ReceiptLineItem[][] {
  const n = items.length;
  const maxTableBottomSingle = PAGE_H - SUMMARY_AND_SIG_RESERVE;
  const capSingle = rowsThatFit(TABLE_TOP_FIRST, maxTableBottomSingle);
  const capFirst = rowsThatFit(TABLE_TOP_FIRST, PAGE_H - 24);
  const capMid = rowsThatFit(TABLE_TOP_CONT, PAGE_H - 24);
  const capLast = rowsThatFit(TABLE_TOP_CONT, maxTableBottomSingle);
  if (n <= capSingle) return [items];

  const chunks: ReceiptLineItem[][] = [];
  let i = 0;
  chunks.push(items.slice(i, i + capFirst));
  i += capFirst;
  while (i < n) {
    const left = n - i;
    if (left <= capLast) {
      chunks.push(items.slice(i));
      break;
    }
    chunks.push(items.slice(i, i + capMid));
    i += capMid;
  }
  return chunks;
}

function drawTableContinuationBanner(doc: jsPDF) {
  doc.setDrawColor(...GRID_LIGHT);
  doc.setLineWidth(0.35);
  doc.line(M, 52, M + INNER, 52);
  doc.setTextColor(...INK_MUTED);
  setFont(doc, "normal");
  doc.setFontSize(9);
  doc.text("SAGE - Payment receipt (continued)", M, 42);
}

function studentBlock({ doc, payment, due }: DrawContext) {
  const top = 148;
  const pad = 14;
  const labelW = 118;
  const innerW = INNER - pad * 2 - labelW;
  let y = top + pad + 10;

  doc.setDrawColor(...GRID);
  doc.setLineWidth(0.55);
  doc.rect(M, top, INNER, 132);

  doc.setTextColor(...INK_MUTED);
  setFont(doc, "bold");
  doc.setFontSize(8);
  doc.text("PARTY / STUDENT", M + pad, top + pad);

  doc.setTextColor(...INK);
  setFont(doc, "bold");
  doc.setFontSize(12);
  const name = payment.student.nameEnglish || "Student";
  const nameLines = doc.splitTextToSize(name, innerW);
  doc.text(nameLines, M + pad + labelW, y);
  y += nameLines.length * 14 + 6;

  const status = due > 0 ? "Partial payment (balance due)" : "Paid in full for this receipt";
  labelValueRow(doc, "Status", status, M + pad, y, labelW);
  y += 16;
  labelValueRow(doc, "Student ID", payment.student.studentId, M + pad, y, labelW);
  y += 16;
  labelValueRow(doc, "Billing period", `${payment.month} ${payment.year}`, M + pad, y, labelW);
  y += 16;
  labelValueRow(doc, "Payment method", paymentMethodEn(payment.paymentMethod), M + pad, y, labelW);
}

function drawFeeTable(
  doc: jsPDF,
  payment: ReceiptPayment,
  items: ReceiptLineItem[],
  tableTop: number,
  globalStartIndex: number
) {
  const left = M;
  const tableW = INNER;
  const tabRight = left + tableW;
  const headerH = TABLE_HEADER_H;
  const rowH = TABLE_ROW_H;
  const bottom = tableTop + headerH + items.length * rowH;

  const xAfterNum = left + 28;
  const xAfterDesc = left + 212;
  const xAfterMonth = left + 282;
  const xAfterFee = left + 356;
  const xAfterDisc = left + 430;
  const vxs = [xAfterNum, xAfterDesc, xAfterMonth, xAfterFee, xAfterDisc];

  const xFeeR = xAfterFee - 8;
  const xDiscR = xAfterDisc - 8;
  const xPayR = tabRight - 10;

  const xNum = left + 10;
  const xDesc = xAfterNum + 5;
  const descMaxW = xAfterDesc - xDesc - 5;
  const xMonth = xAfterDesc + 5;
  const monthMaxW = xAfterMonth - xMonth - 5;

  doc.setFillColor(...GRID);
  doc.rect(left, tableTop, tableW, headerH, "F");

  items.forEach((item, index) => {
    const rowTop = tableTop + headerH + index * rowH;
    if (index % 2 === 0) {
      doc.setFillColor(...ROW_ALT);
      doc.rect(left, rowTop, tableW, rowH, "F");
    }
  });

  doc.setTextColor(255, 255, 255);
  setFont(doc, "bold");
  doc.setFontSize(8);
  const hb = tableTop + headerH - 7;
  doc.text("#", xNum, hb);
  doc.text("Description", xDesc, hb);
  doc.text("Month", xMonth, hb);
  doc.text("Fee (BDT)", xFeeR, hb, { align: "right" });
  doc.text("Discount", xDiscR, hb, { align: "right" });
  doc.text("Payable", xPayR, hb, { align: "right" });

  doc.setTextColor(...INK);
  items.forEach((item, index) => {
    const rowTop = tableTop + headerH + index * rowH;
    const baseline = rowTop + rowH - 8;
    const displayNo = globalStartIndex + index + 1;
    setFont(doc, "normal");
    doc.setFontSize(9);
    doc.text(String(displayNo), xNum, baseline);
    setFont(doc, "bold");
    const raw = item.label || item.type;
    const lines = doc.splitTextToSize(raw, descMaxW);
    const desc = lines.length > 1 ? `${String(lines[0]).replace(/\s+$/, "")}...` : raw;
    doc.text(desc, xDesc, baseline, { maxWidth: descMaxW });
    setFont(doc, "normal");
    doc.text(`${item.month || payment.month} ${item.year || payment.year}`, xMonth, baseline, { maxWidth: monthMaxW });
    doc.text(money(item.fee), xFeeR, baseline, { align: "right" });
    doc.text(money(item.discount), xDiscR, baseline, { align: "right" });
    doc.text(money(item.amount), xPayR, baseline, { align: "right" });
  });

  doc.setDrawColor(...GRID);
  doc.setLineWidth(0.55);
  doc.rect(left, tableTop, tableW, bottom - tableTop);
  doc.line(left, tableTop + headerH, left + tableW, tableTop + headerH);
  for (let r = 1; r <= items.length; r++) {
    const y = tableTop + headerH + r * rowH;
    doc.setDrawColor(...GRID_LIGHT);
    doc.setLineWidth(0.35);
    doc.line(left, y, left + tableW, y);
  }
  doc.setDrawColor(...GRID);
  doc.setLineWidth(0.45);
  vxs.forEach((vx) => {
    doc.line(vx, tableTop, vx, bottom);
  });

  return bottom;
}

function summary({ doc, payment, totalDiscount, due }: DrawContext, y: number): number {
  const totalsW = 210;
  const totalsX = M + INNER - totalsW;
  const notesW = totalsX - M - 20;
  const blockTop = y + 12;
  const pad = 14;
  const ix = totalsX + pad;
  const iw = totalsW - pad * 2;
  const rowGap = 24;
  const labelSize = 8;
  const valueSizeNormal = 10;
  const valueSizeBold = 12;

  doc.setDrawColor(...GRID_LIGHT);
  doc.setLineWidth(0.35);
  doc.line(M, y, M + INNER, y);

  doc.setTextColor(...INK);
  setFont(doc, "bold");
  doc.setFontSize(10);
  doc.text("Notes", M, y + 18);
  doc.setTextColor(...INK_MUTED);
  setFont(doc, "normal");
  doc.setFontSize(9);
  let ny = y + 32;
  ny = drawWrapped(doc, "Retain this receipt for your records.", M, ny, notesW, 12, 9) + 6;
  const notesEnd =
    drawWrapped(
      doc,
      "For cash or offline payments, valid after office verification and ledger entry.",
      M,
      ny,
      notesW,
      12,
      9
    ) + 8;

  function drawTotalRow(baselineY: number, label: string, val: string, boldVal: boolean) {
    doc.setTextColor(...INK_MUTED);
    setFont(doc, "normal");
    doc.setFontSize(labelSize);
    doc.text(label.toUpperCase(), ix, baselineY);
    doc.setTextColor(...INK);
    setFont(doc, boldVal ? "bold" : "normal");
    doc.setFontSize(boldVal ? valueSizeBold : valueSizeNormal);
    doc.text(val, ix + iw, baselineY, { align: "right" });
  }

  let ry = blockTop + pad + 10;
  const receiptSummary = payment.receiptSummary;
  drawTotalRow(ry, "Previous paid", money(receiptSummary?.previousPaid ?? 0), false);
  ry += rowGap;
  drawTotalRow(ry, "This payment", money(receiptSummary?.currentPaid ?? payment.amount), true);
  ry += rowGap;
  drawTotalRow(ry, "Total paid", money(receiptSummary?.totalPaid ?? payment.amount), false);
  ry += rowGap;
  drawTotalRow(ry, "Remaining due", money(receiptSummary?.remainingDue ?? due), false);
  ry += rowGap;
  drawTotalRow(ry, "Total discount", money(totalDiscount), false);
  ry += rowGap;
  const sepY = ry + 8;
  doc.setDrawColor(...GRID_LIGHT);
  doc.setLineWidth(0.45);
  doc.line(ix, sepY, ix + iw, sepY);
  ry = sepY + 16;
  drawTotalRow(ry, "Amount received", money(payment.amount), true);
  const blockBottom = ry + 28;
  const blockH = blockBottom - blockTop;

  doc.setDrawColor(...GRID);
  doc.setLineWidth(0.55);
  doc.rect(totalsX, blockTop, totalsW, blockH);

  return Math.max(notesEnd, blockBottom + 10);
}

function footer(doc: jsPDF, summaryBottom: number) {
  const bandH = 76;
  const bandTop = PAGE_H - bandH;
  const sigLineY = Math.min(Math.max(summaryBottom + 12, bandTop - 58), bandTop - 22);
  doc.setDrawColor(...GRID_LIGHT);
  doc.setLineWidth(0.35);
  doc.line(M, sigLineY, M + INNER / 2 - 32, sigLineY);
  doc.line(M + INNER / 2 + 32, sigLineY, M + INNER, sigLineY);
  doc.setTextColor(...INK_MUTED);
  setFont(doc, "normal");
  doc.setFontSize(8);
  doc.text("Guardian / payer signature", M, sigLineY + 14);
  doc.text("Authorized signatory", M + INNER / 2 + 32, sigLineY + 14);

  doc.setFillColor(...INK);
  doc.rect(0, bandTop, W, bandH, "F");

  const cx = W / 2;
  let fy = bandTop + 22;

  doc.setTextColor(255, 255, 255);
  setFont(doc, "normal");
  doc.setFontSize(9);
  doc.text("SAGE - Standard Academy for Greater Education", cx, fy, { align: "center" });
  fy += 16;

  doc.setFontSize(8.5);
  doc.text("H-36, R-3, Block-C, Banasree, Rampura, Dhaka", cx, fy, { align: "center" });
  fy += 14;

  doc.text("Phone: 09617576776", cx, fy, { align: "center" });
}

export function renderPaymentReceipt(
  doc: jsPDF,
  payment: ReceiptPayment,
  items: ReceiptLineItem[],
  totalDiscount: number,
  due: number
) {
  const context = { doc, payment, items, totalDiscount, due };
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, W, PAGE_H, "F");
  header(context);
  studentBlock(context);

  const chunks = chunkLineItems(items);
  let globalIndex = 0;
  let tableBottom = TABLE_TOP_FIRST;
  chunks.forEach((chunk, ci) => {
    if (ci > 0) {
      doc.addPage();
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, W, PAGE_H, "F");
      drawTableContinuationBanner(doc);
    }
    const top = ci === 0 ? TABLE_TOP_FIRST : TABLE_TOP_CONT;
    tableBottom = drawFeeTable(doc, payment, chunk, top, globalIndex);
    globalIndex += chunk.length;
  });

  const summaryBottom = summary(context, tableBottom + 28);
  footer(doc, summaryBottom);
}
