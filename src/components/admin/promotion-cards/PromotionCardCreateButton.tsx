"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { PromotionCardCreateModal } from "./PromotionCardCreateModal";

type BatchOption = { _id: string; title: string; batchCode: string };

export function PromotionCardCreateButton({ batches }: { batches: BatchOption[] }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex h-10 items-center gap-2 rounded-lg bg-sage-primary px-4 text-sm font-bold text-white transition hover:bg-sage-secondary"
      >
        <Plus size={18} />
        <span>নতুন প্রমোশন কার্ড</span>
      </button>

      <PromotionCardCreateModal
        batches={batches}
        open={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}
