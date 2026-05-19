"use client";

import { useState } from "react";
import { Info, CheckCircle2, MessageSquare, Phone } from "lucide-react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

import { updateAdmissionRequestAction } from "@/app/admin/actions/admission";
import { requestStatusOptions } from "@/constants/admin";

interface AdmissionActionSidebarProps {
  request: any;
}

export function AdmissionActionSidebar({ request }: AdmissionActionSidebarProps) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);

  async function handleUpdate(formData: FormData) {
    setIsUpdating(true);
    try {
      const result = await updateAdmissionRequestAction(formData);
      if (result.success) {
        toast.success("আবেদন সফলভাবে আপডেট হয়েছে");
        router.refresh();
      } else {
        toast.error(result.message || "আপডেট করা যায়নি");
      }
    } catch (err) {
      toast.error("সার্ভার সমস্যা হয়েছে");
    } finally {
      setIsUpdating(false);
    }
  }

  const phoneRaw = request.phone?.replace(/\+/g, '');

  return (
    <div className="space-y-6">
      <div className="rounded-[2.5rem] border border-sage-border bg-sage-red-50/30 p-8 ring-1 ring-sage-red-100/50 shadow-sm">
        <div className="mb-6 flex items-center gap-2 border-b border-sage-red-100 pb-5">
          <Info className="text-sage-primary" size={20} />
          <h3 className="text-sm font-black text-sage-secondary uppercase tracking-wider">Lead Actions</h3>
        </div>

        <div className="mb-8 flex flex-col gap-3">
           <a 
            href={`https://wa.me/${phoneRaw}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 h-12 rounded-2xl bg-[#25D366] text-white text-sm font-bold shadow-lg shadow-[#25D366]/20 transition hover:scale-[1.02] active:scale-[0.98]"
          >
            <MessageSquare size={18} />
            WhatsApp Lead
          </a>
          <a 
            href={`tel:${request.phone}`} 
            className="flex items-center justify-center gap-3 h-12 rounded-2xl border-2 border-sage-primary bg-white text-sage-primary text-sm font-bold transition hover:bg-sage-red-50 active:scale-[0.98]"
          >
            <Phone size={18} />
            Direct Call
          </a>
        </div>

        <div className="h-px w-full bg-sage-red-100 mb-8" />

        <form action={handleUpdate} className="space-y-6">
          <input type="hidden" name="id" value={request._id} />
          
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-sage-primary">Lead Status</label>
            <select 
              name="status" 
              defaultValue={request.status} 
              className="h-12 w-full rounded-2xl border border-sage-border bg-white px-4 text-sm font-bold text-sage-secondary outline-none transition focus:border-sage-primary focus:ring-4 focus:ring-sage-primary/5"
            >
              {requestStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-sage-primary">Admin Notes (Private)</label>
            <textarea
              name="adminNote"
              defaultValue={request.adminNote}
              placeholder="Add details about your follow-up here..."
              className="min-h-[160px] w-full rounded-2xl border border-sage-border bg-white p-4 text-sm font-medium outline-none transition focus:border-sage-primary focus:ring-4 focus:ring-sage-primary/5"
            />
          </div>

          <button 
            disabled={isUpdating}
            className="flex w-full items-center justify-center gap-2 h-14 rounded-2xl bg-sage-primary text-sm font-bold text-white shadow-xl shadow-sage-primary/30 transition hover:bg-sage-secondary active:scale-[0.98] disabled:opacity-50 disabled:grayscale"
          >
            {isUpdating ? (
              <span className="flex items-center gap-2">
                 <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                 Updating...
              </span>
            ) : (
              <>
                <CheckCircle2 size={18} />
                Save Updates
              </>
            )}
          </button>
        </form>
      </div>

      <div className="rounded-2xl border border-dashed border-sage-border/60 p-5 text-center bg-white/50">
        <p className="text-[10px] font-bold text-sage-gray-400 uppercase tracking-widest">Database ID</p>
        <p className="mt-1 font-mono text-xs font-black text-sage-secondary uppercase">{request._id}</p>
      </div>
    </div>
  );
}
