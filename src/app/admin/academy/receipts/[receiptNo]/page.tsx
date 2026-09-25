import Link from "next/link";
import { notFound } from "next/navigation";
import { UserRound, Wallet } from "lucide-react";

import { ReceiptActions } from "@/components/admin/academy/ReceiptActions";
import { ReceiptDocument } from "@/components/admin/academy/ReceiptDocument";
import { PageHeading } from "@/components/admin/sa/ui";
import { formatDate, formatTaka, monthLabel } from "@/lib/academy/codes";
import { getReceipt } from "@/lib/academy/queries";
import { adminRoles } from "@/lib/rbac";
import { getCurrentAuthUser } from "@/lib/auth-session";

export default async function ReceiptPage({ params }: { params: Promise<{ receiptNo: string }> }) {
  const { receiptNo } = await params;
  const [receipt, user] = await Promise.all([getReceipt(decodeURIComponent(receiptNo)), getCurrentAuthUser()]);
  if (!receipt) notFound();

  const months = [...new Set(receipt.allocations.map((allocation) => allocation.month))].sort().map((value) => monthLabel(value, true));
  const message = [
    "SAGE Academy — Money receipt",
    `Receipt: ${receipt.receiptNo}`,
    `Student: ${receipt.snapshot.studentName} (${receipt.snapshot.studentCode})`,
    `Batch: ${receipt.snapshot.batchCode}`,
    `Paid: ${formatTaka(receipt.amount)} for ${months.join(", ")}`,
    `Date: ${formatDate(receipt.paidAt)}`,
    `Remaining due: ${formatTaka(receipt.dueAfter)}`,
    "Thank you.",
  ].join("\n");

  return (
    <div>
      <div className="no-print">
        <PageHeading
          eyebrow="Finance · Receipt"
          title={receipt.receiptNo}
          description={
            receipt.status === "void"
              ? `Voided by ${receipt.voidedBy} on ${formatDate(receipt.voidedAt)}: ${receipt.voidReason}`
              : `${formatTaka(receipt.amount)} received from ${receipt.snapshot.studentName} by ${receipt.receivedBy}.`
          }
          back={{ href: "/admin/academy/receipts", label: "All receipts" }}
          actions={
            <>
              <Link href={`/admin/academy/students/${receipt.studentId}?tab=billing`} className="btn-secondary">
                <UserRound size={17} /> Profile
              </Link>
              <ReceiptActions
                receiptNo={receipt.receiptNo}
                status={receipt.status}
                whatsapp={receipt.whatsapp}
                message={message}
                canVoid={Boolean(user && adminRoles.includes(user.role))}
              />
              <Link href={`/admin/academy/payments?student=${receipt.studentId}`} className="btn-primary">
                <Wallet size={17} /> New payment
              </Link>
            </>
          }
        />
      </div>
      <ReceiptDocument receipt={receipt} />
    </div>
  );
}
