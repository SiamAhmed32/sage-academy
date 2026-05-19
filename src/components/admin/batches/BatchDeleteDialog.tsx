"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";

import { Archive } from "lucide-react";

type BatchDeleteDialogProps = {
  batchId: string;
  batchTitle: string;
};

export function BatchDeleteDialog({ batchId, batchTitle }: BatchDeleteDialogProps) {
  const [open, setOpen] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleArchive() {
    if (isArchiving) return;
    setIsArchiving(true);
    setError("");
    try {
      const res = await fetch(`/api/batches/${batchId}`, { method: "DELETE" });
      const contentType = res.headers.get("content-type") ?? "";
      const json = contentType.includes("application/json") ? await res.json() : null;
      if (!res.ok || !json?.success) {
        const message = json?.message ?? "আর্কাইভ করা যায়নি";
        setError(message);
        toast.error(message);
        return;
      }
      toast.success("ব্যাচ আর্কাইভ করা হয়েছে");
      setOpen(false);
      router.refresh();
    } catch {
      const message = "আর্কাইভ করা যায়নি। আবার চেষ্টা করুন।";
      setError(message);
      toast.error(message);
    } finally {
      setIsArchiving(false);
    }
  }

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

      {open ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-2xl">
            <h3 className="text-base font-bold text-sage-secondary">ব্যাচ আর্কাইভ করবেন?</h3>
            <p className="mt-2 text-sm text-sage-gray-700">
              {batchTitle} আর্কাইভ করলে ওয়েবসাইটে আর দেখা যাবে না, কিন্তু ডাটাবেজে থাকবে।
            </p>
            {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={isArchiving}
                className="rounded-lg border border-sage-border px-4 py-2 text-sm font-bold text-sage-secondary disabled:opacity-60"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleArchive}
                disabled={isArchiving}
                className="rounded-lg bg-sage-primary px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
              >
                {isArchiving ? "আর্কাইভ হচ্ছে..." : "হ্যাঁ, আর্কাইভ করুন"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
