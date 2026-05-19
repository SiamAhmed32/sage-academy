import { Paperclip, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { admissionPageContent } from "@/constants/admission";

interface AdmissionFileUploadProps {
  uploadedFile: File | null;
  setUploadedFile: (file: File | null) => void;
  isSubmitting: boolean;
}

export function AdmissionFileUpload({ 
  uploadedFile, 
  setUploadedFile, 
  isSubmitting 
}: AdmissionFileUploadProps) {
  return (
    <div className="mt-6 space-y-3">
      <Label htmlFor="uploadedForm" className="text-sm font-bold text-sage-secondary">
        {admissionPageContent.uploadLabel}
      </Label>
      <label 
        htmlFor="uploadedForm" 
        className="flex cursor-pointer flex-col gap-4 rounded-lg border border-dashed border-sage-red-100 bg-[#fffafa] px-4 py-4 transition hover:border-sage-primary sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-sage-primary ring-1 ring-sage-red-100">
            <Paperclip className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-sage-secondary">
              {uploadedFile ? uploadedFile.name : "ফাইল নির্বাচন করুন"}
            </p>
            <p className="mt-1 text-xs text-sage-gray-700">{admissionPageContent.uploadHint}</p>
          </div>
        </div>
        <span className="inline-flex h-9 shrink-0 items-center justify-center rounded-lg border border-sage-primary px-4 text-xs font-bold text-sage-primary">
          আপলোড
        </span>
      </label>
      <input 
        id="uploadedForm" 
        type="file" 
        accept=".jpg,.jpeg,.png,.webp,.pdf" 
        className="sr-only" 
        onChange={(e) => setUploadedFile(e.target.files?.[0] ?? null)} 
      />

      <Button
        type="submit"
        size="lg"
        className="h-11 rounded-lg bg-sage-primary px-6 text-sm font-bold text-sage-white hover:bg-sage-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isSubmitting || !uploadedFile}
      >
        <UploadCloud className="h-4 w-4" />
        {isSubmitting ? "পাঠানো হচ্ছে..." : "আপলোড করা ফর্ম জমা দিন"}
      </Button>
    </div>
  );
}
