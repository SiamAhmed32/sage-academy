"use client";

import { Edit2 } from "lucide-react";
import { useState } from "react";
import { StudentAdmissionForm } from "@/components/admin/students/StudentAdmissionForm";

interface StudentEditDialogProps {
  student: any;
  batches: any[];
}

export function StudentEditDialog({ student, batches }: StudentEditDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-sage-secondary/10 px-4 py-2 text-xs font-bold text-sage-secondary transition hover:bg-sage-secondary hover:text-white"
      >
        <Edit2 size={14} />
        এডিট
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-sage-border bg-sage-red-50 px-6 py-4">
              <h2 className="text-xl font-black text-sage-secondary">শিক্ষার্থীর তথ্য সংশোধন (Edit Student)</h2>
              <button 
                onClick={() => setIsOpen(false)}
                className="rounded-full p-2 text-sage-gray-400 hover:bg-sage-red-100 hover:text-sage-primary transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
            
            <div className="p-6">
              <StudentAdmissionForm 
                batches={batches} 
                student={student}
                onCancel={() => setIsOpen(false)} 
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
