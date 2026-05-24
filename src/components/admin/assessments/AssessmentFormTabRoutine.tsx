"use client";

import { useState } from "react";
import { RoutineEditor } from "./RoutineEditor";
import { getClassLabel } from "@/constants/class-levels";

type RoutineRow = {
  day: string;
  time: string;
  subject: string;
};

type ClassInfo = {
  classLevel: number;
  subjects: string;
  routine: RoutineRow[];
};

type Props = {
  classLevels: number[];
  classSpecificInfo: ClassInfo[];
  onClassSpecificInfoChange: (val: ClassInfo[]) => void;
  schoolFocus: string;
  onSchoolFocusChange: (val: string) => void;
  routineTitle: string;
  onRoutineTitleChange: (val: string) => void;
  routineSubtitle: string;
  onRoutineSubtitleChange: (val: string) => void;
  scheduleNote: string;
  title: string;
};

const inputClass = "h-11 rounded-xl border border-sage-border bg-white px-3 text-sm outline-none focus:border-sage-primary w-full";
const textareaClass = "min-h-24 rounded-xl border border-sage-border bg-white px-3 py-3 text-sm outline-none focus:border-sage-primary w-full";

export function AssessmentFormTabRoutine({
  classLevels,
  classSpecificInfo,
  onClassSpecificInfoChange,
  schoolFocus,
  onSchoolFocusChange,
  routineTitle,
  onRoutineTitleChange,
  routineSubtitle,
  onRoutineSubtitleChange,
  scheduleNote,
  title,
}: Props) {
  const [activeClass, setActiveClass] = useState<number>(classLevels[0] || 6);

  const activeInfo = classSpecificInfo.find(c => c.classLevel === activeClass) || { classLevel: activeClass, subjects: "", routine: [] };

  const updateActiveInfo = (updates: Partial<ClassInfo>) => {
    const exists = classSpecificInfo.some(c => c.classLevel === activeClass);
    if (exists) {
      onClassSpecificInfoChange(classSpecificInfo.map(c => c.classLevel === activeClass ? { ...c, ...updates } : c));
    } else {
      onClassSpecificInfoChange([...classSpecificInfo, { classLevel: activeClass, subjects: "", routine: [], ...updates }]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-bold text-sage-secondary">
          টার্গেট স্কুল / কলেজ (লাইন ভিত্তিক আলাদা)
          <textarea name="schoolFocus" value={schoolFocus} onChange={(e) => onSchoolFocusChange(e.target.value)} className={textareaClass} placeholder="Banani Ideal&#10;National Ideal" />
        </label>
        
        <div className="space-y-4">
          <label className="grid gap-2 text-sm font-bold text-sage-secondary">
            রুটিন হেডলাইন
            <input name="routineTitle" value={routineTitle} onChange={(e) => onRoutineTitleChange(e.target.value)} placeholder="SSC 2027" className={inputClass} />
          </label>
          <label className="grid gap-2 text-sm font-bold text-sage-secondary">
            রুটিন সাব-হেডলাইন
            <input name="routineSubtitle" value={routineSubtitle} onChange={(e) => onRoutineSubtitleChange(e.target.value)} placeholder="Batch: G10-1" className={inputClass} />
          </label>
        </div>
      </div>

      <div className="rounded-2xl border border-sage-border bg-sage-cream/30 p-5">
        <h3 className="mb-4 text-base font-black text-sage-secondary flex items-center gap-2">
          শ্রেণিভিত্তিক রুটিন ও সিলেবাস
        </h3>

        {classLevels.length === 0 ? (
          <p className="text-sm text-sage-red-600 font-bold bg-sage-red-50 p-3 rounded-lg border border-sage-red-200">
            দয়া করে "বেসিক তথ্য" বা "শ্রেণি ও ফি" ট্যাব থেকে ক্লাস নির্বাচন করুন।
          </p>
        ) : (
          <div className="space-y-5">
            {/* Class Selector Tabs */}
            <div className="flex flex-wrap gap-2 pb-2">
              {classLevels.map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setActiveClass(level)}
                  className={`rounded-xl px-4 py-2 text-xs font-black transition-all ${
                    activeClass === level
                      ? "bg-sage-primary text-white shadow-md shadow-sage-primary/20"
                      : "bg-white text-sage-gray-500 border border-sage-border hover:bg-sage-cream"
                  }`}
                >
                  {getClassLabel(level)}
                </button>
              ))}
            </div>

            <div className="bg-white rounded-xl border border-sage-border p-4 space-y-5 shadow-sm">
              <label className="grid gap-2 text-sm font-bold text-sage-secondary">
                {getClassLabel(activeClass)} - বিষয়সমূহ (লাইন ভিত্তিক আলাদা)
                <textarea 
                  value={activeInfo.subjects} 
                  onChange={(e) => updateActiveInfo({ subjects: e.target.value })} 
                  className={textareaClass} 
                  placeholder="Bangla&#10;English&#10;Math" 
                />
              </label>

              <div>
                <p className="mb-2 text-sm font-bold text-sage-secondary">{getClassLabel(activeClass)} - রুটিন তৈরি</p>
                <RoutineEditor
                  title={title}
                  routineTitle={routineTitle}
                  routineSubtitle={routineSubtitle}
                  scheduleNote={scheduleNote}
                  routine={activeInfo.routine}
                  onChange={r => updateActiveInfo({ routine: r })}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
