"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { BatchImageUploadField } from "../batches/BatchImageUploadField";

const inputClass = "h-11 rounded-lg border border-sage-border bg-sage-white px-3 text-sm outline-none";

type PromotionCard = {
  _id: string;
  title: string;
  image: string;
  badge: string;
  features: string[];
  overview?: string;
  linkedBatch?: string;
  websiteVisible: boolean;
  featured: boolean;
  order: number;
};

export function PromotionCardEditForm({ 
  card, 
  batches,
  onCancel 
}: { 
  card: PromotionCard; 
  batches: { _id: string; title: string; batchCode: string }[];
  onCancel: () => void;
}) {
  const [previewUrl, setPreviewUrl] = useState(card.image);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch(`/api/promotion-cards/${card._id}`, {
        method: "PATCH",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "কার্ড আপডেট করা যায়নি");
      
      toast.success("প্রমোশন কার্ড আপডেট হয়েছে");
      router.refresh();
      onCancel();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "কার্ড আপডেট করা যায়নি");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-sage-border bg-sage-red-50 p-6 shadow-inner">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-xl font-bold text-sage-secondary">প্রমোশন কার্ড এডিট করুন</h3>
        <button type="button" onClick={onCancel} className="text-sm font-bold text-sage-gray-500 hover:text-sage-primary">বাতিল</button>
      </div>
      
      <div className="grid gap-5 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold text-sage-secondary">
          কার্ড টাইটেল
          <input name="title" defaultValue={card.title} required className={inputClass} />
        </label>

        <label className="grid gap-2 text-sm font-semibold text-sage-secondary">
          লিঙ্কড ব্যাচ
          <select name="linkedBatch" defaultValue={card.linkedBatch || ""} className={inputClass}>
            <option value="">কোনোটিই নয়</option>
            {batches.map((b) => (
              <option key={b._id} value={b._id}>
                {b.title} ({b.batchCode})
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm font-semibold text-sage-secondary">
          ব্যাজ টেক্সট (স্ট্যাটাস)
          <select name="badge" defaultValue={card.badge} className={inputClass}>
            <option value="ভর্তি চলছে">ভর্তি চলছে</option>
            <option value="শীঘ্রই শুরু">শীঘ্রই শুরু</option>
            <option value="ভর্তি বন্ধ">ভর্তি বন্ধ</option>
          </select>
        </label>

        <label className="grid gap-2 text-sm font-semibold text-sage-secondary">
          ডিসপ্লে অর্ডার
          <input name="order" type="number" defaultValue={card.order} className={inputClass} />
        </label>

        <div className="md:col-span-2">
          <label className="grid gap-2 text-sm font-semibold text-sage-secondary">
            কার্ড ওভারভিউ (বিস্তারিত বিবরণ)
            <textarea 
              name="overview" 
              defaultValue={card.overview}
              placeholder="এই ব্যাচের বিস্তারিত বিবরণ এখানে লিখুন..." 
              className={`${inputClass} h-32 py-2 resize-none`}
            />
          </label>
        </div>

        <div className="md:col-span-2">
          <BatchImageUploadField 
            label="কার্ড পোস্টার ইমেজ" 
            previewUrl={previewUrl} 
            fallbackUrl={card.image}
            onPreviewChange={setPreviewUrl} 
          />
          <input type="hidden" name="image" value={card.image} />
        </div>

        {[1, 2, 3, 4, 5].map((num) => (
          <label key={num} className="grid gap-2 text-sm font-semibold text-sage-secondary">
            কার্ড ফিচার {num}
            <input 
              name={`feature${num}`} 
              required 
              defaultValue={card.features[num-1] || ""} 
              className={inputClass} 
            />
          </label>
        ))}
      </div>

      <div className="mt-6 flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm font-semibold text-sage-secondary">
          <input name="websiteVisible" type="checkbox" defaultChecked={card.websiteVisible} /> ওয়েবসাইটে দেখান
        </label>
        <label className="flex items-center gap-2 text-sm font-semibold text-sage-secondary">
          <input name="featured" type="checkbox" defaultChecked={card.featured} /> হোমপেজে ফিচার
        </label>
        <button 
          disabled={isSaving} 
          className="ml-auto rounded-lg bg-sage-primary px-8 py-3 font-bold text-white transition hover:bg-sage-primary/90 disabled:opacity-50"
        >
          {isSaving ? "আপডেট হচ্ছে..." : "আপডেট সেভ করুন"}
        </button>
      </div>
    </form>
  );
}
