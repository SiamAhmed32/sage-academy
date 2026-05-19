"use client";

import { Plus } from "lucide-react";
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
          <h3 className="text-lg font-bold text-sage-secondary">নতুন শিক্ষার্থী ভর্তি</h3>
          <p className="mt-1 text-sm text-sage-gray-500">নতুন শিক্ষার্থী ভর্তির জন্য ফর্ম ওপেন করুন।</p>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="h-10 rounded-lg bg-sage-primary px-4 text-sm font-bold text-white"
        >
          {isOpen ? "ফর্ম বন্ধ করুন" : "নতুন ভর্তি"}
        </button>
      </div>

      {isOpen && (
        <div className="mt-4">
          <div className="mb-6 rounded-xl border border-sage-border bg-white p-5">
            <label className="text-xs font-bold text-sage-secondary mb-2 block uppercase tracking-widest">
              আবেদনকারী থেকে ভর্তি করুন (ঐচ্ছিক)
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
