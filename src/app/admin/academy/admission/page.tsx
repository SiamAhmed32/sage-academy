import Link from "next/link";
import { Inbox } from "lucide-react";

import { AdmissionForm } from "@/components/admin/academy/AdmissionForm";
import { PageHeading } from "@/components/admin/sa/ui";

export default async function AdmissionPage({
  searchParams,
}: {
  searchParams: Promise<{ batch?: string; request?: string }>;
}) {
  const params = await searchParams;

  return (
    <div>
      <PageHeading
        eyebrow="Students"
        title="New admission"
        description="Enter the student, choose a batch that matches their class, gender and version, pick subjects and discounts, then collect the first payment."
        actions={
          <Link href="/admin/admissions" className="btn-secondary">
            <Inbox size={17} /> Admission requests
          </Link>
        }
      />
      <AdmissionForm initialBatchId={params.batch ?? ""} requestId={params.request ?? ""} />
    </div>
  );
}
