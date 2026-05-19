"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TeacherForm } from "./TeacherForm";
import type { AdminTeacher } from "@/components/admin/teachers/types";

interface TeacherFormModalProps {
  teacher?: AdminTeacher;
  trigger?: React.ReactNode;
}

export function TeacherFormModal({ teacher, trigger }: TeacherFormModalProps) {
  const [open, setOpen] = useState(false);
  const isEdit = !!teacher;

  return (
    <>
      {trigger ? (
        <div
          role="button"
          tabIndex={0}
          onClick={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") setOpen(true);
          }}
          className="inline-block cursor-pointer"
        >
          {trigger}
        </div>
      ) : (
        <Button
          type="button"
          onClick={() => setOpen(true)}
          className="bg-sage-primary hover:bg-sage-primary-hover h-12 rounded-xl px-6 font-bold shadow-lg shadow-sage-red-100"
        >
          <Plus className="mr-2 h-4 w-4" /> নতুন শিক্ষক যুক্ত করুন
        </Button>
      )}

      {open ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/45 p-3">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-2xl font-bold text-sage-secondary">
                {isEdit ? "শিক্ষকের তথ্য পরিবর্তন করুন" : "নতুন শিক্ষকের তথ্য দিন"}
              </h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg border border-sage-border px-3 py-1.5 text-sm font-bold text-sage-secondary"
              >
                বন্ধ করুন
              </button>
            </div>

            <TeacherForm teacher={teacher} onSuccess={() => setOpen(false)} onCancel={() => setOpen(false)} />
          </div>
        </div>
      ) : null}
    </>
  );
}
