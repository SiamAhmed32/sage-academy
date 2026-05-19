"use client";

import { useState } from "react";

import { TestimonialCard } from "@/components/admin/testimonials/TestimonialCard";
import { TestimonialDeleteModal } from "@/components/admin/testimonials/TestimonialDeleteModal";
import { TestimonialFormPanel } from "@/components/admin/testimonials/TestimonialFormPanel";
import type { AdminTestimonial } from "@/components/admin/testimonials/types";

type Props = {
  initialItems: AdminTestimonial[];
};

export function TestimonialsManager({ initialItems }: Props) {
  const [items, setItems] = useState(initialItems);
  const [editing, setEditing] = useState<AdminTestimonial | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminTestimonial | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  async function updateOne(id: string, payload: Partial<AdminTestimonial>) {
    const res = await fetch(`/api/testimonials/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (res.ok && json.success) {
      const updated = json.data as AdminTestimonial;
      setItems((prev) => prev.map((it) => (it._id === id ? updated : it)));
    }
  }

  async function deleteOne() {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    setDeleteError("");
    try {
      const res = await fetch(`/api/testimonials/${deleteTarget._id}`, { method: "DELETE" });
      const contentType = res.headers.get("content-type") ?? "";
      const json = contentType.includes("application/json")
        ? await res.json()
        : { success: false, message: "Unexpected server response" };
      if (res.ok && json.success) {
        setItems((prev) => prev.filter((it) => it._id !== deleteTarget._id));
        setDeleteTarget(null);
      } else {
        setDeleteError(json.message ?? "Delete failed");
      }
    } catch {
      setDeleteError("Delete failed. Please try again.");
    }
    setDeleting(false);
  }

  return (
    <>
      <div className="mb-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-sage-border bg-white p-4">
          <div>
            <h3 className="text-lg font-bold text-sage-secondary">টেস্টিমোনিয়াল ম্যানেজমেন্ট</h3>
            <p className="mt-1 text-sm text-sage-gray-500">
              শিক্ষার্থী ও অভিভাবকদের মতামত যোগ বা পরিবর্তন করুন।
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (creating) {
                setCreating(false);
              } else {
                setEditing(null);
                setCreating(true);
              }
            }}
            className="h-10 rounded-lg bg-sage-primary px-4 text-sm font-bold text-white transition hover:bg-sage-secondary"
          >
            {creating ? "ফর্ম বন্ধ করুন" : "নতুন টেস্টিমোনিয়াল"}
          </button>
        </div>
      </div>

      {creating && (
        <TestimonialFormPanel
          mode="create"
          onCancel={() => setCreating(false)}
          onSaved={(saved) => {
            setItems((prev) => [saved, ...prev]);
            setCreating(false);
          }}
        />
      )}

      {editing && (
        <TestimonialFormPanel
          mode="edit"
          initial={editing}
          onCancel={() => setEditing(null)}
          onSaved={(saved) => {
            setItems((prev) => prev.map((it) => (it._id === saved._id ? saved : it)));
            setEditing(null);
          }}
        />
      )}

      {items.length === 0 ? (
        <div className="rounded-xl border border-sage-border bg-white p-6 text-sm text-sage-gray-700">
          কোনো testimonial পাওয়া যায়নি। “নতুন টেস্টিমোনিয়াল” ক্লিক করে যোগ করুন।
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {items.map((item) => (
          <TestimonialCard
            key={item._id}
            item={item}
            onEdit={setEditing}
            onDelete={(target) => {
              setDeleteError("");
              setDeleteTarget(target);
            }}
            onTogglePublish={(target, next) => updateOne(target._id, { isFeatured: next })}
          />
        ))}
      </div>

      <TestimonialDeleteModal
        open={Boolean(deleteTarget)}
        deleting={deleting}
        name={deleteTarget?.name}
        error={deleteError}
        onClose={() => {
          setDeleteTarget(null);
          setDeleteError("");
        }}
        onConfirm={deleteOne}
      />
    </>
  );
}
