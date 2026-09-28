"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ListChecks } from "lucide-react";

import { loadJson, readJsonCache } from "@/components/admin/grid/grid-cache";
import { EmptyState } from "@/components/admin/sa/ui";
import type { BatchOption, ClassOption } from "@/lib/academy/queries";
import { AdmissionWizard, type AdmissionPrefill } from "./AdmissionWizard";

type Payload = {
  classes: ClassOption[];
  batches: BatchOption[];
  prefill: AdmissionPrefill | null;
};

export function AdmissionForm({ initialBatchId, requestId }: { initialBatchId: string; requestId: string }) {
  const url = requestId ? `/api/admin/admission-form?request=${encodeURIComponent(requestId)}` : "/api/admin/admission-form";
  const [data, setData] = useState<Payload | null>(() => readJsonCache<Payload>(url));
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (data) return;
    let cancel = false;
    void loadJson<Payload>(url)
      .then((body) => {
        if (!cancel) setData(body);
      })
      .catch(() => {
        if (!cancel) setFailed(true);
      });
    return () => {
      cancel = true;
    };
  }, [data, url]);

  if (!data) {
    if (failed) {
      return (
        <div className="notice danger">
          <span>The admission form could not load. Refresh the page to try again.</span>
        </div>
      );
    }
    return (
      <div className="sa-page-skeleton" aria-busy="true">
        <div className="sa-skel-table">
          {Array.from({ length: 6 }, (_, index) => (
            <span key={index} className="sa-skel" />
          ))}
        </div>
      </div>
    );
  }

  if (data.batches.length === 0) {
    return (
      <section className="panel">
        <EmptyState
          icon={ListChecks}
          title="Create a batch first"
          description="Students are admitted into a batch. Set up classes, subjects and at least one batch."
          action={
            <Link href="/admin/academy/batches/new" className="btn-primary">
              Create batch
            </Link>
          }
        />
      </section>
    );
  }

  return <AdmissionWizard classes={data.classes} batches={data.batches} initialBatchId={initialBatchId} prefill={data.prefill} />;
}
