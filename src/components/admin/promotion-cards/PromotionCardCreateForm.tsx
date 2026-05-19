"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { BatchImageUploadField } from "../batches/BatchImageUploadField";

const inputClass = "h-11 rounded-lg border border-sage-border bg-sage-white px-3 text-sm outline-none";

export function PromotionCardCreateForm({ batches }: { batches: { _id: string; title: string; batchCode: string }[] }) {
  const [previewUrl, setPreviewUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
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
      form.reset();
      setPreviewUrl("");
      setIsOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "কার্ড তৈরি করা যায়নি");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="mb-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-sage-border bg-white p-4">
        <div>
          <h3 className="text-lg font-bold text-sage-secondary">প্রমোশন কার্ড তৈরি</h3>
          <p className="mt-1 text-sm text-sage-gray-500">
            ওয়েবসাইটের জন্য নতুন প্রমোশন কার্ড যোগ করুন।
          </p>
        </div>
        <button 
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="h-10 rounded-lg bg-sage-primary px-4 text-sm font-bold text-white transition hover:bg-sage-secondary"
        >
          {isOpen ? "ফর্ম বন্ধ করুন" : "নতুন কার্ড"}
        </button>
      </div>

      {isOpen && (
        <form onSubmit={handleSubmit} className="animate-in fade-in slide-in-from-top-4 duration-300 rounded-xl border border-sage-border bg-sage-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-bold text-sage-secondary">নতুন প্রমোশন কার্ড তৈরি করুন</h3>
      
      <div className="grid gap-5 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold text-sage-secondary">
          কার্ড টাইটেল (যেমন: ৭ম শ্রেণি)
          <input name="title" required placeholder="৭ম শ্রেণি" className={inputClass} />
        </label>

        <label className="grid gap-2 text-sm font-semibold text-sage-secondary">
          লিঙ্কড ব্যাচ (ঐচ্ছিক)
          <select name="linkedBatch" className={inputClass}>
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
          <select name="badge" className={inputClass}>
            <option value="ভর্তি চলছে">ভর্তি চলছে</option>
            <option value="শীঘ্রই শুরু">শীঘ্রই শুরু</option>
            <option value="ভর্তি বন্ধ">ভর্তি বন্ধ</option>
          </select>
        </label>

        <label className="grid gap-2 text-sm font-semibold text-sage-secondary">
          ডিসপ্লে অর্ডার
          <input name="order" type="number" defaultValue="0" className={inputClass} />
        </label>

        <div className="md:col-span-2">
          <label className="grid gap-2 text-sm font-semibold text-sage-secondary">
            কার্ড ওভারভিউ (বিস্তারিত বিবরণ)
            <textarea 
              name="overview" 
              placeholder="এই ব্যাচের বিস্তারিত বিবরণ এখানে লিখুন..." 
              className={`${inputClass} h-32 py-2 resize-none`}
            />
          </label>
        </div>

        <div className="md:col-span-2">
          <BatchImageUploadField 
            label="কার্ড পোস্টার ইমেজ" 
            previewUrl={previewUrl} 
            onPreviewChange={setPreviewUrl} 
          />
        </div>

        {[1, 2, 3, 4, 5].map((num) => (
          <label key={num} className="grid gap-2 text-sm font-semibold text-sage-secondary">
            কার্ড ফিচার {num}
            <input name={`feature${num}`} required placeholder={`ফিচার ${num}`} className={inputClass} />
          </label>
        ))}
      </div>

      <div className="mt-6 flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm font-semibold text-sage-secondary">
          <input name="websiteVisible" type="checkbox" defaultChecked /> ওয়েবসাইটে দেখান
        </label>
        <label className="flex items-center gap-2 text-sm font-semibold text-sage-secondary">
          <input name="featured" type="checkbox" /> হোমপেজে ফিচার
        </label>
        <button 
          disabled={isSaving} 
          className="ml-auto rounded-lg bg-sage-primary px-8 py-3 font-bold text-white transition hover:bg-sage-primary/90 disabled:opacity-50"
        >
          {isSaving ? "তৈরি হচ্ছে..." : "কার্ড তৈরি করুন"}
        </button>
      </div>
        </form>
      )}
    </div>
  );
}
