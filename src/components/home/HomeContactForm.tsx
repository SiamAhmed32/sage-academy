"use client";

import { useState } from "react";
import { SendHorizonal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { homeContactContent } from "@/constants/contact";
import { getLeadAttributionPayload } from "@/lib/lead-attribution";

const emptyFields = {
  name: "",
  phone: "",
  message: "",
};

type HomeContactFormProps = {
  /** Distinct placement for analytics (UTMs still captured separately). */
  placementSource?: string;
};

export function HomeContactForm({
  placementSource = "home-contact-section",
}: HomeContactFormProps) {
  const [form, setForm] = useState(emptyFields);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [feedback, setFeedback] = useState("");

  function updateField(name: keyof typeof emptyFields, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setFeedback("");

    const submitPath =
      typeof window !== "undefined" ? window.location.pathname : "/";
    const attribution = getLeadAttributionPayload(submitPath);

    const response = await fetch("/api/contact-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        source: placementSource,
        ...attribution,
      }),
    });
    const result = (await response.json()) as { success: boolean; message: string };

    if (!response.ok || !result.success) {
      setStatus("error");
      setFeedback(result.message || "বার্তা পাঠানো যায়নি। আবার চেষ্টা করুন।");
      return;
    }

    setStatus("success");
    setFeedback(homeContactContent.successMessage);
    setForm(emptyFields);
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-[2rem] bg-sage-white p-6 sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="contact-name">নাম</Label>
          <Input id="contact-name" value={form.name} onChange={(e) => updateField("name", e.target.value)} className="h-11" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact-phone">ফোন নম্বর</Label>
          <Input id="contact-phone" value={form.phone} onChange={(e) => updateField("phone", e.target.value)} className="h-11" />
        </div>
      </div>
      <div className="mt-5 space-y-2">
        <Label htmlFor="contact-message">বার্তা</Label>
        <Textarea id="contact-message" value={form.message} onChange={(e) => updateField("message", e.target.value)} className="min-h-32" />
      </div>
      {feedback ? <p className={`mt-4 text-sm ${status === "success" ? "text-sage-primary" : "text-destructive"}`}>{feedback}</p> : null}
      <Button type="submit" size="lg" className="mt-6 h-11 rounded-full bg-sage-primary px-6 text-sage-white hover:bg-sage-primary-hover" disabled={status === "submitting"}>
        <SendHorizonal />
        {status === "submitting" ? "পাঠানো হচ্ছে..." : homeContactContent.submitLabel}
      </Button>
    </form>
  );
}
