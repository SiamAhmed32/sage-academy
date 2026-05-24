"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { 
  ArrowRight, 
  CalendarDays, 
  CheckCircle2, 
  FileText, 
  School, 
  Sparkles, 
  Award,
  BookOpen
} from "lucide-react";

import { Container } from "@/components/shared/Container";
import { getClassLabel, toBanglaDigits } from "@/constants/class-levels";
import type { PublicAssessment } from "@/lib/assessments";
import { AssessmentCountdown } from "./AssessmentCountdown";

type Props = {
  assessments: PublicAssessment[];
};

function kindLabel(item: PublicAssessment) {
  return item.kind === "modelTest" ? "Model Test" : item.examType || "Exam";
}

function formatSchoolName(school: string) {
  const s = school.trim().toLowerCase();
  if (s.includes("banani") || s.includes("banasree") || s.includes("বনশ্রী")) return "বনশ্রী আইডিয়াল স্কুল";
  if (s.includes("national") || s.includes("ন্যাশনাল")) return "ন্যাশনাল আইডিয়াল স্কুল";
  if (s.includes("faizur") || s.includes("ফয়জুর")) return "ফয়জুর রহমান আইডিয়াল স্কুল";
  return school;
}

function SubjectRail({ subjects }: { subjects: string[] }) {
  if (!subjects || subjects.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {subjects.slice(0, 6).map((subject) => (
        <span key={subject} className="rounded-xl bg-sage-primary/5 px-2.5 py-1 text-xs font-bold text-sage-primary transition hover:bg-sage-primary/10">
          {subject}
        </span>
      ))}
    </div>
  );
}

function DigitalPoster({ item, activeClass }: { item: PublicAssessment; activeClass: number }) {
  const classInfo = item.classSpecificInfo?.find(c => c.classLevel === activeClass);
  const subjects = classInfo?.subjects || [];
  
  return (
    <div className="relative mb-4.5 aspect-[16/7] overflow-hidden rounded-[24px] bg-sage-secondary shadow-inner flex flex-col justify-center items-center text-center p-6 border border-white/10 group-hover:border-sage-gold/30 transition-colors">
      {/* Background Poster Texture */}
      <div className="absolute inset-0 opacity-[0.15] [background-image:linear-gradient(rgba(255,255,255,.2)_1.5px,transparent_1.5px),linear-gradient(90deg,rgba(255,255,255,.2)_1.5px,transparent_1.5px)] [background-size:16px_16px]" />
      <div className="absolute top-0 right-0 w-32 h-32 bg-sage-gold/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-sage-primary/40 rounded-full blur-3xl" />
      
      {/* Content */}
      <div className="relative z-10 w-full flex flex-col items-center gap-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-black text-sage-gold uppercase tracking-wider">
          <Sparkles className="w-3 h-3" /> Registration Open
        </div>
        <h3 className="text-2xl sm:text-3xl font-black text-white leading-none tracking-tight">
          {item.title}
        </h3>
        <p className="text-sm font-bold text-white/70">
          {getClassLabel(activeClass)} · {subjects.length ? `${toBanglaDigits(subjects.length)}টি বিষয়` : 'সিলেবাস'}
        </p>
      </div>
    </div>
  );
}

function ProgramBrief({ item, activeClass }: { item: PublicAssessment; activeClass: number }) {
  const currentFee = item.fees.find((f) => Number(f.classLevel) === activeClass);
  const classInfo = item.classSpecificInfo?.find(c => c.classLevel === activeClass);
  const subjects = classInfo?.subjects || [];

  return (
    <div className="relative mx-auto w-full max-w-[560px]">
      {/* Premium Dribbble floating backdrop blobs */}
      <div className="absolute -right-6 -top-6 h-36 w-36 rounded-full bg-sage-gold/20 blur-2xl" />
      <div className="absolute -left-6 -bottom-6 h-36 w-36 rounded-full bg-sage-primary/15 blur-2xl" />

      <article className="relative overflow-hidden rounded-[2.5rem] border border-white/20 bg-white/95 p-5 text-sage-secondary shadow-2xl backdrop-blur-md transition-all duration-300 hover:shadow-black/10">
        
        {item.image ? (
          <div className="relative mb-4.5 aspect-[16/6] overflow-hidden rounded-3xl bg-sage-secondary shadow-inner">
            <Image src={item.image} alt={item.title} fill unoptimized className="object-cover transition-transform duration-500 hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-sage-secondary/60 via-sage-secondary/10 to-transparent" />
          </div>
        ) : (
          <DigitalPoster item={item} activeClass={activeClass} />
        )}

        <div className="rounded-3xl bg-sage-cream/60 p-4.5 ring-1 ring-sage-warm-border/50">
          {/* Tag Badges */}
          <div className="flex flex-wrap gap-1.5 items-center justify-between">
            <div className="flex gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-full bg-sage-gold/15 px-2.5 py-1 text-[10px] font-black text-sage-secondary ring-1 ring-sage-gold/30">
                <Sparkles className="h-2.5 w-2.5 text-sage-secondary" />
                {kindLabel(item)}
              </span>
              <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black text-sage-primary ring-1 ring-sage-warm-border">
                {getClassLabel(activeClass)}
              </span>
            </div>
            
            <span className="rounded-full bg-sage-primary/10 px-2.5 py-1 text-[10px] font-black text-sage-primary ring-1 ring-sage-primary/20">
              🗣️ {item.versionLabel}
            </span>
          </div>

          {/* Program Title */}
          <h3 className="mt-3.5 text-2xl font-black leading-tight text-sage-secondary tracking-tight">
            {item.title}
          </h3>

          {/* Subtitle & Dynamic Ticking Countdown Row */}
          <div className="mt-4 flex flex-col gap-3 items-start border-b border-sage-warm-border/55 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[11px] font-black text-sage-gray-500">
              {item.classLabel} · {item.examType || "মডেল টেস্ট"}
            </p>
            <AssessmentCountdown targetDate={item.startDate} />
          </div>

          {/* Core Info Tiles */}
          <div className="mt-3.5 grid gap-2.5 grid-cols-2">
            <InfoTile icon={<FileText />} label="বিষয়" value={subjects.length ? `${toBanglaDigits(subjects.length)}টি বিষয়` : 'নির্ধারিত নয়'} />
            <InfoTile icon={<CalendarDays />} label="পরীক্ষার সময়" value={item.dateLabel} />
          </div>

          {/* Selected subjects */}
          {subjects.length > 0 && (
            <div className="mt-3.5 rounded-2xl bg-white p-3.5 shadow-sm ring-1 ring-sage-warm-border/30">
              <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-sage-gray-500">সিলেবাসের বিষয়সমূহ</p>
              <SubjectRail subjects={subjects} />
            </div>
          )}

          {/* SAGE vs Outside Pricing structures */}
          {currentFee ? (
            <div className="mt-3.5 grid grid-cols-2 gap-2.5 rounded-2xl bg-sage-gold/5 p-3.5 ring-1 ring-sage-gold/25">
              <div className="text-center border-r border-sage-gold/25 pr-2">
                <p className="text-[9px] font-black uppercase tracking-wider text-sage-gray-500">SAGE শিক্ষার্থীদের ফি</p>
                <p className="mt-0.5 text-lg font-black text-sage-primary">৳{toBanglaDigits(currentFee.sageStudentFee)}/-</p>
              </div>
              <div className="text-center">
                <p className="text-[9px] font-black uppercase tracking-wider text-sage-gray-500">বাইরের শিক্ষার্থীদের ফি</p>
                <p className="mt-0.5 text-lg font-black text-[#b91c1c]">৳{toBanglaDigits(currentFee.outsideStudentFee)}/-</p>
              </div>
            </div>
          ) : (
            <div className="mt-3.5 rounded-2xl bg-white p-3.5 text-center ring-1 ring-sage-warm-border/30">
              <p className="text-[10px] font-black uppercase tracking-wider text-sage-gray-500">ভর্তি ফি</p>
              <p className="text-sm font-black text-sage-secondary mt-0.5">{item.feePreview}</p>
            </div>
          )}

          {/* Primary & secondary CTAs */}
          <div className="mt-4.5 grid gap-2.5 sm:grid-cols-[1fr_auto]">
            <Link href={item.href} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-sage-primary px-5 py-3 text-sm font-black text-white shadow-lg shadow-sage-primary/20 transition-all duration-300 transform hover:-translate-y-0.5 hover:bg-sage-secondary hover:shadow-xl">
              রুটিন, ফি ও রেজিস্ট্রেশন
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/assessments" className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-sage-warm-border bg-white px-4 py-3 text-xs font-black text-sage-secondary transition-all duration-300 hover:border-sage-primary hover:text-sage-primary">
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
    <div className="min-w-0 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-sage-warm-border/20 text-center flex flex-col justify-center h-full">
      <div className="mx-auto flex h-7 w-7 items-center justify-center rounded-full bg-sage-primary/5 text-sage-primary [&_svg]:h-3.5 [&_svg]:w-3.5">
        {icon}
      </div>
      <p className="mt-1.5 text-[9px] font-black uppercase tracking-wider text-sage-gray-500">{label}</p>
      <p className="mt-0.5 truncate text-[11px] font-black leading-tight text-sage-secondary">{value}</p>
    </div>
  );
}

function ProgramCard({ item, activeClass }: { item: PublicAssessment; activeClass: number }) {
  const classInfo = item.classSpecificInfo?.find(c => c.classLevel === activeClass);
  const subjects = classInfo?.subjects || [];
  
  return (
    <article className="group relative rounded-[2rem] border border-white/20 bg-white p-5 text-sage-secondary shadow-xl shadow-sage-secondary/5 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl flex flex-col">
      <div className="flex flex-wrap gap-1.5 mb-2">
        <span className="rounded-full bg-sage-secondary px-3 py-1 text-[10px] font-black text-white">{kindLabel(item)}</span>
        <span className="rounded-full bg-sage-red-50 px-3 py-1 text-[10px] font-black text-sage-primary">{getClassLabel(activeClass)}</span>
      </div>
      
      {!item.image && (
        <div className="relative mt-2 mb-3 aspect-[16/7] overflow-hidden rounded-2xl bg-sage-secondary flex flex-col justify-center items-center text-center p-4 border border-sage-warm-border/40 group-hover:border-sage-gold/30 transition-colors">
          <div className="absolute inset-0 opacity-[0.12] [background-image:linear-gradient(rgba(255,255,255,.2)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.2)_1px,transparent_1px)] [background-size:12px_12px]" />
          <div className="relative z-10 w-full flex flex-col items-center gap-2">
            <h3 className="text-lg font-black text-white leading-tight tracking-tight line-clamp-1">{item.title}</h3>
            <p className="text-[10px] font-bold text-white/70">{getClassLabel(activeClass)}</p>
          </div>
        </div>
      )}
      
      <h3 className="mt-2 line-clamp-2 text-xl font-black leading-tight group-hover:text-sage-primary transition-colors">{item.title}</h3>
      <div className="mt-4 grid gap-2 text-[11px] font-black text-sage-gray-700 sm:grid-cols-2">
        <span className="rounded-xl bg-sage-cream px-3 py-2 flex items-center gap-1.5">
          <CalendarDays className="h-3.5 w-3.5 text-sage-primary" />
          {item.dateLabel}
        </span>
        <span className="rounded-xl bg-sage-cream px-3 py-2 flex items-center gap-1.5">
          <BookOpen className="h-3.5 w-3.5 text-sage-primary" />
          {subjects.length ? `${toBanglaDigits(subjects.length)}টি বিষয়` : 'নির্ধারিত নয়'}
        </span>
      </div>
      <div className="mt-4 flex-grow">
        <SubjectRail subjects={subjects} />
      </div>
      <Link href={item.href} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-sage-gold px-4 py-3 text-sm font-black text-sage-secondary shadow-sm transition-all duration-300 hover:bg-sage-primary hover:text-white">
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
  const rawSchools = [...new Set(visible.flatMap((item) => item.schoolFocus))];
  
  const schools = rawSchools.map(formatSchoolName).slice(0, 4);

  if (!primary) return null;

  return (
    <section id="model-test-exam" className="relative scroll-mt-24 overflow-hidden bg-sage-secondary py-16 text-white sm:py-24">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-[linear-gradient(115deg,#3b0000_0%,#69070b_45%,#220000_100%)]" />
      <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,.15)_1.5px,transparent_1.5px),linear-gradient(90deg,rgba(255,255,255,.15)_1.5px,transparent_1.5px)] [background-size:24px_24px]" />
      
      {/* Gilded light decorations */}
      <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-sage-gold/10 blur-[100px]" />
      <div className="absolute left-0 bottom-0 h-96 w-96 rounded-full bg-sage-primary/20 blur-[120px]" />

      <Container className="relative">
        <div className="grid gap-12 lg:grid-cols-[1fr_minmax(420px,0.85fr)] lg:items-center">
          <div className="max-w-3xl">
            {/* Header section with Badge and Time */}
            <div className="flex flex-wrap items-center gap-5">
              {/* Model Test gilded badge */}
              <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sage-gold via-sage-gold to-[#f59e0b] px-5 py-2.5 text-sm font-black text-sage-secondary shadow-lg shadow-black/25 uppercase tracking-wider animate-pulse">
                <Sparkles className="h-5 w-5" />
                অর্ধবার্ষিক ও প্রি-টেস্ট মডেল টেস্ট
              </div>

              {/* Big Countdown Display */}
              <AssessmentCountdown targetDate={primary.startDate} theme="dark" />
            </div>

            {/* Premium Headline */}
            <h2 className="mt-6 text-4xl font-black leading-[1.08] sm:text-5xl lg:text-[56px] tracking-tight text-white drop-shadow-sm">
              আপনার শ্রেণির জন্য <br />
              <span className="inline-block text-sage-gold drop-shadow-md">সঠিক পরীক্ষার প্রস্তুতি</span>
            </h2>

            {/* Description */}
            <p className="mt-6 max-w-2xl text-base sm:text-lg leading-relaxed text-white/80 font-medium">
              শ্রেণি, বিষয়, স্কুল-ফোকাস ও পরীক্ষার সময় অনুযায়ী সাজানো ১০০% সিলেবাস ফোকাসড প্রোগ্রাম। শিক্ষার্থী যেন শুধু পরীক্ষা না দেয়, পরীক্ষার পর কোথায় উন্নতি দরকার সেটাও পরিষ্কার বুঝতে পারে।
            </p>

            {/* Glassmorphic Class Selectors container */}
            <div className="mt-8 rounded-[2rem] border border-white/10 bg-white/5 p-5.5 backdrop-blur-md shadow-2xl">
              <p className="text-xs font-black uppercase tracking-wider text-sage-gold flex items-center gap-1.5">
                <Award className="h-3.5 w-3.5" />
                আপনার শ্রেণি নির্বাচন করুন
              </p>
              <div className="mt-4 flex flex-wrap gap-2.5">
                {classLevels.map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setActiveClass(level)}
                    className={`rounded-2xl px-5 py-3.5 text-xs font-black transition-all duration-300 transform active:scale-95 ${
                      activeClass === level
                        ? "bg-white text-sage-secondary shadow-xl shadow-black/15 -translate-y-0.5 scale-105"
                        : "bg-white/5 text-white ring-1 ring-white/10 hover:bg-white/15 hover:-translate-y-0.5"
                    }`}
                  >
                    {getClassLabel(level)}
                  </button>
                ))}
              </div>
            </div>

            {/* Targeted high-trust schools spotlight section */}
            {schools.length ? (
              <div className="mt-6 relative overflow-hidden rounded-[2rem] border border-sage-gold/25 bg-gradient-to-br from-sage-gold/10 to-sage-gold/5 p-6 backdrop-blur-md shadow-2xl">
                <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-5">
                  <School className="h-40 w-40" />
                </div>
                
                <p className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-sage-gold">
                  <School className="h-4 w-4 shrink-0 text-sage-gold animate-bounce" />
                  🎯 সিলেবাস ও পরীক্ষার টার্গেটেড স্কুলসমূহ
                </p>
                
                <p className="mt-1 text-[11px] font-bold text-white/70 leading-normal">
                  বনশ্রী আইডিয়াল, ন্যাশনাল আইডিয়াল ও ফয়জুর রহমান আইডিয়াল স্কুলের অর্ধবার্ষিক ও প্রি-টেস্ট পরীক্ষার সিলেবাস অনুযায়ী শতভাগ সাজানো।
                </p>
                
                <div className="mt-4.5 flex flex-wrap gap-2.5">
                  {schools.map((school) => (
                    <span key={school} className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-2.5 text-xs font-black text-sage-secondary shadow-md ring-1 ring-white/15 transition-all hover:scale-105">
                      <CheckCircle2 className="h-3.5 w-3.5 text-sage-gold" />
                      {school}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          {/* Right column detailed dynamic card */}
          <ProgramBrief item={primary} activeClass={activeClass} />
        </div>

        {/* Other programs list grid */}
        {visible.length > 1 ? (
          <div className="mt-16">
            <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-4">
              <h4 className="text-xl font-black text-white flex items-center gap-2">
                <Award className="h-5 w-5 text-sage-gold" />
                এই শ্রেণির অন্যান্য প্রোগ্রামসমূহ
              </h4>
            </div>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {visible.slice(1, 4).map((item) => (
                <ProgramCard key={`${item.kind}-${item._id}`} item={item} activeClass={activeClass} />
              ))}
            </div>
          </div>
        ) : null}
      </Container>
    </section>
  );
}
