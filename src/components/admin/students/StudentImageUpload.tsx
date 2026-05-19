"use client";

import { useState } from "react";
import { Camera, X } from "lucide-react";
import Image from "next/image";

interface StudentImageUploadProps {
  currentImage?: string;
}

export function StudentImageUpload({ currentImage }: StudentImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const [isRemoved, setIsRemoved] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
        setIsRemoved(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setPreview(null);
    setIsRemoved(true);
    const input = document.getElementById("student-image-input") as HTMLInputElement;
    if (input) input.value = "";
  };

  return (
    <div className="space-y-4">
      {isRemoved && <input type="hidden" name="removeImage" value="true" />}
      <div className="flex flex-col items-center gap-6">
        {/* Preview Row */}
        {preview && (
          <div className="relative h-40 w-40 overflow-hidden rounded-2xl border-4 border-sage-red-50 shadow-xl animate-in fade-in zoom-in duration-300">
            <Image
              src={preview}
              alt="Student Preview"
              fill
              className="object-cover"
            />
            <button
              type="button"
              onClick={removeImage}
              className="absolute right-2 top-2 rounded-full bg-sage-primary p-1.5 text-white shadow-lg hover:bg-sage-secondary transition active:scale-95"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Upload Button */}
        <div className="relative w-full max-w-[300px]">
          <input
            id="student-image-input"
            type="file"
            name="image"
            accept="image/*"
            onChange={handleImageChange}
            className="absolute inset-0 z-10 cursor-pointer opacity-0"
          />
          <div className="flex items-center justify-center gap-3 rounded-xl border-2 border-dashed border-sage-border bg-sage-red-50/30 px-6 py-4 transition hover:border-sage-primary hover:bg-sage-red-50/50">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-sage-primary shadow-sm">
              <Camera size={20} />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-sage-secondary">ছবি আপলোড করুন</p>
              <p className="text-[10px] text-sage-gray-500 font-medium">JPG, PNG (Max 5MB)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
