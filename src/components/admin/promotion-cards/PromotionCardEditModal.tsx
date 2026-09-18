"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { AdminModal } from "@/components/admin/shared/AdminModal";
import { PromotionCardFields } from "./PromotionCardFields";
import type { PromotionCard } from "./types";

type BatchOption = { _id: string; title: string; batchCode: string };

interface PromotionCardEditModalProps {
  card?: PromotionCard;
  batches: BatchOption[];
  open: boolean;
  onClose: () => void;
}

export function PromotionCardEditModal({ card, batches, open, onClose }: PromotionCardEditModalProps) {
  const [previewUrl, setPreviewUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const resetTimer = window.setTimeout(() => setPreviewUrl(card?.image ?? ""), 0);
    return () => window.clearTimeout(resetTimer);
  }, [card]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!card) return;
    
    setIsSaving(true);
    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch(`/api/promotion-cards/${card._id}`, {
        method: "PATCH",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not update the card");
      
      toast.success("Promotion card updated");
      router.refresh();
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update the card");
    } finally {
      setIsSaving(false);
    }
  }

  if (!card) return null;

  return (
    <AdminModal
      open={open}
      onClose={onClose}
      title="Edit promotion card"
      description="Update the card details and image."
    >
      <form onSubmit={handleSubmit}>
        <PromotionCardFields
          batches={batches}
          previewUrl={previewUrl}
          onPreviewChange={setPreviewUrl}
          defaults={card}
        />

        <div className="mt-6 flex items-center gap-4 border-t border-sage-border pt-6">
          <label className="flex items-center gap-2 text-sm font-semibold text-sage-secondary">
            <input name="websiteVisible" type="checkbox" defaultChecked={card.websiteVisible} /> Show on website
          </label>
          <label className="flex items-center gap-2 text-sm font-semibold text-sage-secondary">
            <input name="featured" type="checkbox" defaultChecked={card.featured} /> Feature on homepage
          </label>

          <div className="ml-auto flex gap-3">
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
              {isSaving ? "Updating..." : "Save update"}
            </button>
          </div>
        </div>
      </form>
    </AdminModal>
  );
}
