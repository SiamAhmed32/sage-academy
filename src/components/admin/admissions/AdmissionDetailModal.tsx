"use client";

import { X, User, ShieldCheck } from "lucide-react";
import { AdmissionInfoGrid } from "./details/AdmissionInfoGrid";
import { AdmissionAddressBox } from "./details/AdmissionAddressBox";

interface AdmissionDetailModalProps {
  item: any;
  onClose: () => void;
}

export function AdmissionDetailModal({ item, onClose }: AdmissionDetailModalProps) {
  const hasPresentAddress = !!item.presentAddress;
  const hasPermanentAddress = !!item.permanentAddress;
  const hasMessage = !!item.message;

  return (
    <div 
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 sm:p-6 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative flex flex-col w-full max-w-4xl max-h-[85vh] overflow-hidden rounded-xl bg-white shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Compact */}
        <div className="flex items-center justify-between border-b border-sage-border bg-white px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sage-red-50 text-sage-primary border border-sage-border">
              <User size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-sage-secondary">Admission Application</h3>
              <p className="text-[10px] font-bold text-sage-gray-400 uppercase tracking-widest">
                #{item._id.slice(-6).toUpperCase()} • {item.studentName}
              </p>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-sage-red-50 text-sage-primary transition hover:bg-sage-primary hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 bg-sage-red-50/10 overflow-y-auto p-5 sm:p-6 scrollbar-thin scrollbar-thumb-sage-red-100">
          <div className="space-y-4">
            {/* The Main Information Grid (Only shows filled fields) */}
            <AdmissionInfoGrid item={item} />
            
            {/* Address Information (Only shows if they exist) */}
            {(hasPresentAddress || hasPermanentAddress) && (
              <div className="grid gap-4 sm:grid-cols-2">
                {hasPresentAddress && <AdmissionAddressBox title="Present Address" address={item.presentAddress} />}
                {hasPermanentAddress && <AdmissionAddressBox title="Permanent Address" address={item.permanentAddress} />}
              </div>
            )}

            {/* Message / Additional Info */}
            {hasMessage && (
              <div className="rounded-xl border border-sage-border bg-white p-4 shadow-sm">
                <p className="text-[9px] font-black uppercase text-sage-gray-400 tracking-wider mb-2">Internal Note / Message</p>
                <p className="text-xs font-semibold text-sage-secondary leading-relaxed italic">
                  "{item.message}"
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer - Minimal */}
        <div className="flex items-center justify-between border-t border-sage-border bg-white px-6 py-2.5">
          <div className="flex items-center gap-2 text-emerald-600 font-bold text-[9px] uppercase tracking-widest">
            <ShieldCheck size={12} />
            Verified Application
          </div>
          <p className="text-[8px] font-black text-sage-gray-300 uppercase tracking-[0.4em]">
            SAGE • INTERNAL RECORD
          </p>
        </div>
      </div>
    </div>
  );
}
