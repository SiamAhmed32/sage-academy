import { FileText, ExternalLink } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export function AdmissionFilePreview({ uploadedForm }: { uploadedForm: any }) {
  if (!uploadedForm?.url) return null;

  const isImage = 
    uploadedForm.resourceType === "image" || 
    /\.(jpg|jpeg|png|webp)$/i.test(uploadedForm.url);

  return (
    <div className="rounded-3xl border border-sage-border bg-white shadow-sm overflow-hidden">
      <div className="border-b border-sage-border bg-sage-red-50/50 px-6 py-4">
        <h3 className="flex items-center gap-2 text-sm font-black text-sage-secondary">
          <FileText size={18} className="text-sage-primary" />
          আপলোড করা ভর্তি ফর্ম (Uploaded Document)
        </h3>
      </div>
      
      <div className="p-6">
        {isImage ? (
          <div className="space-y-4">
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl border border-sage-border bg-sage-red-50/20 sm:max-w-md mx-auto">
              <Image 
                src={uploadedForm.url} 
                alt="Uploaded admission form" 
                fill 
                className="object-contain"
                unoptimized // Cloudinary images usually don't need next/image optimization if we want full quality
              />
            </div>
            <div className="flex justify-center">
              <Link
                href={uploadedForm.url}
                target="_blank"
                className="inline-flex items-center gap-2 rounded-xl bg-sage-primary px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-sage-primary/20 transition hover:bg-sage-secondary active:scale-[0.98]"
              >
                পূর্ণ সাইজে দেখুন (View Full Image)
                <ExternalLink size={14} />
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-sage-red-50 text-sage-primary">
              <FileText size={32} />
            </div>
            <p className="font-bold text-sage-secondary">এটি একটি PDF ফাইল</p>
            <p className="mt-1 text-xs text-sage-gray-500 mb-6">বিস্তারিত দেখতে নিচের বাটনে ক্লিক করুন।</p>
            <Link
              href={uploadedForm.url}
              target="_blank"
              className="inline-flex items-center gap-2 rounded-xl bg-sage-primary px-8 py-3 text-sm font-bold text-white shadow-lg shadow-sage-primary/20 transition hover:bg-sage-secondary active:scale-[0.98]"
            >
              পিডিএফটি ওপেন করুন (Open PDF)
              <ExternalLink size={14} />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
