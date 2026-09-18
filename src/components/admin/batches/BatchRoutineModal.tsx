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
      if (!response.ok) throw new Error(data?.message || "The schedule could not be saved.");
      toast.success("Subjects and schedule updated.");
      onClose();
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The schedule could not be saved.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AdminModal
      open={open}
      onClose={onClose}
      title={`Schedule — ${batch.title}`}
      description="Configure subjects, teachers, and class times."
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
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-lg bg-sage-primary px-6 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-sage-primary/90 disabled:opacity-60"
          >
            {isSaving ? "Saving..." : "Save schedule"}
          </button>
        </div>
      </form>
    </AdminModal>
  );
}
