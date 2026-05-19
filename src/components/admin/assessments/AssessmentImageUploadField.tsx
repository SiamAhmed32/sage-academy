"use client";

import Image from "next/image";
import { ChangeEvent, useId } from "react";
import { Camera, X } from "lucide-react";

type Props = {
  previewUrl: string;
  onPreviewChange: (url: string) => void;
  fallbackUrl?: string;
};

export function AssessmentImageUploadField({ previewUrl, onPreviewChange, fallbackUrl = "" }: Props) {
  const inputId = useId();
  const hasPreview = Boolean(previewUrl);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    onPreviewChange(file ? URL.createObjectURL(file) : fallbackUrl);
  }

  function removeImage() {
    onPreviewChange("");
    const input = document.getElementById(inputId) as HTMLInputElement | null;
    if (input) input.value = "";
  }

  return (
    <div className="rounded-2xl border border-sage-border bg-sage-red-50/30 p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-black text-sage-secondary">ক্যাম্পেইন ছবি</p>
          <p className="mt-1 text-xs font-semibold text-sage-gray-500">
            পোস্টার/ক্লাসরুম/এক্সাম ভিজ্যুয়াল আপলোড করুন। JPG, PNG, WEBP, সর্বোচ্চ ৫MB।
          </p>
        </div>
        <div className="relative">
          <input
            id={inputId}
            name="imageFile"
            type="file"
            accept=".jpg,.jpeg,.png,.webp"
            className="absolute inset-0 z-10 cursor-pointer opacity-0"
            onChange={handleFileChange}
          />
          <div className="inline-flex h-11 items-center gap-2 rounded-xl border border-sage-border bg-white px-4 text-sm font-black text-sage-secondary transition hover:border-sage-primary hover:text-sage-primary">
            <Camera className="h-4 w-4" />
            ছবি নির্বাচন
          </div>
        </div>
      </div>

      {hasPreview ? (
        <div className="relative mt-4 aspect-[16/7] overflow-hidden rounded-2xl border border-sage-border bg-white">
          <Image src={previewUrl} alt="Assessment image preview" fill unoptimized className="object-cover" />
          <button
            type="button"
            onClick={removeImage}
            className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white text-sage-primary shadow-lg"
            aria-label="Remove image"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
