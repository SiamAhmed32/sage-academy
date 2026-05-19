"use client";

import { BookOpen, CheckCircle2, X } from "lucide-react";
import { useState } from "react";

interface StudentSubjectsDialogProps {
  studentName: string;
  subjects: Array<{
    subjectName: string;
    monthlyFee: number;
    baseFee?: number;
    discountType?: string;
    discountValue?: number;
    discountNote?: string;
  }>;
}

export function StudentSubjectsDialog({ studentName, subjects }: StudentSubjectsDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  const totalFee = subjects?.reduce((acc, s) => acc + (s.monthlyFee || 0), 0) || 0;

  return (
    <>
      <button 
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex h-9 items-center justify-center rounded-lg border border-sage-border bg-white px-3 text-[11px] font-bold text-sage-secondary transition hover:bg-sage-red-50 hover:text-sage-primary shadow-sm active:scale-[0.98]"
      >
        Show Subjects
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-sage-border bg-sage-red-50 px-6 py-4">
              <div className="flex items-center gap-2">
                <BookOpen size={20} className="text-sage-primary" />
                <h3 className="text-lg font-bold text-sage-secondary">{studentName} - বিষয়সমূহ</h3>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="rounded-full p-2 text-sage-gray-400 hover:bg-sage-red-100 hover:text-sage-primary transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <p className="text-xs text-sage-gray-500">
                শিক্ষার্থীর নির্বাচিত বিষয় এবং মাসিক ফি এর তালিকা।
              </p>

              <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                {subjects && subjects.length > 0 ? (
                  subjects.map((sub, idx) => (
                    <div 
                      key={idx} 
                      className="flex items-center justify-between rounded-xl border border-sage-border bg-sage-red-50/30 p-3 transition hover:border-sage-primary/20"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-green-500" />
                        <span className="font-bold text-sage-secondary">{sub.subjectName}</span>
                        </div>
                        {(sub.baseFee ?? sub.monthlyFee) !== sub.monthlyFee && (
                          <p className="mt-1 text-[10px] text-sage-gray-500">
                            Batch ৳{sub.baseFee} → Final ৳{sub.monthlyFee}
                            {sub.discountNote ? ` · ${sub.discountNote}` : ""}
                          </p>
                        )}
                      </div>
                      <span className="text-xs font-black text-sage-primary">৳{sub.monthlyFee}</span>
                    </div>
                  ))
                ) : (
                  <div className="py-6 text-center text-sage-gray-400 italic text-sm">
                    কোনো বিষয় নির্বাচন করা হয়নি।
                  </div>
                )}
              </div>

              {subjects && subjects.length > 0 && (
                <div className="flex items-center justify-end gap-2 border-t border-sage-border pt-4">
                  <span className="text-[10px] font-black text-sage-gray-400 uppercase tracking-widest">Total Monthly:</span>
                  <span className="text-xl font-black text-sage-primary">৳{totalFee}</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-sage-red-50 px-6 py-4 flex justify-end">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-xl bg-sage-secondary px-5 py-2 text-sm font-bold text-white transition hover:bg-sage-primary shadow-lg shadow-sage-primary/20"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
          
          {/* Backdrop Click to Close */}
          <div 
            className="absolute inset-0 -z-10" 
            onClick={() => setIsOpen(false)}
          ></div>
        </div>
      )}
    </>
  );
}
