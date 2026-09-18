"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { TeacherFormFields } from "./TeacherFormFields";
import type { AdminTeacher, TeacherFormValues } from "@/components/admin/teachers/types";

interface TeacherFormProps {
  teacher?: AdminTeacher;
  onSuccess: () => void;
  onCancel: () => void;
}

export function TeacherForm({ teacher, onSuccess, onCancel }: TeacherFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState(teacher?.image || "");
  const isEdit = !!teacher;

  const [formData, setFormData] = useState<TeacherFormValues>({
    name: teacher?.name || "",
    subject: teacher?.subject || "",
    designation: teacher?.designation || "",
    experience: teacher?.experience || "",
    quote: teacher?.quote || "",
    image: teacher?.image || "",
    isFeatured: teacher?.isFeatured || false,
    order: teacher?.order || 0,
  });

  useEffect(() => {
    return () => {
      if (previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function handleImageFileChange(file: File | null) {
    setSelectedFile(file);
    if (!file) {
      setPreviewUrl(teacher?.image || "");
      return;
    }
    setPreviewUrl((prev) => {
      if (prev.startsWith("blob:")) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const url = teacher ? `/api/admin/teachers/${teacher._id.toString()}` : "/api/admin/teachers";
      const payload: TeacherFormValues = {
        ...formData,
        name: formData.name.trim(),
        subject: formData.subject.trim(),
        designation: formData.designation.trim(),
        experience: formData.experience.trim(),
        quote: formData.quote.trim(),
        image: formData.image.trim(),
        order: Number.isFinite(formData.order) ? Math.max(0, formData.order) : 0,
      };
      const body = new FormData();
      body.append("name", payload.name);
      body.append("subject", payload.subject);
      body.append("designation", payload.designation);
      body.append("experience", payload.experience);
      body.append("quote", payload.quote);
      body.append("image", payload.image);
      body.append("isFeatured", String(payload.isFeatured));
      body.append("order", String(payload.order));
      if (selectedFile) body.append("imageFile", selectedFile);
      const res = await fetch(url, {
        method: teacher ? "PUT" : "POST",
        body,
        credentials: "include",
      });
      const contentType = res.headers.get("content-type") ?? "";
      const json = contentType.includes("application/json") ? await res.json() : null;
      if (!res.ok || !json?.success) throw new Error(json?.message || "Something went wrong.");
      toast.success(isEdit ? "Teacher details updated." : "Teacher added successfully.");
      onSuccess();
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "A temporary error occurred.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this teacher?")) return;
    if (!teacher) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/teachers/${teacher._id.toString()}`, {
        method: "DELETE",
        credentials: "include",
      });
      const contentType = res.headers.get("content-type") ?? "";
      const json = contentType.includes("application/json") ? await res.json() : null;
      if (!res.ok || !json?.success) throw new Error(json?.message || "The teacher could not be deleted.");
      toast.success("Teacher deleted.");
      onSuccess();
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "A temporary error occurred.";
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <TeacherFormFields
        formData={formData}
        setFormData={setFormData}
        previewUrl={previewUrl}
        onImageFileChange={handleImageFileChange}
      />
      <div className="flex items-center justify-between pt-6 mt-6 border-t border-sage-border">
        {isEdit ? (
          <button type="button" onClick={handleDelete} disabled={isDeleting} className="text-sm font-bold text-red-500 hover:text-red-600 disabled:opacity-50 flex items-center gap-2">
            {isDeleting && <Loader2 size={16} className="animate-spin" />} Delete
          </button>
        ) : <div />}
        <div className="flex gap-4">
          <Button type="button" variant="outline" onClick={onCancel} className="h-11 px-6 font-bold rounded-xl border-sage-border">Cancel</Button>
          <Button disabled={loading} className="bg-sage-primary hover:bg-sage-primary-hover font-bold min-w-[140px] h-11 rounded-xl shadow-lg shadow-sage-red-100">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (isEdit ? "Update teacher" : "Add teacher")}
          </Button>
        </div>
      </div>
    </form>
  );
}
