"use client";

import { useState } from "react";
import Image from "next/image";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { Archive, Trash2, RotateCcw } from "lucide-react";
import { PromotionCardEditModal } from "./PromotionCardEditModal";
import type { PromotionCard } from "./types";
import type { SerializedPromotionCard } from "@/lib/promotion-card-serialize";

type BatchOption = { _id: string; title: string; batchCode: string };

interface PromotionCardTableRowProps {
  card: SerializedPromotionCard;
  batches: BatchOption[];
}

export function PromotionCardTableRow({ card, batches }: PromotionCardTableRowProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();

  async function handleAction(action: "archive" | "delete" | "restore") {
    if (action === "delete" && !confirm("এই কার্ডটি কি চিরতরে মুছে ফেলতে চান?")) return;
    
    setIsProcessing(true);
    try {
      let url = `/api/promotion-cards/${card._id}`;
      let method = "DELETE";

      if (action === "delete") url += "?permanent=true";
      if (action === "restore") {
        method = "PATCH";
        const formData = new FormData();
        formData.append("isArchived", "false");
        formData.append("websiteVisible", "on");

        const res = await fetch(url, { method, body: formData });
        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.success) {
          throw new Error(data?.message || "অ্যাকশনটি সফল হয়নি");
        }
      } else {
        const res = await fetch(url, { method });
        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.success) {
          throw new Error(data?.message || "অ্যাকশনটি সফল হয়নি");
        }
      }

      toast.success(
        action === "archive" ? "কার্ডটি আর্কাইভ করা হয়েছে" : 
        action === "restore" ? "কার্ডটি রিস্টোর করা হয়েছে" : "কার্ডটি চিরতরে মুছে ফেলা হয়েছে"
      );
      router.refresh();
    } catch (error) {
      toast.error("দুঃখিত, পুনরায় চেষ্টা করুন");
    } finally {
      setIsProcessing(false);
    }
  }

  // Convert populated linkedBatch back to string ID for the edit form
  const cardForEdit: PromotionCard = {
    ...card,
    linkedBatch: card.linkedBatch?._id,
  };

  return (
    <>
      <tr className={`transition-colors hover:bg-sage-red-50/30 ${isProcessing ? "opacity-50 pointer-events-none" : ""}`}>
        <td className="p-4">
          <div className="relative flex h-16 w-24 items-center justify-center overflow-hidden rounded-lg border border-sage-border bg-sage-red-50">
            {card.image ? (
              <Image src={card.image} alt={card.title} fill sizes="96px" className="object-cover" unoptimized />
            ) : (
              <span className="text-[10px] text-sage-gray-400">No Image</span>
            )}
          </div>
        </td>
        <td className="p-4">
          <p className="font-bold text-sage-secondary">{card.title}</p>
          <p className="mt-1 text-xs text-sage-primary">{card.badge}</p>
        </td>
        <td className="p-4">
          {card.linkedBatch ? (
            <div>
              <p className="font-semibold text-sage-secondary">{card.linkedBatch.title}</p>
              <p className="text-xs text-sage-gray-500">{card.linkedBatch.batchCode}</p>
            </div>
          ) : (
            <span className="text-xs text-sage-gray-400">লিঙ্কড নেই</span>
          )}
        </td>
        <td className="max-w-xs p-4">
          <div className="flex flex-wrap gap-1">
            {(card.features ?? []).map((feature, index) => (
              <span
                key={`${card._id}-feature-${index}`}
                className="rounded-md bg-sage-white px-2 py-0.5 text-[10px] ring-1 ring-sage-red-100"
              >
                {feature}
              </span>
            ))}
          </div>
        </td>
        <td className="p-4">
          <div className="flex flex-col gap-1 text-[11px] font-bold">
            <span className={card.websiteVisible ? "text-green-600" : "text-gray-400"}>
              {card.websiteVisible ? "Visible" : "Hidden"}
            </span>
            <span className={card.featured ? "text-sage-primary" : "text-gray-400"}>
              {card.featured ? "Featured" : "Regular"}
            </span>
          </div>
        </td>
        <td className="p-4">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsEditModalOpen(true)}
              className="rounded-lg border border-sage-border bg-white px-3 py-1.5 text-xs font-bold text-sage-secondary transition hover:border-sage-primary hover:text-sage-primary"
            >
              এডিট
            </button>
            
            {!card.isArchived ? (
              <button 
                onClick={() => handleAction("archive")}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-sage-red-50 text-sage-primary transition hover:bg-sage-primary hover:text-white"
                title="আর্কাইভ করুন"
              >
                <Archive size={16} />
              </button>
            ) : (
              <>
                <button 
                  onClick={() => handleAction("restore")}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50 text-green-600 transition hover:bg-green-100"
                  title="রিস্টোর করুন"
                >
                  <RotateCcw size={16} />
                </button>
                
                <button 
                  onClick={() => handleAction("delete")}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600 transition hover:bg-red-600 hover:text-white"
                  title="মুছে ফেলুন"
                >
                  <Trash2 size={16} />
                </button>
              </>
            )}
          </div>
        </td>
      </tr>

      <PromotionCardEditModal
        card={cardForEdit}
        batches={batches}
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />
    </>
  );
}
