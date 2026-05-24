"use client";

import { BatchImageUploadField } from "../batches/BatchImageUploadField";
import type { PromotionCard } from "./types";

const inputClass = "h-11 rounded-lg border border-sage-border bg-sage-white px-3 text-sm outline-none";

type PromotionCardFieldsProps = {
  batches: { _id: string; title: string; batchCode: string }[];
  previewUrl: string;
  onPreviewChange: (url: string) => void;
  defaults?: Partial<PromotionCard>;
};

export function PromotionCardFields({
  batches,
  previewUrl,
  onPreviewChange,
  defaults = {},
}: PromotionCardFieldsProps) {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <label className="grid gap-2 text-sm font-semibold text-sage-secondary">
        কার্ড টাইটেল
        <input name="title" defaultValue={defaults.title} required placeholder="৭ম শ্রেণি" className={inputClass} />
      </label>

      <label className="grid gap-2 text-sm font-semibold text-sage-secondary">
        লিঙ্কড ব্যাচ (ঐচ্ছিক)
        <select name="linkedBatch" defaultValue={defaults.linkedBatch || ""} className={inputClass}>
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
        <select name="badge" defaultValue={defaults.badge || "ভর্তি চলছে"} className={inputClass}>
          <option value="ভর্তি চলছে">ভর্তি চলছে</option>
          <option value="শীঘ্রই শুরু">শীঘ্রই শুরু</option>
          <option value="ভর্তি বন্ধ">ভর্তি বন্ধ</option>
        </select>
      </label>

      <label className="grid gap-2 text-sm font-semibold text-sage-secondary">
        ডিসপ্লে অর্ডার
        <input name="order" type="number" defaultValue={defaults.order ?? 0} className={inputClass} />
      </label>

      <div className="md:col-span-2">
        <label className="grid gap-2 text-sm font-semibold text-sage-secondary">
          কার্ড ওভারভিউ (বিস্তারিত বিবরণ)
          <textarea
            name="overview"
            defaultValue={defaults.overview}
            placeholder="এই ব্যাচের বিস্তারিত বিবরণ এখানে লিখুন..."
            className={`${inputClass} h-32 py-2 resize-none`}
          />
        </label>
      </div>

      <div className="md:col-span-2">
        <BatchImageUploadField
          label="কার্ড পোস্টার ইমেজ"
          previewUrl={previewUrl}
          fallbackUrl={defaults.image}
          onPreviewChange={onPreviewChange}
        />
        <input type="hidden" name="image" value={defaults.image || ""} />
      </div>

      {[1, 2, 3, 4, 5].map((num) => (
        <label key={num} className="grid gap-2 text-sm font-semibold text-sage-secondary">
          কার্ড ফিচার {num}
          <input
            name={`feature${num}`}
            required
            placeholder={`ফিচার ${num}`}
            defaultValue={defaults.features?.[num - 1] || ""}
            className={inputClass}
          />
        </label>
      ))}
    </div>
  );
}
