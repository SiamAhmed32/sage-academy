"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

import { AdminModal } from "@/components/admin/shared/AdminModal";
import { BatchSubjectRows } from "./BatchSubjectRows";
import type { AdminBatch, TeacherOption } from "./types";

interface BatchRoutineModalProps {
  batch: AdminBatch & { _id: string };
  teachers: TeacherOption[];
  open: boolean;
  onClose: () => void;
}

export function BatchRoutineModal({ batch, teachers, open, onClose }: BatchRoutineModalProps) {
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    const formData = new FormData(event.currentTarget);

    // Only send subject-related data for this PATCH
    const body = {
      subjects: JSON.parse(formData.get("subjectsJson") as string || "[]"),
    };

    try {
      const response = await fetch(`/api/batches/${batch._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.message || "রুটিন সেভ করা যায়নি");
      toast.success("সাবজেক্ট ও রুটিন আপডেট হয়েছে");
      onClose();
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "রুটিন সেভ করা যায়নি");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AdminModal
      open={open}
      onClose={onClose}
      title={`রুটিন — ${batch.title}`}
      description="সাবজেক্ট, শিক্ষক ও সময়সূচি সেট করুন।"
      maxWidth="max-w-5xl"
    >
      <form onSubmit={handleSubmit}>
        <BatchSubjectRows teachers={teachers} initialSubjects={batch.subjects} />

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-sage-border px-5 py-2.5 text-sm font-bold text-sage-secondary transition hover:bg-sage-red-50"
          >
            বাতিল
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-lg bg-sage-primary px-6 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-sage-primary/90 disabled:opacity-60"
          >
            {isSaving ? "সেভ হচ্ছে..." : "রুটিন সেভ করুন"}
          </button>
        </div>
      </form>
    </AdminModal>
  );
}
