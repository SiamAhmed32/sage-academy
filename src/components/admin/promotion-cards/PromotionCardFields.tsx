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
        Card title
        <input name="title" defaultValue={defaults.title} required placeholder="Class 7" className={inputClass} />
      </label>

      <label className="grid gap-2 text-sm font-semibold text-sage-secondary">
        Linked batch (optional)
        <select name="linkedBatch" defaultValue={defaults.linkedBatch || ""} className={inputClass}>
          <option value="">None</option>
          {batches.map((b) => (
            <option key={b._id} value={b._id}>
              {b.title} ({b.batchCode})
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-2 text-sm font-semibold text-sage-secondary">
        Badge text (status)
        {/* admin-language-allow-start: canonical persisted public badge values */}
        <select name="badge" defaultValue={defaults.badge || "ভর্তি চলছে" /* admin-language-allow: persisted public value */} className={inputClass}>
          <option value="ভর্তি চলছে">{/* admin-language-allow: persisted public value */}Enrollment open</option>
          <option value="শীঘ্রই শুরু">{/* admin-language-allow: persisted public value */}Starting soon</option>
          <option value="ভর্তি বন্ধ">{/* admin-language-allow: persisted public value */}Enrollment closed</option>
        </select>
        {/* admin-language-allow-end */}
      </label>

      <label className="grid gap-2 text-sm font-semibold text-sage-secondary">
        Display order
        <input name="order" type="number" defaultValue={defaults.order ?? 0} className={inputClass} />
      </label>

      <div className="md:col-span-2">
        <label className="grid gap-2 text-sm font-semibold text-sage-secondary">
          Card overview
          <textarea
            name="overview"
            defaultValue={defaults.overview}
            placeholder="Enter a detailed description of this batch..."
            className={`${inputClass} h-32 py-2 resize-none`}
          />
        </label>
      </div>

      <div className="md:col-span-2">
        <BatchImageUploadField
          label="Card poster image"
          previewUrl={previewUrl}
          fallbackUrl={defaults.image}
          onPreviewChange={onPreviewChange}
        />
        <input type="hidden" name="image" value={defaults.image || ""} />
      </div>

      {[1, 2, 3, 4, 5].map((num) => (
        <label key={num} className="grid gap-2 text-sm font-semibold text-sage-secondary">
          Card feature {num}
          <input
            name={`feature${num}`}
            required
            placeholder={`Feature ${num}`}
            defaultValue={defaults.features?.[num - 1] || ""}
            className={inputClass}
          />
        </label>
      ))}
    </div>
  );
}
