"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { ArrowRight, BookOpenCheck, CalendarDays, Loader2, Send } from "lucide-react";
import { toast } from "react-toastify";

import { Container } from "@/components/shared/Container";
import { getClassLabel, toBanglaDigits } from "@/constants/class-levels";
import type { PublicAssessment } from "@/lib/assessments";

type QuickUser = {
  name?: string;
  phone?: string;
} | null;

type Props = {
  exams: PublicAssessment[];
  user?: QuickUser;
};

const inputClass =
  "h-11 rounded-xl border border-sage-red-100 bg-white px-3 text-sm font-semibold text-sage-secondary outline-none transition focus:border-sage-primary focus:ring-2 focus:ring-sage-primary/10";

function examSummary(exam: PublicAssessment) {
  if (exam.examType === "Class Test") {
    return "প্রতিটি ক্লাসের পড়া ঠিকমতো আয়ত্ত হচ্ছে কি না বুঝতে ছোট, বিষয়ভিত্তিক ক্লাস টেস্ট নেওয়া হবে।";
  }

  return "সপ্তাহের পড়া নিয়মিত যাচাই, দুর্বলতা শনাক্ত এবং দ্রুত ফলোআপের জন্য সাপ্তাহিক পরীক্ষা নেওয়া হবে।";
}

function subjectsFor(exam: PublicAssessment, classLevel: number) {
  const classInfo = exam.classSpecificInfo?.find((info) => info.classLevel === classLevel);
  return classInfo?.subjects?.length ? classInfo.subjects : exam.subjects;
}

export function ExamLeadSection({ exams, user = null }: Props) {
  const featuredExams = exams.filter((exam) => exam.kind === "exam");
  const classLevels = useMemo(
    () => [...new Set(featuredExams.flatMap((exam) => exam.classLevels))].sort((a, b) => a - b),
    [featuredExams],
  );
  const [activeClass, setActiveClass] = useState(classLevels[0] || 6);
  const visible = featuredExams.filter((exam) => exam.classLevels.includes(activeClass));
  const primary = visible[0] || featuredExams[0];
  const [activeExamId, setActiveExamId] = useState(primary?._id || "");
  const [submitting, setSubmitting] = useState(false);

  if (!primary) return null;

  const selectedExam = visible.find((exam) => exam._id === activeExamId) || visible[0] || primary;
  const subjects = subjectsFor(selectedExam, activeClass);
  const fallbackSubject = subjects[0] || "Full syllabus";
  const isLoggedIn = Boolean(user?.name);
  const needsPhone = !user?.phone;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);

    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const selectedSubject = String(form.get("subject") || fallbackSubject);
    const payload = {
      assessmentKind: selectedExam.kind,
      assessmentId: selectedExam._id,
      name: user?.name || String(form.get("name") || ""),
      phone: user?.phone || String(form.get("phone") || ""),
      classLabel: getClassLabel(activeClass),
      version: selectedExam.version,
      schoolName: String(form.get("schoolName") || ""),
      applicantType: "outside",
      selectedSubjects: [selectedSubject],
      message: `Homepage lead for ${selectedExam.examType || "Exam"}`,
    };

    try {
      const res = await fetch("/api/assessment-registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) throw new Error(json.message || "রেজিস্ট্রেশন জমা দেওয়া যায়নি");
      toast.success("রেজিস্ট্রেশন জমা হয়েছে");
      formElement.reset();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "রেজিস্ট্রেশন জমা দেওয়া যায়নি");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section id="weekly-class-test" className="bg-sage-cream py-10 sm:py-12">
      <Container>
        <div className="rounded-3xl border border-sage-warm-border bg-white p-5 shadow-sm sm:p-6">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,390px)] lg:items-start">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-sage-red-50 px-3 py-1.5 text-xs font-black text-sage-primary ring-1 ring-sage-red-100">
                  Weekly Exam
                </span>
                <span className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-sage-secondary ring-1 ring-sage-warm-border">
                  Class Test
                </span>
              </div>

              <h2 className="mt-4 max-w-2xl text-2xl font-black leading-tight text-sage-secondary sm:text-3xl">
                ক্লাসের পড়া নিয়মিত যাচাই করার জন্য Weekly Exam
              </h2>
              <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-sage-gray-700 sm:text-base">
                {examSummary(selectedExam)} শিক্ষার্থী নাম, স্কুল/কলেজ, বিষয় ও নম্বর দিলেই আমাদের টিম পরীক্ষার সময়সূচি জানাবে।
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {classLevels.map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => {
                      setActiveClass(level);
                      setActiveExamId("");
                    }}
                    className={`rounded-full px-4 py-2 text-xs font-black transition ${
                      activeClass === level
                        ? "bg-sage-primary text-white shadow-md shadow-sage-primary/20"
                        : "bg-sage-red-50 text-sage-primary ring-1 ring-sage-red-100 hover:bg-sage-red-100"
                    }`}
                  >
                    {getClassLabel(level)}
                  </button>
                ))}
              </div>

              <div className="mt-4 grid gap-2 text-sm font-bold text-sage-secondary sm:grid-cols-3">
                <div className="rounded-2xl bg-sage-cream px-4 py-2.5 ring-1 ring-sage-warm-border">
                  <p className="text-xs text-sage-gray-500">পরীক্ষা</p>
                  <p className="mt-1">{selectedExam.examType || "Exam"}</p>
                </div>
                <div className="rounded-2xl bg-sage-cream px-4 py-2.5 ring-1 ring-sage-warm-border">
                  <p className="text-xs text-sage-gray-500">তারিখ</p>
                  <p className="mt-1">{selectedExam.dateLabel}</p>
                </div>
                <div className="rounded-2xl bg-sage-cream px-4 py-2.5 ring-1 ring-sage-warm-border">
                  <p className="text-xs text-sage-gray-500">বিষয়</p>
                  <p className="mt-1">{subjects.length ? `${toBanglaDigits(subjects.length)}টি বিষয়` : "সিলেবাস"}</p>
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={selectedExam.href}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-sage-primary px-5 text-sm font-black text-sage-primary transition hover:bg-sage-primary hover:text-white"
                >
                  পরীক্ষার বিস্তারিত
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/assessments/exams"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sage-red-50 px-5 text-sm font-black text-sage-secondary ring-1 ring-sage-red-100 transition hover:text-sage-primary"
                >
                  সব Exam দেখুন
                </Link>
              </div>
            </div>

            <form onSubmit={submit} className="rounded-2xl border border-sage-red-100 bg-sage-red-50 p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-sage-primary ring-1 ring-sage-red-100">
                  <BookOpenCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-black text-sage-secondary">রেজিস্ট্রেশন আগ্রহ জানান</p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-sage-gray-600">
                    {isLoggedIn ? "আপনার নাম নেওয়া হয়েছে। শুধু প্রয়োজনীয় তথ্য দিন।" : "নাম, নম্বর, স্কুল/কলেজ ও বিষয় দিন।"}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-2">
                {visible.length > 1 ? (
                  <select className={inputClass} value={selectedExam._id} onChange={(event) => setActiveExamId(event.target.value)}>
                    {visible.map((exam) => (
                      <option key={exam._id} value={exam._id}>
                        {exam.title}
                      </option>
                    ))}
                  </select>
                ) : null}

                {!isLoggedIn ? <input name="name" required placeholder="শিক্ষার্থীর নাম" className={inputClass} /> : null}
                {needsPhone ? <input name="phone" required placeholder="মোবাইল নম্বর" className={inputClass} /> : null}
                <input name="schoolName" required placeholder="স্কুল / কলেজ" className={inputClass} />
                <select name="subject" required className={inputClass} defaultValue={fallbackSubject}>
                  {(subjects.length ? subjects : [fallbackSubject]).map((subject) => (
                    <option key={subject} value={subject}>
                      {subject}
                    </option>
                  ))}
                </select>
              </div>

              <button
                disabled={submitting}
                className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-sage-primary px-4 text-sm font-black text-white shadow-md shadow-sage-primary/15 transition hover:bg-sage-secondary disabled:opacity-60"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {submitting ? "জমা হচ্ছে..." : "রেজিস্ট্রেশন করুন"}
              </button>

              <p className="mt-3 flex items-center gap-2 text-xs font-bold text-sage-gray-600">
                <CalendarDays className="h-4 w-4 text-sage-primary" />
                বিস্তারিত পেজে রুটিন, ফি ও বিষয়ভিত্তিক তথ্য থাকবে।
              </p>
            </form>
          </div>
        </div>
      </Container>
    </section>
  );
}
