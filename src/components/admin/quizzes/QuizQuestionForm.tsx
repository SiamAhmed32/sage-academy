"use client";

import { useState } from "react";
import { Plus, Trash2, HelpCircle, Save } from "lucide-react";
import { toast } from "react-toastify";

import type { AdminQuizQuestion } from "./QuizManager";
import { saveQuizQuestionAction } from "@/app/admin/actions";
import { getClassLabel, toBanglaDigits } from "@/constants/class-levels";
import { cn } from "@/lib/utils";

type Props = {
  initialData?: AdminQuizQuestion | null;
  onSaved: (q: AdminQuizQuestion | AdminQuizQuestion[], closeForm: boolean) => void;
  onCancel: () => void;
};

type Option = { text: string; isCorrect: boolean };

type QuestionItem = {
  id: string;
  questionText: string;
  explanation: string;
  options: Option[];
};

const DEFAULT_OPTIONS = [
  { text: "", isCorrect: true },
  { text: "", isCorrect: false },
  { text: "", isCorrect: false },
  { text: "", isCorrect: false },
];

function createNewQuestion(): QuestionItem {
  return {
    id: crypto.randomUUID(),
    questionText: "",
    explanation: "",
    options: JSON.parse(JSON.stringify(DEFAULT_OPTIONS)),
  };
}

export function QuizQuestionForm({ initialData, onSaved, onCancel }: Props) {
  const [isPending, setIsPending] = useState(false);
  const [classLevel, setClassLevel] = useState(initialData?.classLevel || 6);
  
  // If editing, we only have one question. If adding, we can have multiple.
  const [questionList, setQuestionList] = useState<QuestionItem[]>(() => {
    if (initialData) {
      return [{
        id: initialData._id,
        questionText: initialData.questionText,
        explanation: initialData.explanation,
        options: initialData.options.length >= 4 
          ? initialData.options 
          : [...initialData.options, ...DEFAULT_OPTIONS.slice(initialData.options.length)],
      }];
    }
    return [createNewQuestion()];
  });

  const isEdit = Boolean(initialData?._id);

  const updateQuestion = (id: string, updates: Partial<QuestionItem>) => {
    setQuestionList((prev) =>
      prev.map((q) => (q.id === id ? { ...q, ...updates } : q))
    );
  };

  const updateOption = (qId: string, optIndex: number, text: string) => {
    setQuestionList((prev) =>
      prev.map((q) => {
        if (q.id !== qId) return q;
        const nextOptions = [...q.options];
        nextOptions[optIndex] = { ...nextOptions[optIndex], text };
        return { ...q, options: nextOptions };
      })
    );
  };

  const setCorrectOption = (qId: string, optIndex: number) => {
    setQuestionList((prev) =>
      prev.map((q) => {
        if (q.id !== qId) return q;
        const nextOptions = q.options.map((opt, i) => ({
          ...opt,
          isCorrect: i === optIndex,
        }));
        return { ...q, options: nextOptions };
      })
    );
  };

  const addAnotherQuestion = () => {
    setQuestionList((prev) => [...prev, createNewQuestion()]);
  };

  const removeQuestion = (id: string) => {
    if (questionList.length <= 1) return;
    setQuestionList((prev) => prev.filter((q) => q.id !== id));
  };

  const validate = (): boolean => {
    for (const q of questionList) {
      if (!q.questionText.trim()) {
        toast.error("সবগুলো প্রশ্নের টেক্সট লিখুন");
        return false;
      }
      const filledOptions = q.options.filter(o => o.text.trim().length > 0);
      if (filledOptions.length < 2) {
        toast.error("প্রতিটি প্রশ্নের কমপক্ষে ২ টি অপশন থাকতে হবে");
        return false;
      }
      if (!q.options.some(o => o.isCorrect)) {
        toast.error("প্রতিটি প্রশ্নের একটি সঠিক উত্তর নির্বাচন করুন");
        return false;
      }
    }
    return true;
  };

  const handleSave = async (closeForm: boolean) => {
    if (!validate()) return;
    setIsPending(true);

    try {
      const results: AdminQuizQuestion[] = [];
      
      // Save questions one by one for now as the action handles single save
      // In a real bulk scenario, we'd have a bulkAction
      for (const q of questionList) {
        const payload = {
          id: isEdit ? initialData?._id : undefined,
          classLevel,
          questionText: q.questionText.trim(),
          explanation: q.explanation.trim(),
          options: q.options.filter(o => o.text.trim().length > 0),
        };
        
        const res = await saveQuizQuestionAction(payload);
        if (res.ok && res.data) {
          results.push(res.data as AdminQuizQuestion);
        } else {
          throw new Error(res.message || "সংরক্ষণ করা যায়নি");
        }
      }

      toast.success(isEdit ? "আপডেট সফল হয়েছে" : `${results.length}টি প্রশ্ন সফলভাবে যোগ করা হয়েছে`);
      onSaved(isEdit ? results[0] : results, closeForm);
    } catch (err: any) {
      toast.error(err.message || "সার্ভারে সমস্যা হয়েছে");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="space-y-8 pb-4">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-sage-border pb-6">
        <label className="flex items-center gap-3 text-sm font-bold text-sage-secondary">
          শ্রেণী নির্বাচন করুন:
          <select
            value={classLevel}
            onChange={(e) => setClassLevel(Number(e.target.value))}
            className="h-10 rounded-lg border border-sage-border bg-white px-3 outline-none focus:ring-1 focus:ring-sage-primary"
          >
            {[5, 6, 7, 8, 9, 10, 11, 12].map((l) => (
              <option key={l} value={l}>{getClassLabel(l)}</option>
            ))}
          </select>
        </label>

        {!isEdit && (
          <button
            type="button"
            onClick={addAnotherQuestion}
            className="flex items-center gap-2 rounded-xl bg-sage-secondary/10 px-4 py-2 text-sm font-bold text-sage-secondary transition hover:bg-sage-secondary hover:text-white"
          >
            <Plus size={16} />
            আরও প্রশ্ন যোগ করুন
          </button>
        )}
      </div>

      <div className="space-y-12">
        {questionList.map((q, qIndex) => (
          <div key={q.id} className="relative space-y-6 rounded-2xl border border-sage-border bg-white p-6 shadow-sm">
            {questionList.length > 1 && (
              <button
                onClick={() => removeQuestion(q.id)}
                className="absolute -right-3 -top-3 flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white shadow-lg transition hover:bg-red-600"
              >
                <Trash2 size={16} />
              </button>
            )}

            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sage-primary text-sm font-black text-white">
                {toBanglaDigits(qIndex + 1)}
              </span>
              <h3 className="text-sm font-black uppercase tracking-wider text-sage-secondary">
                প্রশ্ন {toBanglaDigits(qIndex + 1)}
              </h3>
            </div>

            <label className="grid gap-2 text-sm font-bold text-sage-secondary">
              প্রশ্ন লিখুন *
              <textarea
                value={q.questionText}
                onChange={(e) => updateQuestion(q.id, { questionText: e.target.value })}
                placeholder="যেমন: ফটোসিন্থেসিস কী?"
                className="min-h-[100px] rounded-xl border border-sage-border p-4 outline-none focus:ring-1 focus:ring-sage-primary transition"
              />
            </label>

            <div className="space-y-4">
              <p className="text-xs font-bold uppercase tracking-tight text-sage-gray-500">
                অপশন এবং সঠিক উত্তর (রেডিও দিয়ে সঠিকটি বেছে নিন)
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                {q.options.map((opt, optIndex) => (
                  <div
                    key={optIndex}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border p-3 transition-all",
                      opt.isCorrect ? "border-sage-primary bg-sage-red-50/50 ring-1 ring-sage-primary" : "border-sage-border bg-sage-red-50/5 hover:border-sage-primary/40"
                    )}
                  >
                    <input
                      type="radio"
                      name={`correct-${q.id}`}
                      checked={opt.isCorrect}
                      onChange={() => setCorrectOption(q.id, optIndex)}
                      className="h-5 w-5 cursor-pointer accent-sage-primary"
                    />
                    <input
                      type="text"
                      value={opt.text}
                      onChange={(e) => updateOption(q.id, optIndex, e.target.value)}
                      placeholder={`অপশন ${toBanglaDigits(optIndex + 1)}`}
                      className="h-9 min-w-0 flex-1 border-none bg-transparent text-sm font-bold outline-none placeholder:font-normal"
                    />
                  </div>
                ))}
              </div>
            </div>

            <label className="grid gap-2 text-sm font-bold text-sage-secondary">
              <div className="flex items-center gap-1.5">
                <HelpCircle size={14} className="text-sage-primary" />
                ব্যাখ্যা (ঐচ্ছিক)
              </div>
              <textarea
                value={q.explanation}
                onChange={(e) => updateQuestion(q.id, { explanation: e.target.value })}
                placeholder="সঠিক উত্তরের কারণ সংক্ষেপে লিখুন..."
                className="min-h-[80px] rounded-xl border border-sage-border p-4 text-sm outline-none focus:ring-1 focus:ring-sage-primary transition"
              />
            </label>
          </div>
        ))}
      </div>

      {!isEdit && (
        <button
          type="button"
          onClick={addAnotherQuestion}
          className="group flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-sage-border py-8 text-sage-gray-400 transition hover:border-sage-primary hover:bg-sage-red-50 hover:text-sage-primary"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sage-red-50 text-sage-primary transition group-hover:bg-sage-primary group-hover:text-white">
            <Plus size={24} />
          </div>
          <span className="text-lg font-bold">নতুন প্রশ্ন যোগ করুন</span>
        </button>
      )}

      {/* Action Footer */}
      <div className="sticky bottom-0 z-20 -mx-1 flex flex-col gap-3 border-t border-sage-border bg-white pt-6 pb-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="h-12 rounded-xl border border-sage-border bg-white px-8 font-bold text-sage-secondary transition hover:bg-sage-red-50"
        >
          বাতিল
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => void handleSave(true)}
          className="flex h-12 items-center justify-center gap-2 rounded-xl bg-sage-primary px-10 font-black text-white shadow-lg shadow-sage-primary/20 transition hover:bg-sage-secondary disabled:opacity-50"
        >
          {isPending ? (
            "সেভ হচ্ছে..."
          ) : (
            <>
              <Save size={18} />
              {isEdit ? "আপডেট করুন" : "সবগুলো সেভ করুন"}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
