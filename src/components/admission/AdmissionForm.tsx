"use client";

import { useRef, useState } from "react";
import { SendHorizonal, CheckCircle2 } from "lucide-react";
import { toast } from "react-toastify";

import { Button } from "@/components/ui/button";
import { admissionPageContent } from "@/constants/admission";
import { getLeadAttributionPayload } from "@/lib/lead-attribution";
import { trackEngagementEvent } from "@/lib/engagement-tracker";

import { AdmissionHero } from "./AdmissionHero";
import { AdmissionFileUpload } from "./AdmissionFileUpload";
import { AdmissionOnlineFields } from "./AdmissionOnlineFields";

const initialForm = {
  studentName: "",
  nameBangla: "",
  fatherName: "",
  motherName: "",
  guardianName: "",
  phone: "",
  studentWhatsapp: "",
  email: "",
  className: "",
  schoolName: "",
  section: "",
  classRoll: "",
  studentDateOfBirth: "",
  studentGender: "",
  preferredBatch: "",
  academicVersion: "bangla",
  interestedSubjects: "",
  admissionDate: "",
  presentAddress: "",
  permanentAddress: "",
  message: "",
  source: "admission-page",
};

type AdmissionFormState = typeof initialForm;

function getErrorMessage(error: unknown, fallback = "আবেদন পাঠানো যায়নি।") {
  return error instanceof Error ? error.message : fallback;
}

export function AdmissionForm() {
  const [form, setForm] = useState(initialForm);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [feedback, setFeedback] = useState("");
  const [sameAddress, setSameAddress] = useState(false);
  const formEngagementSent = useRef(false);

  const isSubmitting = status === "submitting";
  const isSuccess = status === "success";

  function updateField(name: keyof AdmissionFormState, value: string) {
    setForm((current) => {
      const next = { ...current, [name]: value };
      if (name === "presentAddress" && sameAddress) {
        next.permanentAddress = value;
      }
      return next;
    });
  }

  function toggleSameAddress(checked: boolean) {
    setSameAddress(checked);
    if (checked) {
      setForm((current) => ({
        ...current,
        permanentAddress: current.presentAddress,
      }));
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    
    // Basic Client Side Check
    if (!uploadedFile) {
      if (!form.studentName.trim() || !form.phone.trim() || !form.className.trim()) {
        setFeedback("Please fill required fields (Name, Phone, শ্রেণি)");
        setStatus("error");
        return;
      }
    }

    setStatus("submitting");
    setFeedback("");

    const submissionPromise = (async () => {
      const payload = new FormData();
      Object.entries(form).forEach(([key, value]) => payload.append(key, value));
      if (uploadedFile) {
        payload.append("uploadedForm", uploadedFile);
      }
      const attr = getLeadAttributionPayload(
        typeof window !== "undefined" ? window.location.pathname : "/"
      );
      Object.entries(attr).forEach(([k, v]) => payload.append(k, v));

      const response = await fetch("/api/admission-requests", {
        method: "POST",
        body: payload,
      });

      let result;
      const contentType = response.headers.get("content-type");
      
      if (contentType?.includes("application/json")) {
        result = await response.json();
      } else {
        throw new Error(`সার্ভার থেকে সমস্যা হয়েছে (Status: ${response.status})।`);
      }

      if (!response.ok || !result.success) {
        throw new Error(result.message || "আবেদন পাঠানো যায়নি।");
      }

      return result;
    })();

    toast.promise(submissionPromise, {
      pending: "আবেদন পাঠানো হচ্ছে...",
      success: "আবেদন সফলভাবে পাঠানো হয়েছে! 🎉",
      error: {
        render({ data }: { data: unknown }) {
          return getErrorMessage(data);
        }
      }
    });

    try {
      await submissionPromise;
      setStatus("success");
      setFeedback(admissionPageContent.successMessage);
      setForm(initialForm);
      setUploadedFile(null);
      setSameAddress(false);
    } catch (err: unknown) {
      setStatus("error");
      setFeedback(getErrorMessage(err));
    }
  }

  if (isSuccess) {
    return (
      <div className="animate-in fade-in zoom-in rounded-lg border border-emerald-100 bg-white p-8 text-center shadow-xl shadow-emerald-100/30 duration-500 sm:p-10">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-500">
          <CheckCircle2 size={48} />
        </div>
        <h3 className="mb-3 text-2xl font-bold text-sage-secondary">আবেদন জমা হয়েছে!</h3>
        <p className="mb-8 font-medium text-sage-gray-700">আমাদের প্রতিনিধি আপনার সাথে শীঘ্রই যোগাযোগ করবেন।</p>
        <Button onClick={() => setStatus("idle")} className="rounded-lg bg-sage-primary px-8">আরও একটি আবেদন করুন</Button>
      </div>
    );
  }

  function handleFormInteractionStart() {
    if (formEngagementSent.current) return;
    formEngagementSent.current = true;
    void trackEngagementEvent({
      eventType: "admission_form_started",
      path: "/admission",
      oncePerSession: "form_start",
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      onFocusCapture={handleFormInteractionStart}
      className="rounded-lg border border-sage-border bg-white p-5 shadow-xl shadow-sage-red-100/20 sm:p-7 lg:p-8"
    >
      <AdmissionHero />
      
      <AdmissionFileUpload 
        uploadedFile={uploadedFile} 
        setUploadedFile={setUploadedFile} 
        isSubmitting={isSubmitting} 
      />

      <div className="my-9 flex items-center gap-3">
        <div className="h-px flex-1 bg-sage-border" />
        <span className="text-center text-[10px] font-black uppercase tracking-[0.22em] text-sage-primary">
          অথবা অনলাইনে ফর্ম পূরণ করুন
        </span>
        <div className="h-px flex-1 bg-sage-border" />
      </div>

      <AdmissionOnlineFields 
        form={form} 
        updateField={updateField} 
        toggleSameAddress={toggleSameAddress} 
        sameAddress={sameAddress} 
        requiresOnlineFields={!uploadedFile}
      />

      {feedback && (
        <div className="animate-in slide-in-from-top-2 mt-8 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-5 text-sm font-bold text-red-700 duration-300">
          {status === "error" && <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-red-600 text-[10px] text-white">!</span>}
          {feedback}
        </div>
      )}

      <Button 
        type="submit" 
        size="lg" 
        className="mt-10 h-14 w-full rounded-lg bg-sage-primary text-base font-bold text-white shadow-lg shadow-sage-primary/30 transition hover:bg-sage-secondary hover:shadow-sage-secondary/30 active:scale-[0.98]" 
        disabled={isSubmitting}
      >
        <SendHorizonal className="h-5 w-5" />
        {isSubmitting ? "পাঠানো হচ্ছে..." : admissionPageContent.submitLabel}
      </Button>
    </form>
  );
}
