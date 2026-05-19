"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import { archiveStudentAction } from "@/app/admin/actions";
import { Archive } from "lucide-react";

interface StudentArchiveDialogProps {
  studentId: string;
  studentName: string;
}

export function StudentArchiveDialog({ studentId, studentName }: StudentArchiveDialogProps) {
  const [open, setOpen] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);

  const handleArchive = async () => {
    setIsArchiving(true);
    try {
      const formData = new FormData();
      formData.append("id", studentId);
      await archiveStudentAction(formData);
      toast.success(`${studentName} কে আর্কাইভ করা হয়েছে।`);
      setOpen(false);
    } catch (error) {
      toast.error("আর্কাইভ করা যায়নি। আবার চেষ্টা করুন।");
    } finally {
      setIsArchiving(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-8 w-8 items-center justify-center rounded-lg bg-sage-red-50 text-sage-primary transition hover:bg-sage-primary hover:text-white"
        title="আর্কাইভ করুন"
      >
        <Archive size={16} />
      </button>

      {open && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md animate-in fade-in zoom-in duration-200 rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sage-red-50 text-sage-primary mb-4">
              <Archive size={24} />
            </div>
            <h3 className="text-lg font-bold text-sage-secondary">শিক্ষার্থী আর্কাইভ করবেন?</h3>
            <p className="mt-2 text-sm text-sage-gray-600 leading-relaxed">
              <span className="font-bold text-sage-secondary">{studentName}</span> কে আর্কাইভ করলে সক্রিয় শিক্ষার্থীর তালিকায় আর দেখা যাবে না। তবে আপনি আর্কাইভ সেকশন থেকে তাকে পুনরুদ্ধার করতে পারবেন।
            </p>
            
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={isArchiving}
                className="rounded-xl border border-sage-border px-5 py-2.5 text-sm font-bold text-sage-secondary transition hover:bg-sage-red-50 disabled:opacity-50"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleArchive}
                disabled={isArchiving}
                className="rounded-xl bg-sage-primary px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-sage-primary/20 transition hover:bg-sage-secondary active:scale-[0.98] disabled:opacity-50"
              >
                {isArchiving ? "আর্কাইভ হচ্ছে..." : "হ্যাঁ, আর্কাইভ করুন"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
