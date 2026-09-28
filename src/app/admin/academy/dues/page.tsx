import Link from "next/link";
import { Wallet } from "lucide-react";

import { DuesGrid } from "@/components/admin/academy/grids/DuesGrid";
import { PageHeading } from "@/components/admin/sa/ui";
import { addMonths, currentMonthKey } from "@/lib/academy/codes";

export default function DuesPage() {
  const current = currentMonthKey();
  const months = Array.from({ length: 13 }, (_, index) => addMonths(current, 1 - index));

  return (
    <div>
      <PageHeading
        eyebrow="Finance"
        title="Dues"
        description="Tuition is billed automatically on the 1st of each month from each student's subjects, fees and discounts. Unpaid amounts carry over."
        actions={
          <Link href="/admin/academy/payments" className="btn-primary">
            <Wallet size={17} /> Collect payment
          </Link>
        }
      />
      <DuesGrid months={months} />
    </div>
  );
}
