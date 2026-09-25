import { Download } from "lucide-react";

import { FreeClassLeadsGrid } from "@/components/admin/grids/FreeClassLeadsGrid";
import { PageHeading } from "@/components/admin/sa/ui";
import { freeClassLeadClassLabels, freeClassLeadTiles } from "@/lib/grid/tiles-leads";

export const dynamic = "force-dynamic";

export default async function AdminFreeClassLeadsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const [params, tiles, classLabels] = await Promise.all([searchParams, freeClassLeadTiles(), freeClassLeadClassLabels()]);

  return (
    <div>
      <PageHeading
        title="Free Class Leads"
        description="Manage homepage free-class registrations: call, message on WhatsApp, update status and keep follow-up notes."
        actions={
          // Full export with every stored field (the grid's menu exports the current view).
          <a href="/api/admin/free-class-leads/export" className="btn-secondary">
            <Download size={16} /> Export all (CSV)
          </a>
        }
      />
      <FreeClassLeadsGrid tiles={tiles} classLabels={classLabels} initialSearch={params.q ?? ""} />
    </div>
  );
}
