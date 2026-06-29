"use client";

import { motion, AnimatePresence } from "framer-motion";
import { GripVertical, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { SubjectSyllabusItemInput } from "@/lib/exam-hub-syllabus";
import { cn } from "@/lib/utils";

const fieldClass = "h-10 rounded-xl border-sage-border bg-white px-3 text-sm shadow-none focus-visible:ring-sage-primary/20";

type Props = {
  value: SubjectSyllabusItemInput[];
  onChange: (items: SubjectSyllabusItemInput[]) => void;
  maxItems?: number;
};

function emptyItem(): SubjectSyllabusItemInput {
  return { name: "", syllabus: "" };
}

export function SubjectSyllabusEditor({ value, onChange, maxItems = 20 }: Props) {
  function updateItem(index: number, patch: Partial<SubjectSyllabusItemInput>) {
    onChange(value.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function removeItem(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  function addItem() {
    if (value.length >= maxItems) return;
    onChange([...value, emptyItem()]);
  }

  return (
    <div className="space-y-3">
      <AnimatePresence initial={false}>
        {value.map((item, index) => (
          <motion.div
            key={`subject-${index}`}
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="overflow-hidden rounded-2xl border border-sage-border/80 bg-white shadow-sm"
          >
            <div className="flex items-center gap-2 border-b border-sage-border/60 bg-sage-cream/25 px-3 py-2.5 sm:px-4">
              <GripVertical className="size-4 shrink-0 text-sage-gray-400" />
              <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-amber-700 text-xs font-bold text-white">
                {index + 1}
              </span>
              <p className="text-sm font-semibold text-sage-secondary">Subject {index + 1}</p>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="ml-auto rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={() => removeItem(index)}
                disabled={value.length <= 1}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>

            <div className="grid gap-4 p-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-sage-gray-500">Subject name *</label>
                <Input
                  maxLength={120}
                  value={item.name}
                  onChange={(e) => updateItem(index, { name: e.target.value })}
                  className={fieldClass}
                  placeholder="e.g. Bangla"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-sage-gray-500">Syllabus topics</label>
                <Textarea
                  rows={4}
                  maxLength={3000}
                  value={item.syllabus}
                  onChange={(e) => updateItem(index, { syllabus: e.target.value })}
                  className={cn(
                    "min-h-[110px] rounded-xl border-sage-border bg-white px-3 py-2.5 text-sm",
                    "font-mono leading-relaxed"
                  )}
                  placeholder={"আনন্দ পাঠ\nব্যাকরণ\nরচনা\n...\n(one topic per line)"}
                />
                <p className="text-xs text-sage-gray-500">
                  One topic per line. Shown as a detailed list on the public exam page.
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      <Button
        type="button"
        variant="outline"
        className="w-full rounded-xl border-dashed border-sage-border py-6 hover:border-sage-primary/40 hover:bg-sage-red-50/30"
        onClick={addItem}
        disabled={value.length >= maxItems}
      >
        <Plus className="size-4" />
        Add subject
        <span className="text-sage-gray-500">({value.length}/{maxItems})</span>
      </Button>
    </div>
  );
}
