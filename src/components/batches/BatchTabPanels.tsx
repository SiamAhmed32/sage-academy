import Image from "next/image";
import { CheckCircle2, ClipboardCheck, Star } from "lucide-react";

import type { Batch } from "@/types/batch";

export function OverviewTab({ batch, promotionCard }: { batch: any; promotionCard: any }) {
  return (
    <div className="py-2">
      <div className="flex gap-6">
        <div className="mt-2 h-auto w-1 rounded-full bg-sage-primary/20" />
        <div className="prose prose-sage max-w-none">
          <p className="text-xl font-medium leading-[1.8] text-sage-gray-700 whitespace-pre-wrap italic">
            {promotionCard.overview || batch.overview || "এই ব্যাচের নিয়মিত ক্লাস, অধ্যায়ভিত্তিক অনুশীলন, সাপ্তাহিক পরীক্ষা এবং ফলাফল বিশ্লেষণের মাধ্যমে শিক্ষার্থীদের প্রস্তুতি শক্তিশালী করা হয়।"}
          </p>
        </div>
      </div>
    </div>
  );
}

export function InstructorTab({ batch }: { batch: any }) {
  const subjects = batch.subjects || [];
  
  const teachers = Array.from(new Set(subjects.map((s: any) => s.teacher?._id)))
    .map(id => subjects.find((s: any) => s.teacher?._id === id)?.teacher)
    .filter(Boolean);

  if (!teachers.length) {
    return <EmptyState text="এই ব্যাচের শিক্ষক তথ্য শীঘ্রই যুক্ত করা হবে।" />;
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {teachers.map((instructor: any) => (
        <div 
          key={instructor._id} 
          className="group relative flex flex-col items-center rounded-[2.5rem] bg-white p-8 text-center transition-all duration-300 hover:shadow-2xl hover:shadow-sage-red-100/50 border border-sage-red-100/40"
        >
          <div className="relative mb-6">
            <div className="relative h-36 w-36 overflow-hidden rounded-full border-4 border-white shadow-xl ring-4 ring-sage-red-50/50">
              <Image 
                src={instructor.image || "/teacher/team1.jpg"} 
                alt={instructor.name} 
                fill 
                className="object-cover transition-transform duration-500 group-hover:scale-110" 
              />
            </div>
          </div>
          
          <div className="space-y-1">
            <h3 className="text-2xl font-black text-sage-secondary group-hover:text-sage-primary transition">{instructor.name}</h3>
            <p className="text-sm font-bold text-sage-primary uppercase tracking-widest">
              {instructor.designation || "Senior Teachers"}
            </p>
          </div>
          
          <div className="mt-8 flex flex-col items-center gap-4">
            <div className="h-0.5 w-10 rounded-full bg-sage-red-100" />
            <div className="relative px-8">
              <span className="absolute -left-2 -top-4 text-5xl text-sage-primary/5 font-serif select-none">&ldquo;</span>
              <p className="text-sm font-semibold leading-relaxed text-sage-gray-500 italic relative z-10">
                {instructor.quote || "শিক্ষার্থীদের নিয়মিত গাইডলাইন ও পরীক্ষার মাধ্যমে ভালো ফলাফলের প্রস্তুতি নিশ্চিত করা হয়।"}
              </p>
              <span className="absolute -right-2 -bottom-6 text-5xl text-sage-primary/5 font-serif select-none">&rdquo;</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-sage-red-100 bg-white p-10 text-center text-sage-gray-500">
      <ClipboardCheck className="mx-auto mb-4 text-sage-primary" />
      {text}
    </div>
  );
}
