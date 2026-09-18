"use client";

import { Plus, Trash2 } from "lucide-react";

type Props = {
  features: string[];
  onFeaturesChange: (val: string[]) => void;
  scheduleNote: string;
  onScheduleNoteChange: (val: string) => void;
};

const inputClass = "h-11 rounded-xl border border-sage-border bg-white px-3 text-sm outline-none focus:border-sage-primary w-full";
const textareaClass = "min-h-32 rounded-xl border border-sage-border bg-white px-3 py-3 text-sm outline-none focus:border-sage-primary w-full";

export function AssessmentFormTabFeatures({
  features,
  onFeaturesChange,
  scheduleNote,
  onScheduleNoteChange,
}: Props) {
  const addFeature = () => onFeaturesChange([...features, ""]);
  const removeFeature = (index: number) => onFeaturesChange(features.filter((_, i) => i !== index));
  const updateFeature = (index: number, val: string) => {
    const newFeatures = [...features];
    newFeatures[index] = val;
    onFeaturesChange(newFeatures);
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div>
        <label className="mb-3 grid gap-1 text-sm font-bold text-sage-secondary">
          Program features
          <span className="text-[11px] font-medium text-sage-gray-500">
            Add the key benefits students should see
          </span>
        </label>
        
        <div className="space-y-2">
          {features.map((feature, idx) => (
            <div key={idx} className="flex gap-2 items-center">
              <span className="shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-sage-cream text-xs font-black text-sage-primary">
                {idx + 1}
              </span>
              <input
                value={feature}
                onChange={(e) => updateFeature(idx, e.target.value)}
                placeholder="For example: High-quality question papers"
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => removeFeature(idx)}
                className="shrink-0 rounded-xl p-2.5 text-sage-gray-400 hover:bg-sage-red-50 hover:text-sage-red-600 transition"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addFeature}
          className="mt-3 flex items-center gap-1.5 text-xs font-black text-sage-primary hover:text-sage-secondary transition"
        >
          <Plus className="h-3.5 w-3.5" />
          Add feature
        </button>
      </div>

      <label className="grid gap-2 text-sm font-bold text-sage-secondary self-start">
        <span className="grid gap-1">
          Special instructions / routine notes
          <span className="text-[11px] font-medium text-sage-gray-500">
            Add any special exam schedule or policy instructions
          </span>
        </span>
        <textarea
          name="scheduleNote"
          value={scheduleNote}
          onChange={(e) => onScheduleNoteChange(e.target.value)}
          className={textareaClass}
          placeholder="For example: Arrive five minutes before the exam."
        />
      </label>
    </div>
  );
}
