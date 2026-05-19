import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, CheckCircle2, FileCheck2, GraduationCap, School, Timer, WalletCards } from "lucide-react";

import { AssessmentRegistrationForm } from "@/components/assessments/AssessmentRegistrationForm";
import { AssessmentRoutineTable } from "@/components/assessments/AssessmentRoutineTable";
import { Container } from "@/components/shared/Container";
import { activeAssessmentQuery, assessmentModel, serializeAssessment, type AssessmentKind } from "@/lib/assessments";
import { getClassLabel } from "@/constants/class-levels";
import { connectDB } from "@/lib/mongodb";

type PageProps = {
  params: Promise<{ kind: string; slug: string }>;
};

function parseKind(kind: string): AssessmentKind | null {
  if (kind === "model-tests") return "modelTest";
  if (kind === "exams") return "exam";
  return null;
}

function money(value: number) {
  return `৳${Number(value || 0).toLocaleString("bn-BD")}`;
}

export default async function AssessmentDetailPage({ params }: PageProps) {
  const { kind: rawKind, slug } = await params;
  const kind = parseKind(rawKind);
  if (!kind) notFound();

  await connectDB();
  const model = assessmentModel(kind);
  const doc = await model.findOne({ ...activeAssessmentQuery(false), slug }).lean();
  if (!doc) notFound();

  const assessment = serializeAssessment(doc, kind);
  const badge = assessment.kind === "modelTest" ? "Model Test" : assessment.examType || "Exam";

  return (
    <main className="bg-sage-cream">
      <section className="relative overflow-hidden bg-sage-secondary py-14 text-white sm:py-20">
        <div className="absolute inset-0 bg-[linear-gradient(115deg,#3b0000_0%,#7b0d12_52%,#4b0000_100%)]" />
        <div className="absolute inset-0 opacity-[0.12] [background-image:linear-gradient(rgba(255,255,255,.25)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.25)_1px,transparent_1px)] [background-size:28px_28px]" />
        <Container className="relative">
          <Link href="/assessments" className="inline-flex items-center gap-2 text-sm font-bold text-sage-gold">
            <ArrowLeft className="h-4 w-4" />
            সব প্রোগ্রামে ফিরুন
          </Link>

          <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_480px] lg:items-center">
            <div>
              <p className="inline-flex rounded-full bg-sage-gold px-4 py-2 text-sm font-black text-sage-secondary">{badge}</p>
              <h1 className="mt-5 max-w-4xl text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">{assessment.title}</h1>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-white/82">
                {assessment.scheduleNote || "পরীক্ষার মতো পরিবেশ, উত্তরপত্র যাচাই এবং Solve Class-এর মাধ্যমে প্রস্তুতি কোথায় শক্ত আর কোথায় দুর্বল তা পরিষ্কারভাবে বোঝানো হয়।"}
              </p>

              {assessment.schoolFocus.length ? (
                <div className="mt-7 rounded-[1.5rem] border border-sage-gold/30 bg-sage-gold/10 p-5">
                  <p className="flex items-center gap-2 text-sm font-black text-sage-gold">
                    <School className="h-4 w-4" />
                    স্কুল/কলেজ ফোকাস
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {assessment.schoolFocus.map((school) => (
                      <span key={school} className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-sage-secondary">
                        {school}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="rounded-[2rem] border border-white/15 bg-white p-4 shadow-2xl shadow-black/30">
              <div className="relative aspect-[16/10] overflow-hidden rounded-[1.5rem] bg-sage-cream">
                {assessment.image ? (
                  <Image src={assessment.image} alt={assessment.title} fill unoptimized className="object-cover" />
                ) : (
                  <div className="flex h-full flex-col justify-end bg-[linear-gradient(135deg,#fff8e8_0%,#fff_58%,#feeceb_100%)] p-6 text-sage-secondary">
                    <p className="w-max rounded-full bg-sage-gold px-3 py-1 text-xs font-black">{badge}</p>
                    <h2 className="mt-4 text-3xl font-black leading-tight">{assessment.classLabel}</h2>
                    <p className="mt-2 text-sm font-bold text-sage-gray-600">{assessment.subjectCountLabel} · {assessment.versionLabel}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Container>
      </section>

      <Container className="py-12 sm:py-16">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px]">
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
              <Info icon={<CalendarDays />} label="তারিখ" value={assessment.dateLabel} />
              <Info icon={<Timer />} label="শ্রেণি" value={assessment.classLabel} />
              <Info icon={<FileCheck2 />} label="বিষয়" value={assessment.subjectCountLabel} />
              <Info icon={<GraduationCap />} label="ভার্সন" value={assessment.versionLabel} />
            </div>

            <section className="rounded-3xl border border-sage-warm-border bg-white p-6 shadow-sm sm:p-8">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-sage-primary">Subjects</p>
              <h2 className="mt-2 text-2xl font-black text-sage-secondary">যে বিষয়গুলো কাভার হবে</h2>
              <div className="mt-5 flex flex-wrap gap-2">
                {assessment.subjects.map((subject) => (
                  <span key={subject} className="rounded-full bg-sage-red-50 px-4 py-2 text-sm font-black text-sage-primary ring-1 ring-sage-red-100">{subject}</span>
                ))}
              </div>
            </section>

            <AssessmentRoutineTable assessment={assessment} />

            <section className="rounded-3xl border border-sage-warm-border bg-white p-6 shadow-sm sm:p-8">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-sage-primary">Fees</p>
              <h2 className="mt-2 text-2xl font-black text-sage-secondary">ফি কাঠামো</h2>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {assessment.fees.length ? assessment.fees.map((fee) => (
                  <div key={fee.label} className="rounded-2xl border border-sage-warm-border bg-sage-cream p-4">
                    <div className="flex items-center gap-2 text-sage-primary">
                      <WalletCards className="h-5 w-5" />
                    <p className="font-black text-sage-secondary">{fee.classLevel ? getClassLabel(fee.classLevel) : fee.label}</p>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <p className="rounded-xl bg-white p-3 text-sm font-bold text-sage-gray-700">SAGE শিক্ষার্থী<br /><span className="text-lg font-black text-sage-primary">{money(fee.sageStudentFee)}</span></p>
                      <p className="rounded-xl bg-white p-3 text-sm font-bold text-sage-gray-700">বাইরের শিক্ষার্থী<br /><span className="text-lg font-black text-sage-primary">{money(fee.outsideStudentFee)}</span></p>
                    </div>
                  </div>
                )) : <p className="text-sm font-semibold text-sage-gray-600">ফি জানতে রেজিস্ট্রেশন করুন।</p>}
              </div>
            </section>

            <section className="rounded-3xl border border-sage-warm-border bg-white p-6 shadow-sm sm:p-8">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-sage-primary">Preparation System</p>
              <h2 className="mt-2 text-2xl font-black text-sage-secondary">এটা কেন আলাদা</h2>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {assessment.features.map((feature) => (
                  <div key={feature} className="flex gap-3 rounded-2xl bg-sage-cream p-4">
                    <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-sage-primary" />
                    <p className="font-bold leading-7 text-sage-secondary">{feature}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <AssessmentRegistrationForm assessment={assessment} />
          </aside>
        </div>
      </Container>
    </main>
  );
}

function Info({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-sage-warm-border bg-white p-5 shadow-sm">
      <div className="text-sage-primary [&_svg]:h-6 [&_svg]:w-6">{icon}</div>
      <p className="mt-4 text-xs font-bold uppercase tracking-wider text-sage-gray-500">{label}</p>
      <p className="mt-1 text-base font-black text-sage-secondary">{value}</p>
    </div>
  );
}
