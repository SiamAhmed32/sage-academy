"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Filter, Search } from "lucide-react";

import { TestimonialCard } from "@/components/admin/testimonials/TestimonialCard";
import { TestimonialDeleteModal } from "@/components/admin/testimonials/TestimonialDeleteModal";
import { TestimonialFormPanel } from "@/components/admin/testimonials/TestimonialFormPanel";
import type { AdminTestimonial } from "@/components/admin/testimonials/types";

type Props = {
  initialItems: AdminTestimonial[];
  filters: {
    q: string;
    role: string;
    status: string;
    sort: string;
  };
};

export function TestimonialsManager({ initialItems, filters }: Props) {
  const [editing, setEditing] = useState<AdminTestimonial | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminTestimonial | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const router = useRouter();

  async function updateOne(id: string, payload: Partial<AdminTestimonial>) {
    const res = await fetch(`/api/testimonials/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (res.ok && json.success) {
      router.refresh();
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
        setDeleteTarget(null);
        router.refresh();
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
      <form method="get" className="mb-4 grid gap-3 rounded-xl border border-sage-border bg-white p-4 md:grid-cols-12">
        <div className="relative md:col-span-5">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sage-gray-400" />
          <input name="q" defaultValue={filters.q} placeholder="Search names, classes, or reviews..." className="h-10 w-full rounded-lg border border-sage-border pl-9 pr-3 text-sm outline-none focus:border-sage-primary" />
        </div>
        <select name="role" defaultValue={filters.role} className="h-10 rounded-lg border border-sage-border px-3 text-sm md:col-span-2">
          <option value="">All roles</option>
          <option value="student">Student</option>
          <option value="guardian">Guardian</option>
        </select>
        <select name="status" defaultValue={filters.status} className="h-10 rounded-lg border border-sage-border px-3 text-sm md:col-span-2">
          <option value="">All statuses</option>
          <option value="published">Published</option>
          <option value="unpublished">Unpublished</option>
        </select>
        <select name="sort" defaultValue={filters.sort} className="h-10 rounded-lg border border-sage-border px-3 text-sm md:col-span-1">
          <option value="order">Order</option>
          <option value="newest">Newest</option>
          <option value="name">Name</option>
          <option value="rating">Rating</option>
        </select>
        <button type="submit" className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-sage-primary px-3 text-sm font-bold text-white md:col-span-2">
          <Filter className="h-4 w-4" />
          Apply
        </button>
      </form>

      <div className="mb-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-sage-border bg-white p-4">
          <div>
            <h3 className="text-lg font-bold text-sage-secondary">Testimonial management</h3>
            <p className="mt-1 text-sm text-sage-gray-500">
              Add or update feedback from students and guardians.
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
            {creating ? "Close form" : "New testimonial"}
          </button>
        </div>
      </div>

      {creating && (
        <TestimonialFormPanel
          mode="create"
          onCancel={() => setCreating(false)}
          onSaved={() => {
            setCreating(false);
            router.refresh();
          }}
        />
      )}

      {editing && (
        <TestimonialFormPanel
          mode="edit"
          initial={editing}
          onCancel={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            router.refresh();
          }}
        />
      )}

      {initialItems.length === 0 ? (
        <div className="rounded-xl border border-sage-border bg-white p-6 text-sm text-sage-gray-700">
          No testimonials found. Select “New testimonial” to add one.
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {initialItems.map((item) => (
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
