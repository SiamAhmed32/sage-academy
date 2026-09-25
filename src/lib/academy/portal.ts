import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Types } from "mongoose";

import { getCurrentAuthUser } from "@/lib/auth-session";
import type { AuthUser } from "@/lib/auth";
import { normalizeBangladeshPhone } from "@/lib/bd-phone";
import { getStudentDetail, type StudentDetail } from "@/lib/academy/queries";
import { connectDB } from "@/lib/mongodb";
import AcademyBatch from "@/models/academy/AcademyBatch";
import AcademyClass from "@/models/academy/AcademyClass";
import AcademyEnrollment from "@/models/academy/AcademyEnrollment";
import AcademyStudent from "@/models/academy/AcademyStudent";
import Notice from "@/models/Notice";
import Student from "@/models/Student";

export const PORTAL_CHILD_COOKIE = "sage_portal_child";
const staffRoles = ["manager", "admin", "super_admin"];

export type PortalChild = { id: string; studentId: string; name: string; className: string; status: string };

export type PortalContext =
  | { user: AuthUser; problem: "missing-phone" | "not-found" | "legacy-only" }
  | { user: AuthUser; child: PortalChild; children: PortalChild[] };

/** Every way a Bangladeshi number may have been typed (01…, +8801…, 8801…). */
export function phoneCandidates(phone: string | undefined | null) {
  const raw = (phone ?? "").trim();
  if (!raw) return [];
  const local = normalizeBangladeshPhone(raw);
  const digits = local.replace(/\D/g, "");
  const set = new Set([raw, local]);
  if (/^01\d{9}$/.test(digits)) {
    set.add(digits);
    set.add(`+88${digits}`);
    set.add(`88${digits}`);
  }
  return [...set].filter(Boolean);
}

/**
 * The students this login may see: every academy student whose own,
 * WhatsApp or guardian phone matches the account phone. Guardians with
 * several children pick one with the switcher (stored in a cookie).
 */
export const getPortalContext = cache(async (): Promise<PortalContext> => {
  const user = await getCurrentAuthUser();
  if (!user) redirect("/login");
  if (staffRoles.includes(user.role)) redirect("/admin");

  await connectDB();
  const candidates = phoneCandidates(user.phone);
  if (candidates.length === 0) return { user, problem: "missing-phone" };

  const students = await AcademyStudent.find({
    $or: [{ phone: { $in: candidates } }, { whatsapp: { $in: candidates } }, { guardianPhone: { $in: candidates } }],
  })
    .sort({ status: 1, createdAt: -1 })
    .select("studentId name classId status")
    .limit(10)
    .lean<{ _id: Types.ObjectId; studentId: string; name: string; classId: Types.ObjectId; status: string }[]>();

  if (students.length === 0) {
    const legacy = await Student.exists({
      isActive: true,
      $or: [{ phone: { $in: candidates } }, { whatsapp: { $in: candidates } }, { guardianPhone: { $in: candidates } }],
    });
    return { user, problem: legacy ? "legacy-only" : "not-found" };
  }

  const classes = await AcademyClass.find({ _id: { $in: students.map((student) => student.classId) } })
    .select("name")
    .lean<{ _id: Types.ObjectId; name: string }[]>();
  const className = new Map(classes.map((item) => [String(item._id), item.name]));
  const children: PortalChild[] = students.map((student) => ({
    id: String(student._id),
    studentId: student.studentId,
    name: student.name,
    className: className.get(String(student.classId)) ?? "",
    status: student.status,
  }));

  const chosen = (await cookies()).get(PORTAL_CHILD_COOKIE)?.value;
  const child = children.find((item) => item.id === chosen) ?? children.find((item) => item.status === "active") ?? children[0];
  return { user, child, children };
});

/** The selected child's full record, or null when the account has no match. */
export const getPortalStudent = cache(async (): Promise<{ ctx: PortalContext; detail: StudentDetail | null }> => {
  const ctx = await getPortalContext();
  if ("problem" in ctx) return { ctx, detail: null };
  return { ctx, detail: await getStudentDetail(ctx.child.id) };
});

export type PortalNotice = {
  id: string;
  title: string;
  type: string;
  topic: string;
  details: string;
  examDate: string;
  publishedAt: string;
  target: string;
};

/** Published notices for everyone, the student's class, or any batch they study in. */
export async function getPortalNotices(detail: StudentDetail, limit = 30): Promise<PortalNotice[]> {
  await connectDB();
  const enrollments = await AcademyEnrollment.find({ studentId: detail.student.id, status: "active" }).select("batchId").lean();
  const batchIds = [...new Set([detail.student.homeBatchId, ...enrollments.map((row) => String(row.batchId))])].filter((id) =>
    Types.ObjectId.isValid(id)
  );
  const notices = await Notice.find({
    isPublished: true,
    $or: [
      { audience: "all" },
      { audience: "class", classLevel: detail.student.classLevel },
      { audience: "batch", batch: { $in: batchIds } },
    ],
  })
    .sort({ publishedAt: -1 })
    .limit(limit)
    .lean<{ _id: Types.ObjectId; title: string; type: string; topic?: string; details?: string; examDate?: Date | null; publishedAt?: Date; audience: string; batch?: Types.ObjectId | null }[]>();

  const batches = await AcademyBatch.find({ _id: { $in: notices.map((notice) => notice.batch).filter(Boolean) } })
    .select("code")
    .lean<{ _id: Types.ObjectId; code: string }[]>();
  const code = new Map(batches.map((batch) => [String(batch._id), batch.code]));

  return notices.map((notice) => ({
    id: String(notice._id),
    title: notice.title,
    type: notice.type,
    topic: notice.topic ?? "",
    details: notice.details ?? "",
    examDate: notice.examDate ? new Date(notice.examDate).toISOString() : "",
    publishedAt: notice.publishedAt ? new Date(notice.publishedAt).toISOString() : "",
    target: notice.audience === "batch" ? code.get(String(notice.batch)) ?? "" : notice.audience === "class" ? detail.student.className : "",
  }));
}
