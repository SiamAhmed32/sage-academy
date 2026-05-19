"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, CalendarDays, CheckCircle2, FileText, School, Sparkles, WalletCards } from "lucide-react";

import { Container } from "@/components/shared/Container";
import { getClassLabel } from "@/constants/class-levels";
import type { PublicAssessment } from "@/lib/assessments";

type Props = {
  assessments: PublicAssessment[];
};

function kindLabel(item: PublicAssessment) {
  return item.kind === "modelTest" ? "Model Test" : item.examType || "Exam";
}

function SubjectRail({ subjects }: { subjects: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {subjects.slice(0, 6).map((subject) => (
        <span key={subject} className="rounded-full bg-sage-red-50 px-3 py-1.5 text-xs font-black text-sage-primary">
          {subject}
        </span>
      ))}
    </div>
  );
}

function ProgramBrief({ item, activeClass }: { item: PublicAssessment; activeClass: number }) {
  const schools = item.schoolFocus.slice(0, 4);

  return (
    <div className="relative mx-auto w-full max-w-[680px]">
      <div className="absolute -right-4 -top-4 h-24 w-24 rounded-[1.75rem] bg-sage-gold" />
      <article className="relative overflow-hidden rounded-[1.75rem] border border-white/15 bg-white p-4 text-sage-secondary shadow-2xl shadow-black/25 sm:p-5">
        {item.image ? (
          <div className="relative mb-5 aspect-[16/7] overflow-hidden rounded-[1.35rem] bg-sage-secondary">
            <Image src={item.image} alt={item.title} fill unoptimized className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-sage-secondary/45 to-transparent" />
          </div>
        ) : null}

        <div className="rounded-[1.35rem] bg-sage-cream p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-sage-gold px-3 py-1 text-xs font-black text-sage-secondary">{kindLabel(item)}</span>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-sage-primary ring-1 ring-sage-warm-border">
                  {getClassLabel(activeClass)}
                </span>
              </div>
              <h3 className="mt-4 text-3xl font-black leading-tight text-sage-secondary sm:text-4xl">{item.title}</h3>
              <p className="mt-2 text-sm font-bold leading-6 text-sage-gray-600">{item.classLabel} · {item.versionLabel}</p>
            </div>
            <div className="shrink-0 rounded-2xl bg-sage-secondary px-4 py-3 text-white">
              <p className="text-xs font-bold text-white/70">Exam window</p>
              <p className="mt-1 text-sm font-black">{item.dateLabel}</p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <InfoTile icon={<FileText />} label="বিষয়" value={item.subjectCountLabel} />
            <InfoTile icon={<WalletCards />} label="ফি" value={item.feePreview} />
            <InfoTile icon={<CalendarDays />} label="রুটিন" value="ডিটেইলে দেখুন" />
          </div>

          <div className="mt-5 rounded-2xl bg-white p-4 shadow-sm">
            <p className="mb-3 text-sm font-black text-sage-secondary">নির্বাচিত বিষয়</p>
            <SubjectRail subjects={item.subjects} />
          </div>

          {schools.length ? (
            <div className="mt-4 rounded-2xl border border-sage-warm-border bg-white p-4">
              <p className="mb-3 flex items-center gap-2 text-sm font-black text-sage-secondary">
                <School className="h-4 w-4 text-sage-primary" />
                স্কুল/কলেজ ফোকাস
              </p>
              <div className="flex flex-wrap gap-2">
                {schools.map((school) => (
                  <span key={school} className="rounded-full bg-sage-cream px-3 py-1.5 text-xs font-black text-sage-primary">
                    {school}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
            <Link href={item.href} className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-sage-primary px-5 py-4 text-sm font-black text-white transition hover:bg-sage-secondary">
              রুটিন, ফি ও রেজিস্ট্রেশন
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/assessments" className="inline-flex min-h-14 items-center justify-center rounded-2xl border border-sage-warm-border bg-white px-5 py-4 text-sm font-black text-sage-secondary transition hover:border-sage-primary hover:text-sage-primary">
              সব প্রোগ্রাম
            </Link>
          </div>
        </div>
      </article>
    </div>
  );
}

function InfoTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-2xl bg-white p-4 shadow-sm">
      <div className="text-sage-primary [&_svg]:h-5 [&_svg]:w-5">{icon}</div>
      <p className="mt-3 text-xs font-bold text-sage-gray-500">{label}</p>
      <p className="mt-1 break-words text-sm font-black leading-5 text-sage-secondary">{value}</p>
    </div>
  );
}

function ProgramCard({ item, activeClass }: { item: PublicAssessment; activeClass: number }) {
  return (
    <article className="rounded-[1.5rem] border border-white/15 bg-white p-5 text-sage-secondary shadow-xl shadow-sage-secondary/15 transition hover:-translate-y-1">
      <div className="flex flex-wrap gap-2">
        <span className="rounded-full bg-sage-secondary px-3 py-1 text-xs font-black text-white">{kindLabel(item)}</span>
        <span className="rounded-full bg-sage-red-50 px-3 py-1 text-xs font-black text-sage-primary">{getClassLabel(activeClass)}</span>
      </div>
      <h3 className="mt-4 line-clamp-2 text-2xl font-black leading-tight">{item.title}</h3>
      <div className="mt-4 grid gap-2 text-sm font-bold text-sage-gray-700 sm:grid-cols-2">
        <span className="rounded-2xl bg-sage-cream px-3 py-2">{item.dateLabel}</span>
        <span className="rounded-2xl bg-sage-cream px-3 py-2">{item.subjectCountLabel}</span>
      </div>
      <div className="mt-4">
        <SubjectRail subjects={item.subjects} />
      </div>
      <Link href={item.href} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-sage-gold px-4 py-3 text-sm font-black text-sage-secondary transition hover:bg-sage-primary hover:text-white">
        বিস্তারিত দেখুন
        <ArrowRight className="h-4 w-4" />
      </Link>
    </article>
  );
}

export function AssessmentGateway({ assessments }: Props) {
  const classLevels = useMemo(
    () => [...new Set(assessments.flatMap((item) => item.classLevels))].sort((a, b) => a - b),
    [assessments]
  );
  const [activeClass, setActiveClass] = useState(classLevels[0] || 6);

  const relevant = assessments.filter((item) => item.classLevels.includes(activeClass));
  const visible = relevant.length ? relevant : assessments;
  const primary = visible[0];
  const schools = [...new Set(visible.flatMap((item) => item.schoolFocus))].slice(0, 5);

  if (!primary) return null;

  return (
    <section id="model-test-exam" className="relative scroll-mt-24 overflow-hidden bg-sage-secondary py-14 text-white sm:py-20">
      <div className="absolute inset-0 bg-[linear-gradient(115deg,#4b0000_0%,#7b0d12_48%,#2b0000_100%)]" />
      <div className="absolute inset-0 opacity-[0.12] [background-image:linear-gradient(rgba(255,255,255,.2)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.2)_1px,transparent_1px)] [background-size:32px_32px]" />

      <Container className="relative">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(420px,0.85fr)] lg:items-center">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full bg-sage-gold px-4 py-2 text-sm font-black text-sage-secondary shadow-lg shadow-black/20">
              <Sparkles className="h-4 w-4" />
              মডেল টেস্ট ও এক্সাম প্রোগ্রাম
            </p>
            <h2 className="mt-6 text-4xl font-black leading-[1.08] sm:text-5xl lg:text-[56px]">
              আপনার শ্রেণির জন্য
              <span className="block text-sage-gold">সঠিক পরীক্ষার প্রস্তুতি</span>
            </h2>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/82">
              শ্রেণি, বিষয়, স্কুল-ফোকাস ও পরীক্ষার সময় অনুযায়ী সাজানো প্রোগ্রাম। শিক্ষার্থী যেন শুধু পরীক্ষা না দেয়, পরীক্ষার পর কোথায় উন্নতি দরকার সেটাও পরিষ্কার বুঝতে পারে।
            </p>

            <div className="mt-7 rounded-[1.35rem] border border-white/15 bg-white/10 p-4 backdrop-blur">
              <p className="text-sm font-black text-sage-gold">শ্রেণি নির্বাচন করুন</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {classLevels.map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setActiveClass(level)}
                    className={`rounded-2xl px-4 py-3 text-sm font-black transition ${
                      activeClass === level
                        ? "bg-white text-sage-secondary shadow-lg"
                        : "bg-white/10 text-white ring-1 ring-white/15 hover:bg-white/20"
                    }`}
                  >
                    {getClassLabel(level)}
                  </button>
                ))}
              </div>
            </div>

            {schools.length ? (
              <div className="mt-5 rounded-[1.35rem] border border-sage-gold/30 bg-sage-gold/10 p-5">
                <p className="flex items-center gap-2 text-sm font-black text-sage-gold">
                  <School className="h-4 w-4" />
                  স্কুল/কলেজ ফোকাস
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {schools.map((school) => (
                    <span key={school} className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-sage-secondary">
                      {school}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <ProgramBrief item={primary} activeClass={activeClass} />
        </div>

        {visible.length > 1 ? (
          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {visible.slice(0, 3).map((item) => (
              <ProgramCard key={`${item.kind}-${item._id}`} item={item} activeClass={activeClass} />
            ))}
          </div>
        ) : null}
      </Container>
    </section>
  );
}
