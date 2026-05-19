"use client";

import { FormEvent, useMemo, useState } from "react";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { toast } from "react-toastify";

import { getClassLabel } from "@/constants/class-levels";
import type { PublicAssessment } from "@/lib/assessments";

const inputClass = "h-12 rounded-xl border border-sage-warm-border bg-white px-4 text-sm font-semibold text-sage-secondary outline-none focus:border-sage-primary focus:ring-2 focus:ring-sage-primary/15";

export function AssessmentRegistrationForm({ assessment }: { assessment: PublicAssessment }) {
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(assessment.subjects.slice(0, 1));
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const classOptions = useMemo(
    () => assessment.classLevels.map((level) => ({ value: String(level), label: getClassLabel(level) })),
    [assessment.classLevels]
  );

  function toggleSubject(subject: string) {
    setSelectedSubjects((current) =>
      current.includes(subject) ? current.filter((item) => item !== subject) : [...current, subject]
    );
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (selectedSubjects.length === 0) {
      toast.error("কমপক্ষে একটি বিষয় বেছে নিন");
      return;
    }
    setSubmitting(true);
    const form = new FormData(event.currentTarget);
    const classValue = String(form.get("classLabel") || "");
    const payload = {
      assessmentKind: assessment.kind,
      assessmentId: assessment._id,
      name: String(form.get("name") || ""),
      phone: String(form.get("phone") || ""),
      classLabel: getClassLabel(classValue),
      version: String(form.get("version") || assessment.version),
      schoolName: String(form.get("schoolName") || ""),
      applicantType: String(form.get("applicantType") || "outside"),
      selectedSubjects,
      message: String(form.get("message") || ""),
    };

    try {
      const res = await fetch("/api/assessment-registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) throw new Error(json.message || "রেজিস্ট্রেশন করা যায়নি");
      setDone(true);
      toast.success("রেজিস্ট্রেশন জমা হয়েছে");
      event.currentTarget.reset();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "রেজিস্ট্রেশন করা যায়নি");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-3xl border border-emerald-100 bg-white p-7 text-center shadow-xl shadow-emerald-100/30">
        <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-500" />
        <h3 className="mt-4 text-2xl font-black text-sage-secondary">রেজিস্ট্রেশন জমা হয়েছে</h3>
        <p className="mt-2 text-sm font-semibold leading-6 text-sage-gray-700">আমাদের টিম দ্রুত যোগাযোগ করে পরবর্তী নির্দেশনা জানাবে।</p>
        <button type="button" onClick={() => setDone(false)} className="mt-6 rounded-xl bg-sage-secondary px-5 py-3 text-sm font-black text-white">
          আরেকটি রেজিস্ট্রেশন
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-3xl border border-sage-warm-border bg-white p-5 shadow-xl shadow-sage-secondary/10 sm:p-7">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.2em] text-sage-primary">Registration</p>
        <h3 className="mt-2 text-2xl font-black text-sage-secondary">রেজিস্ট্রেশন করুন</h3>
        <p className="mt-2 text-sm font-semibold leading-6 text-sage-gray-600">শ্রেণি, স্কুল ও বিষয় দিলে টিম সঠিক রুটিন জানাতে পারবে।</p>
      </div>

      <div className="mt-6 grid gap-4">
        <input name="name" required placeholder="শিক্ষার্থীর নাম" className={inputClass} />
        <input name="phone" required placeholder="মোবাইল নম্বর" className={inputClass} />
        <div className="grid gap-4 sm:grid-cols-2">
          <select name="classLabel" required className={inputClass} defaultValue={classOptions[0]?.value || ""}>
            {classOptions.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>
          <select name="version" required className={inputClass} defaultValue={assessment.version}>
            <option value="both">Bangla + English</option>
            <option value="bangla">বাংলা</option>
            <option value="english">English</option>
          </select>
        </div>
        <input name="schoolName" placeholder="স্কুল / কলেজের নাম" className={inputClass} />
        <select name="applicantType" required className={inputClass} defaultValue="outside">
          <option value="sage">SAGE শিক্ষার্থী</option>
          <option value="outside">বাইরের শিক্ষার্থী</option>
        </select>

        <div className="rounded-2xl border border-sage-warm-border bg-sage-cream p-4">
          <p className="text-sm font-black text-sage-secondary">বিষয় নির্বাচন করুন</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {assessment.subjects.map((subject) => (
              <button
                key={subject}
                type="button"
                onClick={() => toggleSubject(subject)}
                className={`rounded-full px-3 py-2 text-xs font-black ring-1 transition ${
                  selectedSubjects.includes(subject)
                    ? "bg-sage-secondary text-white ring-sage-secondary"
                    : "bg-white text-sage-secondary ring-sage-warm-border"
                }`}
              >
                {subject}
              </button>
            ))}
          </div>
        </div>

        <textarea name="message" rows={3} placeholder="অতিরিক্ত কোনো তথ্য থাকলে লিখুন" className={`${inputClass} h-auto py-3`} />
      </div>

      <button
        disabled={submitting}
        className="mt-6 inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-sage-primary px-6 py-4 text-base font-black text-white shadow-lg shadow-sage-primary/25 transition hover:bg-sage-secondary disabled:opacity-60"
      >
        {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
        {submitting ? "জমা হচ্ছে..." : "রেজিস্ট্রেশন জমা দিন"}
      </button>
    </form>
  );
}
