"use client";

import { useState } from "react";
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

export function QuizManager({ initialQuestions }: { initialQuestions: AdminQuizQuestion[] }) {
  const [questions, setQuestions] = useState(initialQuestions);
  const [isAdding, setIsAdding] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<AdminQuizQuestion | null>(null);

  return (
    <div className="space-y-6">
      {/* Action Panel */}
      <div className="rounded-xl border border-sage-border bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-sage-secondary">কুইজ প্রশ্ন যোগ করুন</h3>
            <p className="mt-1 text-sm text-sage-gray-500">শ্রেণী অনুযায়ী নতুন প্রশ্ন সেট করুন।</p>
          </div>
          <button
            onClick={() => {
              setIsAdding(!isAdding);
              setEditingQuestion(null);
            }}
            className="h-11 rounded-xl bg-sage-primary px-6 font-bold text-white transition hover:bg-sage-secondary shadow-lg shadow-sage-primary/10"
          >
            {isAdding ? "ফর্ম বন্ধ করুন" : "নতুন প্রশ্ন"}
          </button>
        </div>

        {(isAdding || editingQuestion) && (
          <div className="mt-6 max-h-[min(85vh,900px)] overflow-y-auto border-t border-sage-border pt-6 pb-2">
            <QuizQuestionForm
              key={editingQuestion?._id ?? "new"}
              initialData={editingQuestion}
              onSaved={(q, closeForm) => {
                if (Array.isArray(q)) {
                  setQuestions((prev) => [...prev, ...q]);
                } else {
                  if (editingQuestion) {
                    setQuestions((prev) => prev.map((item) => (item._id === q._id ? q : item)));
                  } else {
                    setQuestions((prev) => [...prev, q]);
                  }
                }
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
        questions={questions} 
        onEdit={setEditingQuestion}
        onDeleted={(id) => setQuestions(prev => prev.filter(q => q._id !== id))}
      />
    </div>
  );
}
