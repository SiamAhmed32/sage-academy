"use client";

import { Edit, Trash2 } from "lucide-react";
import type { AdminQuizQuestion } from "./QuizManager";
import { deleteQuizQuestionAction } from "@/app/admin/actions";
import { getAdminClassLabel } from "@/constants/admin-display";
import { toast } from "react-toastify";

type Props = {
  questions: AdminQuizQuestion[];
  onEdit: (q: AdminQuizQuestion) => void;
  onDeleted: (id: string) => void;
};

export function QuizQuestionTable({ questions, onEdit, onDeleted }: Props) {
  if (questions.length === 0) {
    return (
      <div className="rounded-2xl border border-sage-border bg-white p-20 text-center">
        <p className="text-lg font-bold text-sage-secondary">No quiz questions found</p>
        <p className="mt-1 text-sm text-sage-gray-500">Add your first question.</p>
      </div>
    );
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this question permanently?")) return;
    try {
      const res = await deleteQuizQuestionAction(id);
      if (res.ok) {
        toast.success("Question deleted");
        onDeleted(id);
      } else {
        toast.error("Could not delete the question");
      }
    } catch {
      toast.error("A server error occurred");
    }
  };

  return (
    <div className="rounded-2xl border border-sage-border bg-white overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-sage-red-50/50 text-[10px] font-black uppercase tracking-widest text-sage-primary">
              <th className="px-6 py-4">Class</th>
              <th className="px-6 py-4">Question</th>
              <th className="px-6 py-4">Correct answer</th>
              <th className="px-6 py-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sage-border/50">
            {questions.map((q) => (
              <tr key={q._id} className="group hover:bg-sage-red-50/30 transition-colors">
                <td className="px-6 py-4">
                  <span className="rounded-full bg-sage-primary/10 px-3 py-1 text-xs font-bold text-sage-primary">
                    {getAdminClassLabel(q.classLevel)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm font-bold text-sage-secondary max-w-md line-clamp-2">{q.questionText}</p>
                  {q.explanation && (
                    <p className="mt-1 text-[10px] italic text-sage-gray-500 line-clamp-1">Expl: {q.explanation}</p>
                  )}
                </td>
                <td className="px-6 py-4">
                  <p className="text-xs font-bold text-green-600">
                    {q.options.find(o => o.isCorrect)?.text || "N/A"}
                  </p>
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={() => onEdit(q)}
                      className="p-2 text-sage-gray-400 hover:text-sage-primary hover:bg-white rounded-lg transition shadow-sm"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(q._id)}
                      className="p-2 text-sage-gray-400 hover:text-sage-red-500 hover:bg-white rounded-lg transition shadow-sm"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
