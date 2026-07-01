"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, CalendarDays, CheckCircle2, FileCheck2, GraduationCap, School, Timer, WalletCards, Sparkles } from "lucide-react";

import { AssessmentRegistrationForm } from "@/components/assessments/AssessmentRegistrationForm";
import { AssessmentRoutineTable } from "@/components/assessments/AssessmentRoutineTable";
import { Container } from "@/components/shared/Container";
import { getClassLabel, toBanglaDigits } from "@/constants/class-levels";
import type { PublicAssessment } from "@/lib/assessments";
import { AssessmentCountdown } from "@/components/assessments/AssessmentCountdown";

function money(value: number) {
  return `৳${Number(value || 0).toLocaleString("bn-BD")}`;
}

function examIntentText(assessment: PublicAssessment) {
  if (assessment.kind !== "exam") return null;
  if (assessment.examType === "Class Test") {
    return "এই পেজের রেজিস্ট্রেশনটি ক্লাসভিত্তিক Class Test-এর জন্য। বিষয় নির্বাচন করলে টিম পরীক্ষার সময় ও প্রস্তুতির নির্দেশনা জানাবে।";
  }
  if (assessment.examType === "Weekly Test") {
    return "এই পেজের রেজিস্ট্রেশনটি Weekly Test-এর জন্য। সপ্তাহের পড়া যাচাই, ফলাফল এবং ফলোআপের জন্য শিক্ষার্থীর তথ্য নেওয়া হচ্ছে।";
  }
  return `এই পেজের রেজিস্ট্রেশনটি ${assessment.examType || "Exam"}-এর জন্য।`;
}

export function AssessmentDetailClient({ assessment, badge }: { assessment: PublicAssessment; badge: string }) {
  const [activeClass, setActiveClass] = useState(assessment.classLevels[0] || 6);
  const classInfo = assessment.classSpecificInfo?.find(c => c.classLevel === activeClass) || { classLevel: activeClass, subjects: [] as string[], routine: [] as Array<{ day: string; time: string; subject: string }> };
  const subjects = classInfo.subjects;
  const activeRoutine = classInfo.routine;
  const examIntent = examIntentText(assessment);

  return (
    <main className="bg-sage-cream">
      {/* Hero Section with Rich Gradient */}
      <section className="relative overflow-hidden bg-sage-secondary py-14 text-white sm:py-20">
        <div className="absolute inset-0 bg-[linear-gradient(115deg,#3b0000_0%,#7b0d12_42%,#4b0000_100%)]" />
        <div className="absolute inset-0 opacity-[0.10] [background-image:linear-gradient(rgba(255,255,255,.25)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.25)_1px,transparent_1px)] [background-size:28px_28px]" />
        {/* Decorative radial glow */}
        <div className="absolute right-0 top-0 h-[500px] w-[500px] rounded-full bg-sage-gold/8 blur-[120px]" />
        <div className="absolute -left-20 bottom-0 h-[400px] w-[400px] rounded-full bg-sage-primary/15 blur-[100px]" />

        <Container className="relative">
          <div className="mb-6 rounded-2xl border border-sage-gold/30 bg-sage-gold/10 px-4 py-3 text-sm leading-6 text-white/90">
            এটি পুরনো Assessment সিস্টেমের পেজ। নতুন সাপ্তাহিক/মাসিক ও অনলাইন পরীক্ষার জন্য{" "}
            <Link href="/exams" className="font-bold text-sage-gold underline-offset-2 hover:underline">
              Exam Hub
            </Link>{" "}
            ব্যবহার করুন।
          </div>

          <Link href="/assessments" className="inline-flex items-center gap-2 text-sm font-bold text-sage-gold transition hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            সব প্রোগ্রামে ফিরুন
          </Link>

          <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_480px] lg:items-center">
            <div>
              <p className="inline-flex rounded-full bg-sage-gold px-4 py-2 text-sm font-black text-sage-secondary shadow-lg shadow-sage-gold/20">{badge}</p>
              <h1 className="mt-5 max-w-4xl text-4xl font-black leading-tight sm:text-5xl lg:text-6xl drop-shadow-sm">{assessment.title}</h1>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-white/82">
                {assessment.scheduleNote || "পরীক্ষার মতো পরিবেশ, উত্তরপত্র যাচাই এবং Solve Class-এর মাধ্যমে প্রস্তুতি কোথায় শক্ত আর কোথায় দুর্বল তা পরিষ্কারভাবে বোঝানো হয়।"}
              </p>

              {assessment.schoolFocus.length ? (
                <div className="mt-7 rounded-[1.5rem] border border-sage-gold/30 bg-sage-gold/10 p-5 backdrop-blur-sm">
                  <p className="flex items-center gap-2 text-sm font-black text-sage-gold">
                    <School className="h-4 w-4" />
                    স্কুল/কলেজ ফোকাস
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {assessment.schoolFocus.map((school) => (
                      <span key={school} className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-sage-secondary shadow-sm">
                        {school}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              {examIntent ? (
                <div className="mt-5 rounded-[1.5rem] border border-white/15 bg-white/10 p-5 backdrop-blur-sm">
                  <p className="text-sm font-black text-sage-gold">{assessment.examType || "Exam"}</p>
                  <p className="mt-2 text-sm font-semibold leading-7 text-white/82">{examIntent}</p>
                </div>
              ) : null}
            </div>

            <div className="rounded-[2rem] border border-white/15 bg-white p-4 shadow-2xl shadow-black/30">
              <div className="relative aspect-[16/10] overflow-hidden rounded-[1.5rem] bg-sage-cream">
                {assessment.image ? (
                  <Image src={assessment.image} alt={assessment.title} fill unoptimized className="object-cover" />
                ) : (
                  <div className="flex h-full flex-col justify-center items-center text-center p-6 bg-sage-secondary relative">
                    <div className="absolute inset-0 opacity-[0.15] [background-image:linear-gradient(rgba(255,255,255,.2)_1.5px,transparent_1.5px),linear-gradient(90deg,rgba(255,255,255,.2)_1.5px,transparent_1.5px)] [background-size:16px_16px]" />
                    <div className="absolute top-0 right-0 w-32 h-32 bg-sage-gold/20 rounded-full blur-3xl" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-sage-primary/40 rounded-full blur-3xl" />
                    
                    <div className="relative z-10 w-full flex flex-col items-center gap-4">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[10px] font-black text-sage-gold uppercase tracking-wider">
                        <Sparkles className="w-3 h-3" /> Registration Open
                      </div>
                      <h2 className="text-3xl font-black text-white leading-none tracking-tight">{assessment.title}</h2>
                      <p className="text-sm font-bold text-white/70">{assessment.classLabel}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Content Section */}
      <Container className="py-12 sm:py-16">
        <div className="mb-10 text-center">
          <p className="text-sm font-black uppercase tracking-wider text-sage-primary mb-4">শ্রেণি অনুযায়ী বিস্তারিত দেখুন</p>
          <div className="inline-flex flex-wrap justify-center gap-2 rounded-full bg-white p-2 shadow-md ring-1 ring-sage-warm-border/40">
            {assessment.classLevels.map((level) => (
              <button
                key={level}
                onClick={() => setActiveClass(level)}
                className={`rounded-full px-6 py-2.5 text-sm font-black transition-all ${
                  activeClass === level 
                    ? "bg-sage-primary text-white shadow-lg" 
                    : "text-sage-gray-600 hover:bg-sage-cream"
                }`}
              >
                {getClassLabel(level)}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-12 flex justify-center">
          <AssessmentCountdown targetDate={assessment.startDate} theme="light" />
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px]">
          <div className="space-y-6">
            {/* Info Tiles */}
            <div className="grid gap-4 md:grid-cols-4">
              <Info icon={<CalendarDays />} label="তারিখ" value={assessment.dateLabel} />
              <Info icon={<Timer />} label="শ্রেণি" value={getClassLabel(activeClass)} />
              <Info icon={<FileCheck2 />} label="বিষয়" value={subjects.length ? `${toBanglaDigits(subjects.length)}টি বিষয়` : 'নির্ধারিত নয়'} />
              <Info icon={<GraduationCap />} label="ভার্সন" value={assessment.versionLabel} />
            </div>

            {/* Subjects */}
            <section className="rounded-3xl border border-sage-warm-border bg-white p-6 shadow-sm sm:p-8">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-sage-primary">Subjects</p>
              <h2 className="mt-2 text-2xl font-black text-sage-secondary">{getClassLabel(activeClass)} - যে বিষয়গুলো কাভার হবে</h2>
              <div className="mt-5 flex flex-wrap gap-2">
                {subjects.length > 0 ? subjects.map((subject) => (
                  <span key={subject} className="rounded-full bg-sage-red-50 px-4 py-2 text-sm font-black text-sage-primary ring-1 ring-sage-red-100 transition hover:bg-sage-primary hover:text-white">{subject}</span>
                )) : (
                  <p className="text-sage-gray-500 font-semibold text-sm">কোনো বিষয় নির্ধারিত নেই</p>
                )}
              </div>
            </section>

            {/* Routine */}
            <AssessmentRoutineTable
              assessment={assessment}
              routine={activeRoutine}
              classLabel={getClassLabel(activeClass)}
              classLevel={activeClass}
            />

            {/* Fees */}
            <section className="rounded-3xl border border-sage-warm-border bg-white p-6 shadow-sm sm:p-8">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-sage-primary">Fees</p>
              <h2 className="mt-2 text-2xl font-black text-sage-secondary">{getClassLabel(activeClass)} - ফি কাঠামো</h2>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {assessment.fees.filter(f => !f.classLevel || f.classLevel === activeClass).length > 0 ? (
                  assessment.fees.filter(f => !f.classLevel || f.classLevel === activeClass).map((fee) => (
                    <div key={fee.label} className="rounded-2xl border border-sage-warm-border bg-sage-cream p-4 transition hover:shadow-md hover:-translate-y-0.5">
                      <div className="flex items-center gap-2 text-sage-primary">
                        <WalletCards className="h-5 w-5" />
                        <p className="font-black text-sage-secondary">{fee.classLevel ? getClassLabel(fee.classLevel) : fee.label}</p>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <p className="rounded-xl bg-white p-3 text-sm font-bold text-sage-gray-700">SAGE শিক্ষার্থী<br /><span className="text-lg font-black text-sage-primary">{money(fee.sageStudentFee)}</span></p>
                        <p className="rounded-xl bg-white p-3 text-sm font-bold text-sage-gray-700">বাইরের শিক্ষার্থী<br /><span className="text-lg font-black text-sage-primary">{money(fee.outsideStudentFee)}</span></p>
                      </div>
                    </div>
                  ))
                ) : <p className="text-sm font-semibold text-sage-gray-600">ফি জানতে রেজিস্ট্রেশন করুন।</p>}
              </div>
            </section>

            {/* Features */}
            <section className="rounded-3xl border border-sage-warm-border bg-white p-6 shadow-sm sm:p-8">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-sage-primary">Preparation System</p>
              <h2 className="mt-2 text-2xl font-black text-sage-secondary">এটা কেন আলাদা</h2>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {assessment.features.map((feature) => (
                  <div key={feature} className="flex gap-3 rounded-2xl bg-sage-cream p-4 transition hover:shadow-md hover:-translate-y-0.5">
                    <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-sage-primary" />
                    <p className="font-bold leading-7 text-sage-secondary">{feature}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Sticky Registration Form */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <AssessmentRegistrationForm 
              assessment={assessment} 
              activeClass={activeClass}
              onClassChange={setActiveClass}
            />
          </aside>
        </div>
      </Container>
    </main>
  );
}

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-sage-warm-border bg-white p-5 shadow-sm transition hover:shadow-md hover:-translate-y-0.5">
      <div className="text-sage-primary [&_svg]:h-6 [&_svg]:w-6">{icon}</div>
      <p className="mt-4 text-xs font-bold uppercase tracking-wider text-sage-gray-500">{label}</p>
      <p className="mt-1 text-base font-black text-sage-secondary">{value}</p>
    </div>
  );
}
