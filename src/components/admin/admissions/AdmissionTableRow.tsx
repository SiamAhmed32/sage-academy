"use client";

import { useState } from "react";
import { FileText, User, RotateCcw, Trash2, Archive } from "lucide-react";
import { archiveAdmissionRequestAction, restoreAdmissionRequestAction, deleteAdmissionRequestAction, updateAdmissionRequestAction } from "@/app/admin/actions/admission";
import { getAdminClassLabel } from "@/constants/admin-display";
import { formatAdminDate } from "@/lib/admin-format";
import { toast } from "react-toastify";
import { AdmissionNoteModal } from "./AdmissionNoteModal";
import { AdmissionConfirmModal } from "./AdmissionConfirmModal";
import { AdmissionDocumentModal } from "./AdmissionDocumentModal";
import { AdmissionDetailModal } from "./AdmissionDetailModal";
import type { AdmissionRequestItem } from "./types";

interface AdmissionTableRowProps {
  item: AdmissionRequestItem;
  onView: (id: string) => void;
}

const trackingStatuses = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "closed", label: "Closed" },
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
      if (res.success) toast.success("Status updated");
    } catch { toast.error("Could not update the status"); }
    finally { setIsProcessing(false); }
  }

  async function onConfirmAction() {
    setIsProcessing(true);
    try {
      const res = confirmState.type === "archive" ? await archiveAdmissionRequestAction(item._id) : 
                  confirmState.type === "restore" ? await restoreAdmissionRequestAction(item._id) : 
                  await deleteAdmissionRequestAction(item._id);
      
      if (res.success) {
        toast.success("Action completed");
        setConfirmState({ ...confirmState, isOpen: false });
      } else {
        toast.error(res.message || "Something went wrong");
      }
    } catch { toast.error("Server error"); }
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
    delete: { title: "Delete application?", message: "This application will be permanently deleted and cannot be recovered.", label: "Delete" },
    archive: { title: "Archive application?", message: "This application will move to the archived list and can be restored later.", label: "Archive" },
    restore: { title: "Restore application?", message: "This application will return to the active list.", label: "Restore" },
  }[confirmState.type];

  return (
    <tr
      className={`group transition-colors hover:bg-gray-50 cursor-pointer ${isProcessing ? "opacity-50 pointer-events-none" : ""}`}
      onClick={handleOpenPreview}
    >
      <td className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-sage-red-50 text-sage-primary">
            {isDocument ? <FileText size={18} /> : <User size={18} />}
          </div>
          <div>
            <p className="font-bold text-gray-900 line-clamp-1">{item.studentName || "Uploaded Form"}</p>
            <p className="text-[10px] font-semibold text-gray-400">#{item._id.slice(-6).toUpperCase()}</p>
          </div>
        </div>
      </td>

      <td className="p-4 font-semibold text-gray-700">{item.className ? getAdminClassLabel(item.className) : "-"}</td>
      <td className="p-4 text-[10px] font-bold uppercase text-sage-primary">{isDocument ? "Document" : "Form"}</td>
      <td className="p-4 font-semibold text-gray-700">{item.phone || "-"}</td>
      <td className="p-4 text-xs font-medium text-gray-500">{formatAdminDate(item.createdAt)}</td>

      <td className="p-4">
        <button
          onClick={(e) => { e.stopPropagation(); setShowNoteModal(true); }}
          className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition ${item.adminNote ? 'bg-sage-primary text-white border-sage-primary' : 'bg-white border-gray-200 text-gray-600 hover:border-sage-primary hover:text-sage-primary'}`}
        >
          {item.adminNote ? "See comment" : "Add comment"}
        </button>
      </td>

      <td className="p-4">
        <select
          value={item.status}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="h-9 w-full rounded-lg border border-gray-200 bg-white px-2 text-[11px] font-bold text-gray-700 outline-none focus:border-sage-primary transition"
        >
          {trackingStatuses.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </td>

      <td className="p-4 text-right">
        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
          {!item.isArchived ? (
            <button onClick={() => setConfirmState({ isOpen: true, type: "archive" })} className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-50 text-gray-500 hover:bg-sage-primary hover:text-white transition" title="Archive"><Archive size={16} /></button>
          ) : (
            <>
              <button onClick={() => setConfirmState({ isOpen: true, type: "restore" })} className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition" title="Restore"><RotateCcw size={16} /></button>
              <button onClick={() => setConfirmState({ isOpen: true, type: "delete" })} className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition" title="Delete"><Trash2 size={16} /></button>
            </>
          )}
          <button
            onClick={handleOpenPreview}
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 hover:border-sage-primary hover:text-sage-primary transition"
          >
            View
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
