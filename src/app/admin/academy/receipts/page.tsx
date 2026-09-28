import Link from "next/link";
import { Wallet } from "lucide-react";

import { ReceiptsGrid } from "@/components/admin/academy/grids/ReceiptsGrid";
import { PageHeading } from "@/components/admin/sa/ui";
export default function ReceiptsPage() {
  return (
    <div>
      <PageHeading
        eyebrow="Finance"
        title="Receipts"
        description="Every money receipt, newest first. Receipts are never edited — a mistake is voided and a new receipt issued."
        actions={
          <Link href="/admin/academy/payments" className="btn-primary">
            <Wallet size={17} /> Collect payment
          </Link>
        }
      />
      <ReceiptsGrid />
    </div>
  );
}
