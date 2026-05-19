import { Download, FileText } from "lucide-react";
import { admissionPageContent } from "@/constants/admission";

const admissionFormPdfHref = "/forms/sage-admission-form-2026.pdf";

export function AdmissionHero() {
  return (
    <>
      <div className="rounded-lg bg-sage-red-50 p-5 ring-1 ring-sage-red-100">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-sage-white text-sage-primary">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-sage-secondary">দুইভাবে আবেদন করতে পারবেন</h3>
            <p className="mt-1 text-sm leading-7 text-sage-gray-700">{admissionPageContent.formIntro}</p>
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-lg border border-sage-red-100 bg-white p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-base font-bold text-sage-secondary">
              PDF ফর্ম ডাউনলোড করে জমা দিন
            </h3>
            <p className="mt-1 text-sm leading-7 text-sage-gray-700">
              হাতে পূরণ করা ফর্মের ছবি বা PDF আপলোড করলেও আবেদন গ্রহণ করা হবে।
            </p>
          </div>
          <a
            href={admissionFormPdfHref}
            download
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-sage-primary px-5 text-sm font-semibold text-sage-white shadow-md transition hover:bg-sage-primary-hover"
          >
            <Download className="h-4 w-4" />
            PDF ডাউনলোড
          </a>
        </div>
      </div>
    </>
  );
}
