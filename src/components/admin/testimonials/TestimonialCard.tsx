"use client";

import type { AdminTestimonial } from "@/components/admin/testimonials/types";

type Props = {
  item: AdminTestimonial;
  onEdit: (item: AdminTestimonial) => void;
  onDelete: (item: AdminTestimonial) => void;
  onTogglePublish: (item: AdminTestimonial, next: boolean) => void;
};

export function TestimonialCard({ item, onEdit, onDelete, onTogglePublish }: Props) {
  return (
    <article className="rounded-xl border border-sage-border bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <img
            src={item.image?.trim() || "/images/testimonials/placeholder.svg"}
            alt={item.name}
            className="h-12 w-12 rounded-full object-cover ring-1 ring-sage-border"
            loading="lazy"
          />
          <div>
            <h3 className="text-lg font-bold text-sage-secondary">{item.name}</h3>
            <p className="text-sm text-sage-gray-500">{item.className}</p>
          </div>
        </div>
        <span className="rounded-full bg-sage-red-50 px-3 py-1 text-xs font-bold text-sage-primary">
          {item.rating}/5
        </span>
      </div>
      <p className="mt-4 line-clamp-3 text-sm leading-6 text-sage-gray-700">{item.review}</p>
      <div className="mt-4 flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input
            type="checkbox"
            checked={item.isFeatured}
            onChange={(e) => onTogglePublish(item, e.target.checked)}
          />
          Published
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onEdit(item)}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-sage-red-50 text-sage-primary transition hover:bg-sage-primary hover:text-white"
            title="এডিট"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button
            type="button"
            onClick={() => onDelete(item)}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600 transition hover:bg-red-600 hover:text-white"
            title="মুছে ফেলুন"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
          </button>
        </div>
      </div>
    </article>
  );
}
