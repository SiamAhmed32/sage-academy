"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";

import { Trash2 } from "lucide-react";

export function BatchPermanentDeleteButton({
  batchId,
  batchTitle,
}: {
  batchId: string;
  batchTitle: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function removeBatch() {
    setBusy(true);
    try {
      const response = await fetch(`/api/batches/${batchId}?permanent=true`, {
        method: "DELETE",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.message || "ডিলিট করা যায়নি");
      toast.success("ব্যাচ স্থায়ীভাবে ডিলিট হয়েছে");
      setIsOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "ডিলিট করা যায়নি");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600 transition hover:bg-red-600 hover:text-white"
        title="মুছে ফেলুন"
      >
        <Trash2 size={16} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-md scale-100 rounded-2xl bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
              </div>
              <h3 className="text-xl font-bold text-sage-secondary">স্থায়ীভাবে ডিলিট করবেন?</h3>
              <p className="mt-3 text-sm text-sage-gray-600 leading-relaxed">
                <span className="font-bold text-sage-secondary">{batchTitle}</span> স্থায়ীভাবে ডিলিট হয়ে যাবে। এই কাজ ফেরানো সম্ভব নয়। আপনি কি নিশ্চিত?
              </p>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                disabled={busy}
                className="rounded-xl border border-sage-border bg-white px-4 py-3 text-sm font-bold text-sage-secondary transition hover:bg-sage-red-50 disabled:opacity-50"
              >
                বাতিল করুন
              </button>
              <button
                type="button"
                onClick={removeBatch}
                disabled={busy}
                className="rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-red-700 active:scale-95 disabled:opacity-50"
              >
                {busy ? "ডিলিট হচ্ছে..." : "হ্যাঁ, ডিলিট করুন"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
