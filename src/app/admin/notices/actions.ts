"use server";

import { revalidatePath } from "next/cache";

import { connectDB } from "@/lib/mongodb";
import { requireRole, staffRoles } from "@/lib/rbac";
import Notice from "@/models/Notice";
import { normalizeObjectId } from "@/lib/object-id";

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function numberOrNull(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function revalidateNoticePaths() {
  revalidatePath("/admin/notices");
  revalidatePath("/student");
  revalidatePath("/student/notices");
}

export async function createNoticeAction(formData: FormData) {
  const user = await requireRole(staffRoles);
  await connectDB();

  const classLevel = numberOrNull(text(formData, "classLevel"));
  const batch = text(formData, "batch");
  if (!classLevel || !batch) {
    throw new Error("শ্রেণি ও ব্যাচ নির্বাচন করতে হবে।");
  }

  const examDate = text(formData, "examDate");

  const batchId = normalizeObjectId(batch);
  if (!batchId) throw new Error("সঠিক ব্যাচ নির্বাচন করুন।");

  await Notice.create({
    title: text(formData, "title"),
    type: text(formData, "type") || "general",
    audience: "batch",
    classLevel,
    batch: batchId,
    topic: text(formData, "topic"),
    examDate: examDate ? new Date(examDate) : null,
    details: text(formData, "details"),
    isPublished: formData.get("isPublished") === "on",
    publishedAt: new Date(),
    createdBy: user.id,
  });

  revalidateNoticePaths();
}

export async function updateNoticeAction(formData: FormData) {
  const user = await requireRole(staffRoles);
  await connectDB();

  const id = text(formData, "id");
  const classLevel = numberOrNull(text(formData, "classLevel"));
  const batch = text(formData, "batch");
  if (!id || !classLevel || !batch) {
    throw new Error("শ্রেণি, ব্যাচ ও নোটিশ আইডি প্রয়োজন।");
  }

  const examDate = text(formData, "examDate");
  const isPublished = formData.get("isPublished") === "on";

  const batchId = normalizeObjectId(batch);
  if (!batchId) throw new Error("সঠিক ব্যাচ নির্বাচন করুন।");

  await Notice.findByIdAndUpdate(id, {
    title: text(formData, "title"),
    type: text(formData, "type") || "general",
    audience: "batch",
    classLevel,
    batch: batchId,
    student: null,
    topic: text(formData, "topic"),
    examDate: examDate ? new Date(examDate) : null,
    details: text(formData, "details"),
    isPublished,
    publishedAt: isPublished ? new Date() : undefined,
    createdBy: user.id,
  });

  revalidateNoticePaths();
}

export async function toggleNoticePublishAction(formData: FormData) {
  await requireRole(staffRoles);
  await connectDB();

  const isPublished = formData.get("isPublished") === "on";
  await Notice.findByIdAndUpdate(text(formData, "id"), {
    isPublished,
    ...(isPublished ? { publishedAt: new Date() } : {}),
  });

  revalidateNoticePaths();
}

export async function deleteNoticeAction(formData: FormData) {
  await requireRole(staffRoles);
  await connectDB();

  const id = text(formData, "id");
  if (!id) throw new Error("নোটিশ আইডি পাওয়া যায়নি।");

  await Notice.findByIdAndDelete(id);
  revalidateNoticePaths();
}
