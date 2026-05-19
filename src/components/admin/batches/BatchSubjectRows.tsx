"use client";

import { useMemo, useState } from "react";

import type { BatchSubjectInput, TeacherOption } from "./types";

const dayOptions = [
  { label: "শনিবার", value: "Saturday" },
  { label: "রবিবার", value: "Sunday" },
  { label: "সোমবার", value: "Monday" },
  { label: "মঙ্গলবার", value: "Tuesday" },
  { label: "বুধবার", value: "Wednesday" },
  { label: "বৃহস্পতিবার", value: "Thursday" },
  { label: "শুক্রবার", value: "Friday" },
];

const timeOptions = Array.from({ length: (22 - 7) * 4 + 1 }, (_, i) => {
  const totalMinutes = 7 * 60 + i * 15;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const ampm = hours >= 12 ? "PM" : "AM";
  const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
  const timeStr = `${displayHours}:${minutes === 0 ? "00" : minutes} ${ampm}`;
  return timeStr;
});

const inputClass = "h-10 rounded-lg border border-sage-border bg-sage-white px-3 text-sm outline-none";

const emptySubject: BatchSubjectInput = {
  subjectName: "",
  teacher: null,
  days: [],
  startTime: "",
  endTime: "",
  monthlyFee: 0,
};

type BatchSubjectRowsProps = {
  teachers: TeacherOption[];
  initialSubjects?: BatchSubjectInput[];
};

export function BatchSubjectRows({
  teachers,
  initialSubjects = [],
}: BatchSubjectRowsProps) {
  const [subjects, setSubjects] = useState<BatchSubjectInput[]>(
    initialSubjects.length ? initialSubjects : [{ ...emptySubject }]
  );

  const payload = useMemo(
    () =>
      subjects
        .map((subject) => ({
          ...subject,
          subjectName: subject.subjectName.trim(),
          startTime: subject.startTime.trim(),
          endTime: subject.endTime.trim(),
          monthlyFee: Number(subject.monthlyFee) || 0,
        }))
        // Enforce that subjects MUST have a name AND times to be saved
        .filter((subject) => subject.subjectName && subject.startTime && subject.endTime),
    [subjects]
  );

  function updateSubject(index: number, key: keyof BatchSubjectInput, value: unknown) {
    setSubjects((items) =>
      items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item
      )
    );
  }

  function toggleDay(index: number, dayValue: string) {
    const selected = subjects[index]?.days ?? [];
    const nextDays = selected.includes(dayValue)
      ? selected.filter((item) => item !== dayValue)
      : [...selected, dayValue];

    updateSubject(index, "days", nextDays);
  }

  return (
    <div className="space-y-4 rounded-xl border border-sage-border bg-sage-white p-4">
      <input type="hidden" name="subjectsJson" value={JSON.stringify(payload)} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="font-bold text-sage-secondary">সাবজেক্ট ও রুটিন</h4>
          <p className="text-sm text-sage-gray-500">প্রতিটি সাবজেক্টের সময় (Start & End Time) দেওয়া বাধ্যতামূলক।</p>
        </div>
        <button
          type="button"
          onClick={() => setSubjects((items) => [...items, { ...emptySubject }])}
          className="rounded-lg border border-sage-border px-4 py-2 text-sm font-bold text-sage-secondary transition hover:bg-sage-red-50"
        >
          + সাবজেক্ট
        </button>
      </div>

      {subjects.map((subject, index) => (
        <div key={index} className="grid gap-3 rounded-lg bg-sage-red-50 p-4 lg:grid-cols-12 border border-sage-border/30">
          <div className="lg:col-span-3">
             <p className="text-[10px] font-bold text-sage-gray-400 uppercase mb-1">Subject Name</p>
             <input
               value={subject.subjectName}
               onChange={(event) => updateSubject(index, "subjectName", event.target.value)}
               placeholder="e.g. Physics"
               className={`${inputClass} w-full`}
             />
          </div>
          <div className="lg:col-span-3">
             <p className="text-[10px] font-bold text-sage-gray-400 uppercase mb-1">Teacher</p>
             <select
               value={subject.teacher ?? ""}
               onChange={(event) => updateSubject(index, "teacher", event.target.value || null)}
               className={`${inputClass} w-full`}
             >
               <option value="">শিক্ষক নির্বাচন</option>
               {teachers.map((teacher) => (
                 <option key={teacher._id} value={teacher._id}>
                   {teacher.name} {teacher.subject ? `- ${teacher.subject}` : ""}
                 </option>
               ))}
             </select>
          </div>
          <div className="lg:col-span-2">
             <p className="text-[10px] font-bold text-sage-primary uppercase mb-1">Start Time *</p>
             <select
               value={subject.startTime}
               onChange={(event) => updateSubject(index, "startTime", event.target.value)}
               className={`${inputClass} w-full border-sage-primary/20`}
             >
               <option value="">Start Time</option>
               {timeOptions.map((time) => (
                 <option key={time} value={time}>{time}</option>
               ))}
             </select>
          </div>
          <div className="lg:col-span-2">
             <p className="text-[10px] font-bold text-sage-primary uppercase mb-1">End Time *</p>
             <select
               value={subject.endTime}
               onChange={(event) => updateSubject(index, "endTime", event.target.value)}
               className={`${inputClass} w-full border-sage-primary/20`}
             >
               <option value="">End Time</option>
               {timeOptions.map((time) => (
                 <option key={time} value={time}>{time}</option>
               ))}
             </select>
          </div>
          <div className="lg:col-span-2">
             <p className="text-[10px] font-bold text-sage-gray-400 uppercase mb-1">Fee</p>
             <input
               value={subject.monthlyFee || ""}
               onChange={(event) => updateSubject(index, "monthlyFee", Number(event.target.value))}
               type="number"
               min="0"
               placeholder="Monthly fee"
               className={`${inputClass} w-full`}
             />
          </div>

          <div className="lg:col-span-11">
            <p className="text-[10px] font-bold text-sage-gray-400 uppercase mb-2">ক্লাসের দিন</p>
            <div className="flex flex-wrap gap-2">
              {dayOptions.map((day) => (
                <label key={day.value} className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold cursor-pointer transition ${subject.days.includes(day.value) ? 'bg-sage-primary text-white border-sage-primary' : 'bg-white text-sage-secondary border-sage-border hover:border-sage-primary'}`}>
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={subject.days.includes(day.value)}
                    onChange={() => toggleDay(index, day.value)}
                  />
                  {day.label}
                </label>
              ))}
            </div>
          </div>
          
          <div className="lg:col-span-1 flex items-end justify-end">
            <button
              type="button"
              onClick={() => setSubjects((items) => items.filter((_, itemIndex) => itemIndex !== index))}
              className="rounded-lg border border-sage-border bg-white px-3 py-2 text-xs font-bold text-sage-primary hover:bg-sage-red-50 transition"
            >
              মুছুন
            </button>
          </div>
        </div>
      ))}
      
      <p className="text-[10px] text-sage-gray-400 italic">
        * সময় না দিলে সাবজেক্টটি সেভ হবে না এবং রুটিনে দেখা যাবে না।
      </p>
    </div>
  );
}
