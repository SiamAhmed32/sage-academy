"use client";

import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { toast } from "react-toastify";
import { deleteContactRequestAction } from "@/app/admin/actions";
import type { ContactRequestItem } from "./types";

type ContactDeleteModalProps = {
  item: ContactRequestItem;
  onClose: () => void;
  onDeleted?: () => void;
};

export function ContactDeleteModal({ item, onClose, onDeleted }: ContactDeleteModalProps) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      const formData = new FormData();
      formData.append("id", item._id.toString());
      await deleteContactRequestAction(formData);
      toast.success("Message deleted");
      onDeleted?.();
      onClose();
    } catch {
      toast.error("Could not delete the message. Please try again.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex justify-end p-2">
          <button onClick={onClose} className="rounded-lg p-2 text-sage-gray-400 hover:bg-sage-red-50 hover:text-sage-primary">
            <X size={18} />
          </button>
        </div>
        
        <div className="px-6 pb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
            <AlertTriangle size={28} />
          </div>
          
          <h3 className="mb-2 text-lg font-bold text-sage-secondary">Delete Message?</h3>
          <p className="mb-6 text-sm text-sage-gray-500">
            Permanently delete the message from <span className="font-bold text-sage-secondary">{item.name}</span>? This cannot be undone.
          </p>
          
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={deleting}
              className="flex-1 h-11 rounded-xl border border-sage-border text-sm font-bold text-sage-gray-600 transition hover:bg-sage-red-50 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 h-11 rounded-xl bg-red-600 text-sm font-bold text-white shadow-lg shadow-red-200 transition hover:bg-red-700 active:scale-95 disabled:opacity-60"
            >
              {deleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
