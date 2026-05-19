"use client";

import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "react-toastify";

type Props = {
  teacherId: string;
};

export function TeacherDeleteButton({ teacherId }: Props) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    const ok = window.confirm("আপনি কি নিশ্চিতভাবে এই শিক্ষকের তথ্য মুছে ফেলতে চান?");
    if (!ok || isDeleting) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/teachers/${teacherId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const contentType = res.headers.get("content-type") ?? "";
      const json = contentType.includes("application/json") ? await res.json() : null;
      if (!res.ok || !json?.success) throw new Error(json?.message || "মুছে ফেলা সম্ভব হয়নি");
      toast.success("সফলভাবে মুছে ফেলা হয়েছে");
      router.refresh();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "সাময়িক সমস্যা হয়েছে";
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isDeleting}
      className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600 transition hover:bg-red-600 hover:text-white disabled:opacity-60"
      title="মুছে ফেলুন"
    >
      {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
    </button>
  );
}
