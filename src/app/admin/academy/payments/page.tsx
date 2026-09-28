import Link from "next/link";
import { BadgeDollarSign, Receipt } from "lucide-react";

import { CollectPayment } from "@/components/admin/academy/CollectPayment";
import { PageHeading } from "@/components/admin/sa/ui";

export default async function CollectPaymentPage({ searchParams }: { searchParams: Promise<{ student?: string }> }) {
  const params = await searchParams;
  const studentId = params.student ?? "";

  return (
    <div>
      <PageHeading
        eyebrow="Finance"
        title="Collect payment"
        description="Find the student, tick what they are paying for — previous dues, this month, exam fees or advance months — and print the receipt."
        actions={
          <>
            <Link href="/admin/academy/dues" className="btn-secondary">
              <BadgeDollarSign size={17} /> Dues
            </Link>
            <Link href="/admin/academy/receipts" className="btn-secondary">
              <Receipt size={17} /> Receipts
            </Link>
          </>
        }
      />
      <CollectPayment key={studentId || "none"} initialStudentId={studentId} initialContext={null} />
    </div>
  );
}
