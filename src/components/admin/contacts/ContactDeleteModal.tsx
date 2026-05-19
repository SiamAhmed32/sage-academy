"use client";

import { AlertTriangle, X } from "lucide-react";
import { deleteContactRequestAction } from "@/app/admin/actions";

type ContactDeleteModalProps = {
  item: any;
  onClose: () => void;
};

export function ContactDeleteModal({ item, onClose }: ContactDeleteModalProps) {
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
          
          <h3 className="mb-2 text-lg font-bold text-sage-secondary">মুছে ফেলার নিশ্চয়তা</h3>
          <p className="mb-6 text-sm text-sage-gray-500">
            আপনি কি নিশ্চিতভাবে <span className="font-bold text-sage-secondary">{item.name}</span> এর এই বার্তাটি স্থায়ীভাবে মুছে ফেলতে চান? এটি আর ফিরিয়ে আনা যাবে না।
          </p>
          
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 h-11 rounded-xl border border-sage-border text-sm font-bold text-sage-gray-600 transition hover:bg-sage-red-50"
            >
              বাতিল করুন
            </button>
            <form action={deleteContactRequestAction} onSubmit={() => onClose()} className="flex-1">
              <input type="hidden" name="id" value={item._id.toString()} />
              <button
                type="submit"
                className="w-full h-11 rounded-xl bg-red-600 text-sm font-bold text-white shadow-lg shadow-red-200 transition hover:bg-red-700 active:scale-95"
              >
                হ্যাঁ, মুছে ফেলুন
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
