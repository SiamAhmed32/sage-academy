"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

import { AdminModal } from "@/components/admin/shared/AdminModal";
import { BatchInfoFields } from "./BatchInfoFields";
import type { AdminBatch } from "./types";

interface BatchInfoModalProps {
  /** When set, modal operates in edit mode */
  batch?: AdminBatch & { _id: string };
  open: boolean;
  onClose: () => void;
}

export function BatchInfoModal({ batch, open, onClose }: BatchInfoModalProps) {
  const isEdit = !!batch;
  const [classLevel, setClassLevel] = useState(batch?.classLevel ?? 6);
  const [genderGroup, setGenderGroup] = useState<string>(batch?.genderGroup ?? "male");
  const [version, setVersion] = useState<string>(batch?.version ?? "bangla");
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    const formData = new FormData(event.currentTarget);
    formData.set("classLevel", String(classLevel));
    formData.set("genderGroup", genderGroup);
    formData.set("version", version);
    formData.set("isActive", "true");

    const url = isEdit ? `/api/batches/${batch._id}` : "/api/academic-batches";
    const method = isEdit ? "PATCH" : "POST";

    try {
      const response = await fetch(url, { method, body: formData });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.message || "ব্যাচ সেভ করা যায়নি");
      toast.success(isEdit ? "ব্যাচ আপডেট হয়েছে" : "নতুন ব্যাচ তৈরি হয়েছে");
      onClose();
      if (!isEdit && data?.data?._id) {
        const urlParams = new URLSearchParams(window.location.search);
        urlParams.set("openRoutine", data.data._id);
        router.push(`${window.location.pathname}?${urlParams.toString()}`);
      } else {
        router.refresh();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "ব্যাচ সেভ করা যায়নি");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AdminModal
      open={open}
      onClose={onClose}
      title={isEdit ? "ব্যাচ তথ্য পরিবর্তন" : "নতুন একাডেমিক ব্যাচ"}
      description={isEdit ? "ব্যাচের মৌলিক তথ্য পরিবর্তন করুন।" : "নতুন ব্যাচ তৈরি করতে তথ্য দিন।"}
    >
      <form onSubmit={handleSubmit}>
        <BatchInfoFields
          classLevel={classLevel}
          genderGroup={genderGroup}
          version={version}
          onClassLevelChange={setClassLevel}
          onGenderGroupChange={setGenderGroup}
          onVersionChange={setVersion}
          defaults={batch}
        />

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
            {isSaving ? "সেভ হচ্ছে..." : isEdit ? "আপডেট করুন" : "ব্যাচ তৈরি করুন"}
          </button>
        </div>
      </form>
    </AdminModal>
  );
}
