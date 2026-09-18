"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Filter, Search } from "lucide-react";
import { getAdminClassLabel } from "@/constants/admin-display";
import { QuizQuestionForm } from "./QuizQuestionForm";
import { QuizQuestionTable } from "./QuizQuestionTable";

export type AdminQuizQuestion = {
  _id: string;
  classLevel: number;
  questionText: string;
  options: { text: string; isCorrect: boolean }[];
  explanation: string;
  isActive: boolean;
  order: number;
};

type Props = {
  initialQuestions: AdminQuizQuestion[];
  filters: {
    q: string;
    classLevel: string;
    status: string;
    sort: string;
  };
};

export function QuizManager({ initialQuestions, filters }: Props) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<AdminQuizQuestion | null>(null);
  const router = useRouter();

  return (
    <div className="space-y-6">
      <form method="get" className="grid gap-3 rounded-xl border border-sage-border bg-white p-4 md:grid-cols-12">
        <div className="relative md:col-span-5">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sage-gray-400" />
          <input name="q" defaultValue={filters.q} placeholder="Search questions, answers, or explanations..." className="h-10 w-full rounded-lg border border-sage-border pl-9 pr-3 text-sm outline-none focus:border-sage-primary" />
        </div>
        <select name="classLevel" defaultValue={filters.classLevel} className="h-10 rounded-lg border border-sage-border px-3 text-sm md:col-span-2">
          <option value="">All classes</option>
          {[5, 6, 7, 8, 9, 10, 11, 12].map((level) => <option key={level} value={level}>{getAdminClassLabel(level)}</option>)}
        </select>
        <select name="status" defaultValue={filters.status} className="h-10 rounded-lg border border-sage-border px-3 text-sm md:col-span-2">
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <select name="sort" defaultValue={filters.sort} className="h-10 rounded-lg border border-sage-border px-3 text-sm md:col-span-1">
          <option value="order">Order</option>
          <option value="newest">Newest</option>
          <option value="class">Class</option>
        </select>
        <button type="submit" className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-sage-primary px-3 text-sm font-bold text-white md:col-span-2">
          <Filter className="h-4 w-4" />
          Apply
        </button>
      </form>

      {/* Action Panel */}
      <div className="rounded-xl border border-sage-border bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-sage-secondary">Add quiz questions</h3>
            <p className="mt-1 text-sm text-sage-gray-500">Create new questions for each class.</p>
          </div>
          <button
            onClick={() => {
              setIsAdding(!isAdding);
              setEditingQuestion(null);
            }}
            className="h-11 rounded-xl bg-sage-primary px-6 font-bold text-white transition hover:bg-sage-secondary shadow-lg shadow-sage-primary/10"
          >
            {isAdding ? "Close form" : "New question"}
          </button>
        </div>

        {(isAdding || editingQuestion) && (
          <div className="mt-6 max-h-[min(85vh,900px)] overflow-y-auto border-t border-sage-border pt-6 pb-2">
            <QuizQuestionForm
              key={editingQuestion?._id ?? "new"}
              initialData={editingQuestion}
              onSaved={(_q, closeForm) => {
                router.refresh();
                if (closeForm) {
                  setIsAdding(false);
                  setEditingQuestion(null);
                }
              }}
              onCancel={() => {
                setIsAdding(false);
                setEditingQuestion(null);
              }}
            />
          </div>
        )}
      </div>

      <QuizQuestionTable 
        questions={initialQuestions}
        onEdit={setEditingQuestion}
        onDeleted={() => router.refresh()}
      />
    </div>
  );
}
