"use client";

import { useState } from "react";
import { AdmissionLeadPicker } from "./AdmissionLeadPicker";
import { StudentAdmissionForm, type AdminBatchRow, type AdmissionPrefill } from "./StudentAdmissionForm";

interface Props {
  batches: AdminBatchRow[];
}

export function StudentCreatePanel({ batches }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<AdmissionPrefill | null>(null);

  return (
    <div className="mb-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-sage-border bg-white p-4">
        <div>
          <h3 className="text-lg font-bold text-sage-secondary">Enroll a New Student</h3>
          <p className="mt-1 text-sm text-sage-gray-500">Open the form to create a student record.</p>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="h-10 rounded-lg bg-sage-primary px-4 text-sm font-bold text-white"
        >
          {isOpen ? "Close Form" : "New Enrollment"}
        </button>
      </div>

      {isOpen && (
        <div className="mt-4">
          <div className="mb-6 rounded-xl border border-sage-border bg-white p-5">
            <label className="text-xs font-bold text-sage-secondary mb-2 block uppercase tracking-widest">
              Enroll from an Applicant (Optional)
            </label>
            <AdmissionLeadPicker
              selectedName={selectedLead?.studentName}
              onSelect={(lead) => setSelectedLead(lead)}
              onClear={() => setSelectedLead(null)}
            />
          </div>
          <StudentAdmissionForm
            key={selectedLead?._id || "empty-form"}
            batches={batches}
            prefillData={selectedLead}
            onCancel={() => {
              setIsOpen(false);
              setSelectedLead(null);
            }}
          />
        </div>
      )}
    </div>
  );
}
