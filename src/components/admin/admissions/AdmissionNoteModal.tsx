"use client";

import { useState } from "react";
import { MessageSquare, X, CheckCircle2, Loader2, History } from "lucide-react";
import { updateAdmissionRequestAction } from "@/app/admin/actions/admission";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

interface AdmissionNoteModalProps {
  id: string;
  initialNote: string;
  studentName: string;
  onClose: () => void;
}

export function AdmissionNoteModal({ id, initialNote, studentName, onClose }: AdmissionNoteModalProps) {
  const [note, setNote] = useState(initialNote);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  async function handleSave() {
    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append("id", id);
      formData.append("adminNote", note);
      
      const res = await updateAdmissionRequestAction(formData);
      if (res.success) {
        toast.success("নোট সেভ হয়েছে");
        router.refresh();
        onClose();
      } else {
        toast.error("সেভ করা যায়নি");
      }
    } catch {
      toast.error("সার্ভার সমস্যা");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div 
      className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/45 animate-in fade-in duration-200"
      onClick={(e) => e.stopPropagation()}
    >
      <div 
        className="w-full max-w-md overflow-hidden rounded-xl bg-white p-5 shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4 border-b border-sage-border pb-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="text-sage-primary" size={18} />
            <div>
              <h3 className="text-sm font-bold text-sage-secondary">Internal Note</h3>
              <p className="text-[10px] font-bold text-sage-gray-400 truncate max-w-[200px]">{studentName}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-sage-gray-400 hover:bg-sage-red-50 hover:text-sage-primary transition">
            <X size={18} />
          </button>
        </div>

        {/* Previous Comment Section */}
        <div className="mb-4">
          <div className="flex items-center gap-1.5 mb-2 text-[11px] font-black uppercase text-sage-gray-400 tracking-wider">
            <History size={12} />
            Saved Comment
          </div>
          <div className="rounded-lg bg-sage-red-50/50 p-4 border border-sage-border/50">
            {initialNote ? (
              <p className="text-xs font-semibold text-sage-secondary leading-relaxed italic">
                "{initialNote}"
              </p>
            ) : (
              <p className="text-xs font-medium text-sage-gray-400 italic">
                No comments added yet.
              </p>
            )}
          </div>
        </div>

        {/* Input Section */}
        <div className="space-y-2">
          <label className="text-[11px] font-black uppercase text-sage-gray-400 tracking-wider">
            {initialNote ? "Edit Comment" : "Add New Comment"}
          </label>
          <textarea
            value={note}
            autoFocus
            onChange={(e) => setNote(e.target.value)}
            placeholder="নতুন কোনো তথ্য লিখে রাখুন..."
            className="min-h-[120px] w-full rounded-lg border border-sage-border bg-white p-3 text-sm font-medium outline-none transition focus:border-sage-primary focus:ring-4 focus:ring-sage-primary/5"
          />
        </div>
        
        {/* Footer */}
        <div className="mt-5 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="rounded-lg border border-sage-border px-4 py-2 text-sm font-bold text-sage-secondary transition hover:bg-sage-red-50 disabled:opacity-50"
          >
            বাতিল
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center justify-center gap-2 rounded-lg bg-sage-primary px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-sage-secondary disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
            {isSaving ? "সংরক্ষণ হচ্ছে..." : "নোট সেভ করুন"}
          </button>
        </div>
      </div>
    </div>
  );
}
