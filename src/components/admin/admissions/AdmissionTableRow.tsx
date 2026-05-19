"use client";

import { useState } from "react";
import { FileText, User, RotateCcw, Trash2, Archive } from "lucide-react";
import { archiveAdmissionRequestAction, restoreAdmissionRequestAction, deleteAdmissionRequestAction, updateAdmissionRequestAction } from "@/app/admin/actions/admission";
import { toBanglaDigits } from "@/constants/class-levels";
import { toast } from "react-toastify";
import { AdmissionNoteModal } from "./AdmissionNoteModal";
import { AdmissionConfirmModal } from "./AdmissionConfirmModal";
import { AdmissionDocumentModal } from "./AdmissionDocumentModal";
import { AdmissionDetailModal } from "./AdmissionDetailModal";

interface AdmissionTableRowProps {
  item: any;
  onView: (id: string) => void;
}

const trackingStatuses = [
  { value: "new", label: "নতুন (New)" },
  { value: "contacted", label: "আগ্রহী (Interested)" },
  { value: "qualified", label: "যোগ্য (Qualified)" },
  { value: "closed", label: "বন্ধ (Closed)" },
];

export function AdmissionTableRow({ item }: AdmissionTableRowProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showDocModal, setShowDocModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [confirmState, setConfirmState] = useState<{ isOpen: boolean; type: "delete" | "archive" | "restore" }>({
    isOpen: false,
    type: "archive",
  });

  const isDocument = !!item.uploadedForm?.url;

  async function handleStatusChange(newStatus: string) {
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append("id", item._id);
      formData.append("status", newStatus);
      const res = await updateAdmissionRequestAction(formData);
      if (res.success) toast.success("স্ট্যাটাস আপডেট হয়েছে");
    } catch { toast.error("আপডেট করা যায়নি"); }
    finally { setIsProcessing(false); }
  }

  async function onConfirmAction() {
    setIsProcessing(true);
    try {
      const res = confirmState.type === "archive" ? await archiveAdmissionRequestAction(item._id) : 
                  confirmState.type === "restore" ? await restoreAdmissionRequestAction(item._id) : 
                  await deleteAdmissionRequestAction(item._id);
      
      if (res.success) {
        toast.success("অ্যাকশনটি সফল হয়েছে");
        setConfirmState({ ...confirmState, isOpen: false });
      } else {
        toast.error(res.message || "সমস্যা হয়েছে");
      }
    } catch { toast.error("সার্ভার সমস্যা"); }
    finally { setIsProcessing(false); }
  }

  const handleOpenPreview = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (isDocument) {
      setShowDocModal(true);
    } else {
      setShowDetailModal(true);
    }
  };

  const confirmConfig = {
    delete: { title: "মুছে ফেলতে চান?", message: "আপনি কি নিশ্চিত যে এই আবেদনটি চিরতরে মুছে ফেলতে চান? এটি আর ফিরিয়ে আনা যাবে না।", label: "ডিলিট করুন" },
    archive: { title: "আর্কাইভ করতে চান?", message: "এই আবেদনটি আর্কাইভ লিস্টে পাঠিয়ে দেওয়া হবে। আপনি চাইলে পরবর্তীতে আবার রিস্টোর করতে পারবেন।", label: "আর্কাইভ করুন" },
    restore: { title: "রিস্টোর করতে চান?", message: "এই আবেদনটি পুনরায় একটিভ লিস্টে ফিরে আসবে।", label: "রিস্টোর করুন" },
  }[confirmState.type];

  return (
    <tr 
      className={`group transition-colors hover:bg-sage-red-50/30 cursor-pointer ${isProcessing ? "opacity-50 pointer-events-none" : ""}`} 
      onClick={handleOpenPreview}
    >
      <td className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-sage-border bg-sage-red-50 text-sage-primary">
            {isDocument ? <FileText size={18} /> : <User size={18} />}
          </div>
          <div>
            <p className="font-bold text-sage-secondary line-clamp-1">{item.studentName || "Uploaded Form"}</p>
            <p className="text-[10px] font-semibold text-sage-gray-400">#{item._id.slice(-6).toUpperCase()}</p>
          </div>
        </div>
      </td>

      <td className="p-4 font-semibold text-sage-secondary">{item.className ? `ক্লাস ${toBanglaDigits(item.className)}` : "-"}</td>
      <td className="p-4 text-[10px] font-black uppercase text-sage-primary">{isDocument ? "Document" : "Form"}</td>
      <td className="p-4 font-semibold text-sage-gray-700">{item.phone || "-"}</td>
      <td className="p-4 text-xs font-bold text-sage-gray-500">{new Date(item.createdAt).toLocaleDateString("bn-BD")}</td>
      
      <td className="p-4">
        <button 
          onClick={(e) => { e.stopPropagation(); setShowNoteModal(true); }}
          className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition ${item.adminNote ? 'bg-sage-primary text-white border-sage-primary' : 'bg-white border-sage-border text-sage-secondary hover:border-sage-primary hover:text-sage-primary'}`}
        >
          {item.adminNote ? "SEE COMMENT" : "ADD COMMENT"}
        </button>
      </td>

      <td className="p-4">
        <select 
          value={item.status} 
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="h-9 w-full rounded-lg border border-sage-border bg-white px-2 text-[11px] font-bold text-sage-secondary outline-none focus:border-sage-primary transition"
        >
          {trackingStatuses.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </td>

      <td className="p-4 text-right">
        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
          {!item.isArchived ? (
            <button onClick={() => setConfirmState({ isOpen: true, type: "archive" })} className="flex h-8 w-8 items-center justify-center rounded-lg bg-sage-red-50 text-sage-primary hover:bg-sage-primary hover:text-white transition" title="আর্কাইভ"><Archive size={16} /></button>
          ) : (
            <>
              <button onClick={() => setConfirmState({ isOpen: true, type: "restore" })} className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition" title="রিস্টোর"><RotateCcw size={16} /></button>
              <button onClick={() => setConfirmState({ isOpen: true, type: "delete" })} className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition" title="ডিলিট"><Trash2 size={16} /></button>
            </>
          )}
          <button 
            onClick={handleOpenPreview} 
            className="rounded-lg border border-sage-border bg-white px-3 py-1.5 text-xs font-bold text-sage-secondary hover:border-sage-primary hover:text-sage-primary transition uppercase"
          >
            VIEW
          </button>
        </div>

        {showNoteModal && (
          <AdmissionNoteModal 
            id={item._id} 
            initialNote={item.adminNote || ""} 
            studentName={item.studentName || "Uploaded Form"}
            onClose={() => setShowNoteModal(false)}
          />
        )}

        {showDocModal && item.uploadedForm?.url && (
          <AdmissionDocumentModal 
            url={item.uploadedForm.url} 
            studentName={item.studentName || "Uploaded Form"} 
            onClose={() => setShowDocModal(false)} 
          />
        )}

        {showDetailModal && (
          <AdmissionDetailModal 
            item={item} 
            onClose={() => setShowDetailModal(false)} 
          />
        )}

        <AdmissionConfirmModal 
          isOpen={confirmState.isOpen}
          isProcessing={isProcessing}
          type={confirmState.type}
          title={confirmConfig.title}
          message={confirmConfig.message}
          confirmLabel={confirmConfig.label}
          onClose={() => setConfirmState({ ...confirmState, isOpen: false })}
          onConfirm={onConfirmAction}
        />
      </td>
    </tr>
  );
}
