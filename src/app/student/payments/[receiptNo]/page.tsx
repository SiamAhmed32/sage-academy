import { notFound } from "next/navigation";

import { ReceiptActions } from "@/components/admin/academy/ReceiptActions";
import { ReceiptDocument } from "@/components/admin/academy/ReceiptDocument";
import { PageHeading } from "@/components/admin/sa/ui";
import { formatDate, formatTaka } from "@/lib/academy/codes";
import { getPortalStudent } from "@/lib/academy/portal";
import { getReceipt } from "@/lib/academy/queries";

export default async function StudentReceiptPage({ params }: { params: Promise<{ receiptNo: string }> }) {
  const { receiptNo } = await params;
  const { detail } = await getPortalStudent();
  if (!detail) return null;
  const receipt = await getReceipt(decodeURIComponent(receiptNo));
  // Families can only open receipts of the child they are viewing.
  if (!receipt || receipt.studentId !== detail.student.id) notFound();

  return (
    <div>
      <div className="no-print">
        <PageHeading
          eyebrow="Student workspace"
          title={`রসিদ ${receipt.receiptNo}`}
          description={
            receipt.status === "void"
              ? "এই রসিদটি বাতিল করা হয়েছে।"
              : `${formatTaka(receipt.amount)} পরিশোধিত · ${formatDate(receipt.paidAt)}`
          }
          back={{ href: "/student/payments", label: "ফি ও রসিদ" }}
          actions={<ReceiptActions receiptNo={receipt.receiptNo} status={receipt.status} whatsapp="" message="" canVoid={false} />}
        />
      </div>
      <ReceiptDocument receipt={receipt} />
    </div>
  );
}
