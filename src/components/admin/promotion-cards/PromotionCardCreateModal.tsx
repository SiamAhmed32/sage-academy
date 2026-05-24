"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { AdminModal } from "@/components/admin/shared/AdminModal";
import { PromotionCardFields } from "./PromotionCardFields";

type BatchOption = { _id: string; title: string; batchCode: string };

interface PromotionCardCreateModalProps {
  batches: BatchOption[];
  open: boolean;
  onClose: () => void;
}

export function PromotionCardCreateModal({ batches, open, onClose }: PromotionCardCreateModalProps) {
  const [previewUrl, setPreviewUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      const response = await fetch("/api/promotion-cards", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "কার্ড তৈরি করা যায়নি");
      
      toast.success("প্রমোশন কার্ড তৈরি হয়েছে");
      setPreviewUrl("");
      onClose();
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "কার্ড তৈরি করা যায়নি");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AdminModal
      open={open}
      onClose={onClose}
      title="নতুন প্রমোশন কার্ড"
      description="ওয়েবসাইটের জন্য নতুন প্রমোশন কার্ড যোগ করুন।"
    >
      <form onSubmit={handleSubmit}>
        <PromotionCardFields
          batches={batches}
          previewUrl={previewUrl}
          onPreviewChange={setPreviewUrl}
        />

        <div className="mt-6 flex items-center gap-4 border-t border-sage-border pt-6">
          <label className="flex items-center gap-2 text-sm font-semibold text-sage-secondary">
            <input name="websiteVisible" type="checkbox" defaultChecked /> ওয়েবসাইটে দেখান
          </label>
          <label className="flex items-center gap-2 text-sm font-semibold text-sage-secondary">
            <input name="featured" type="checkbox" /> হোমপেজে ফিচার
          </label>

          <div className="ml-auto flex gap-3">
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
              {isSaving ? "তৈরি হচ্ছে..." : "কার্ড তৈরি করুন"}
            </button>
          </div>
        </div>
      </form>
    </AdminModal>
  );
}
