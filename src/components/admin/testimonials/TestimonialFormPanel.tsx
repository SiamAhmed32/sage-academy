"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Camera, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createTestimonialSchema } from "@/schemas/testimonial";
import type { AdminTestimonial, TestimonialFormValues } from "@/components/admin/testimonials/types";

type Props = {
  mode: "create" | "edit";
  initial?: AdminTestimonial | null;
  onCancel: () => void;
  onSaved: (item: AdminTestimonial, mode: "create" | "edit") => void;
};

export function TestimonialFormPanel({ mode, initial, onCancel, onSaved }: Props) {
  const defaults = useMemo<TestimonialFormValues>(
    () => ({
      name: initial?.name ?? "",
      role: initial?.role ?? "student",
      className: initial?.className ?? "",
      review: initial?.review ?? "",
      rating: initial?.rating ?? 5,
      image: initial?.image ?? "",
      isFeatured: initial?.isFeatured ?? true,
      order: initial?.order ?? 0,
    }),
    [initial]
  );
  const [form, setForm] = useState(defaults);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const resetTimer = window.setTimeout(() => {
      setForm(defaults);
      setSelectedFile(null);
      setPreviewUrl(initial?.image ?? "");
      setError("");
    }, 0);

    return () => window.clearTimeout(resetTimer);
  }, [defaults, initial?.image]);

  useEffect(() => {
    return () => {
      if (previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const parsed = createTestimonialSchema.safeParse(form);
    if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? "Validation failed");
    setSaving(true);
    setError("");
    try {
      const url = mode === "create" ? "/api/testimonials" : `/api/testimonials/${initial?._id}`;
      const payload = new FormData();
      payload.append("name", parsed.data.name);
      payload.append("role", parsed.data.role);
      payload.append("className", parsed.data.className);
      payload.append("review", parsed.data.review);
      payload.append("rating", String(parsed.data.rating));
      payload.append("image", initial?.image ?? "");
      payload.append("isFeatured", String(parsed.data.isFeatured));
      payload.append("order", String(parsed.data.order));
      if (selectedFile) payload.append("imageFile", selectedFile);

      const res = await fetch(url, { method: mode === "create" ? "POST" : "PATCH", body: payload });
      const contentType = res.headers.get("content-type") ?? "";
      const json = contentType.includes("application/json")
        ? await res.json()
        : { success: false, message: "Server returned an unexpected response" };
      if (!res.ok || !json.success) return setError(json.message ?? "Operation failed");
      onSaved(json.data as AdminTestimonial, mode);
    } catch {
      setError("Save failed. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="mb-4 rounded-xl border border-sage-border bg-white p-4">
      <p className="mb-3 text-sm font-bold text-sage-secondary">
        {mode === "create" ? "নতুন টেস্টিমোনিয়াল তৈরি করুন" : "টেস্টিমোনিয়াল এডিট করুন"}
      </p>
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <Label>
            নাম <span className="text-destructive">*</span>
          </Label>
          <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <Label>
            ক্লাস <span className="text-destructive">*</span>
          </Label>
          <Input
            required
            value={form.className}
            onChange={(e) => setForm({ ...form, className: e.target.value })}
          />
        </div>
        <div>
          <Label>
            রোল <span className="text-destructive">*</span>
          </Label>
          <select
            required
            className="h-10 w-full rounded-lg border px-3"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value as "student" | "guardian" })}
          >
            <option value="student">Student</option>
            <option value="guardian">Guardian</option>
          </select>
        </div>
        <div>
          <Label>
            রেটিং <span className="text-destructive">*</span>
          </Label>
          <Input
            required
            type="number"
            min={1}
            max={5}
            value={form.rating}
            onChange={(e) => setForm({ ...form, rating: Number(e.target.value) || 5 })}
          />
        </div>
        <div><Label>অর্ডার</Label><Input type="number" min={0} value={form.order} onChange={(e) => setForm({ ...form, order: Number(e.target.value) || 0 })} /></div>
        <div className="md:col-span-2">
          <Label>
            রিভিউ <span className="text-destructive">*</span>
          </Label>
          <Textarea
            required
            className="min-h-24"
            value={form.review}
            onChange={(e) => setForm({ ...form, review: e.target.value })}
          />
        </div>
        <div className="md:col-span-2 space-y-4">
          <Label className="text-sm font-bold text-sage-secondary">ইমেজ ফাইল আপলোড</Label>
          
          <div className="flex flex-col items-start gap-6">
            {/* Preview with Close Button */}
            {previewUrl && (
              <div className="relative h-32 w-32 overflow-hidden rounded-xl border-2 border-sage-primary shadow-lg animate-in fade-in zoom-in duration-300">
                <img
                  src={previewUrl}
                  alt="Testimonial preview"
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewUrl(initial?.image ?? "");
                    const input = document.getElementById("testimonial-image-input") as HTMLInputElement;
                    if (input) input.value = "";
                  }}
                  className="absolute right-1 top-1 rounded-full bg-red-500 p-1 text-white shadow-md hover:bg-red-600 transition"
                >
                  <X size={12} />
                </button>
              </div>
            )}

            {/* Custom Upload Button */}
            <div className="relative">
              <input
                id="testimonial-image-input"
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                className="absolute inset-0 z-10 cursor-pointer opacity-0"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  setSelectedFile(file);
                  if (!file) return setPreviewUrl(initial?.image ?? "");
                  setPreviewUrl(URL.createObjectURL(file));
                }}
              />
              <div className="flex items-center gap-3 rounded-xl border-2 border-dashed border-sage-border bg-sage-red-50/30 px-6 py-3 transition hover:border-sage-primary hover:bg-sage-red-50/50">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-sage-primary shadow-sm">
                  <Camera size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold text-sage-secondary">ছবি আপলোড করুন</p>
                  <p className="text-[10px] text-sage-gray-500">JPG, PNG, WEBP (Max 5MB)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <label className="mt-3 flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} /> Published</label>
      {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
      <div className="mt-3 flex justify-end gap-2"><Button type="button" variant="outline" onClick={onCancel}>Cancel</Button><Button type="submit" className="bg-sage-primary text-white hover:bg-sage-primary-hover" disabled={saving}>{saving ? "Saving..." : mode === "create" ? "Create" : "Update"}</Button></div>
    </form>
  );
}
