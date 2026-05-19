"use client";

import Image from "next/image";
import { ChangeEvent, useId } from "react";
import type { ReactNode } from "react";
import { Camera, X } from "lucide-react";

type BatchImageUploadFieldProps = {
  label: ReactNode;
  previewUrl: string;
  onPreviewChange: (url: string) => void;
  fallbackUrl?: string;
};

export function BatchImageUploadField({
  label,
  previewUrl,
  onPreviewChange,
  fallbackUrl = "",
}: BatchImageUploadFieldProps) {
  const inputId = useId();
  const hasPreview = Boolean(previewUrl);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      onPreviewChange(fallbackUrl);
      return;
    }
    onPreviewChange(URL.createObjectURL(file));
  }

  const removeImage = () => {
    onPreviewChange("");
    const input = document.getElementById(inputId) as HTMLInputElement;
    if (input) input.value = "";
  };

  return (
    <div className="space-y-4">
      <div className="text-sm font-bold text-sage-secondary">
        {label}
      </div>

      <div className="flex flex-col items-start gap-6">
        {/* Preview with Close Button */}
        {hasPreview && (
          <div className="relative h-32 w-32 overflow-hidden rounded-xl border-2 border-sage-primary shadow-lg animate-in fade-in zoom-in duration-300">
            <Image
              src={previewUrl}
              alt="Batch image preview"
              fill
              unoptimized
              className="object-cover"
            />
            <button
              type="button"
              onClick={removeImage}
              className="absolute right-1 top-1 rounded-full bg-red-500 p-1 text-white shadow-md hover:bg-red-600 transition"
            >
              <X size={12} />
            </button>
          </div>
        )}

        {/* Custom Upload Button */}
        <div className="relative">
          <input
            id={inputId}
            name="imageFile"
            type="file"
            accept=".jpg,.jpeg,.png,.webp"
            className="absolute inset-0 z-10 cursor-pointer opacity-0"
            onChange={handleFileChange}
          />
          <div className="flex items-center gap-3 rounded-xl border-2 border-dashed border-sage-border bg-sage-red-50/30 px-6 py-3 transition hover:border-sage-primary hover:bg-sage-red-50/50">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-sage-primary shadow-sm">
              <Camera size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-sage-secondary">ব্যাচ ছবি আপলোড</p>
              <p className="text-[10px] text-sage-gray-500">JPG, PNG, WEBP (Max 5MB)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
