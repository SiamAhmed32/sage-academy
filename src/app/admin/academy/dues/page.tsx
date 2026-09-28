import Link from "next/link";
import { Wallet } from "lucide-react";

import { DuesGrid } from "@/components/admin/academy/grids/DuesGrid";
import { PageHeading } from "@/components/admin/sa/ui";
import { addMonths, currentMonthKey } from "@/lib/academy/codes";
import { ensureMonthlyDues } from "@/lib/academy/dues";
import { dueTiles } from "@/lib/grid/tiles";
import { connectDB } from "@/lib/mongodb";

export default async function DuesPage() {
  const current = currentMonthKey();
  await connectDB();
  // Bills for this month are created automatically; this makes sure they exist even if the scheduled job has not run yet.
  await ensureMonthlyDues(current, { fresh: true });
  const tiles = await dueTiles();
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
      <DuesGrid tiles={tiles} months={months} />
    </div>
  );
}
