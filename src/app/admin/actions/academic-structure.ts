"use server";

import { revalidatePath } from "next/cache";

import { connectDB } from "@/lib/mongodb";
import { requireRole, adminRoles } from "@/lib/rbac";
import { ConflictError, NotFoundError } from "@/lib/errors";
import Class from "@/models/Class";
import Subject from "@/models/Subject";
import BatchGroup from "@/models/BatchGroup";
import SubjectBatch from "@/models/SubjectBatch";
import {
  createClassSchema,
  createSubjectSchema,
  createBatchGroupSchema,
  createSubjectBatchSchema,
} from "@/schemas/academic-structure";
import { enrollStudentInSubjectBatches } from "@/lib/enrollment-service";
import { enrollStudentSchema } from "@/schemas/enrollment";

type ActionResult = { success: boolean; message?: string };

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function num(formData: FormData, key: string) {
  const value = Number(text(formData, key));
  return Number.isFinite(value) ? value : 0;
}

function errMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message;
  return fallback;
}

// Note: the actions below are wired directly to <form action={...}> (no
// useActionState), matching the rest of this codebase's simple CRUD actions
// (see createBatchAction / deleteStudentAction in admin/actions.ts) — that
// pattern requires a void return, so failures throw to the error boundary
// instead of being returned as a value.

/* ---------------------------------- Class --------------------------------- */

export async function createClassAction(formData: FormData): Promise<void> {
  await requireRole(adminRoles);
  await connectDB();

  const data = createClassSchema.parse({
    name: text(formData, "name"),
    orderIndex: num(formData, "orderIndex"),
    legacyClassLevel: num(formData, "legacyClassLevel"),
  });

  const existing = await Class.findOne({ name: data.name });
  if (existing) throw new ConflictError(`Class "${data.name}" already exists.`);

  await Class.create(data);
  revalidatePath("/admin/academic-structure/classes");
}

export async function deleteClassAction(formData: FormData): Promise<void> {
  await requireRole(adminRoles);
  await connectDB();
  const id = text(formData, "id");

  const inUse = await Subject.exists({ classId: id });
  if (inUse) throw new ConflictError("Cannot delete a class that still has subjects.");

  await Class.findByIdAndDelete(id);
  revalidatePath("/admin/academic-structure/classes");
}

/* --------------------------------- Subject --------------------------------- */

export async function createSubjectAction(formData: FormData): Promise<void> {
  await requireRole(adminRoles);
  await connectDB();

  const data = createSubjectSchema.parse({
    name: text(formData, "name"),
    code: text(formData, "code"),
    classId: text(formData, "classId"),
    baseMonthlyFee: num(formData, "baseMonthlyFee"),
  });

  const parentClass = await Class.findById(data.classId);
  if (!parentClass) throw new NotFoundError("Selected class not found");

  const existing = await Subject.findOne({ classId: data.classId, name: data.name });
  if (existing) throw new ConflictError(`Subject "${data.name}" already exists for ${parentClass.name}.`);

  await Subject.create(data);
  revalidatePath("/admin/academic-structure/subjects");
}

export async function deleteSubjectAction(formData: FormData): Promise<void> {
  await requireRole(adminRoles);
  await connectDB();
  const id = text(formData, "id");

  const inUse = await SubjectBatch.exists({ subjectId: id });
  if (inUse) throw new ConflictError("Cannot delete a subject that already has batch slots.");

  await Subject.findByIdAndDelete(id);
  revalidatePath("/admin/academic-structure/subjects");
}

/* ------------------------------- BatchGroup -------------------------------- */

export async function createBatchGroupAction(formData: FormData): Promise<void> {
  await requireRole(adminRoles);
  await connectDB();

  const data = createBatchGroupSchema.parse({
    name: text(formData, "name"),
    classId: text(formData, "classId"),
    gender: text(formData, "gender"),
    medium: text(formData, "medium"),
    batchNumber: num(formData, "batchNumber") || 1,
    subjectBatches: [],
  });

  const parentClass = await Class.findById(data.classId);
  if (!parentClass) throw new NotFoundError("Selected class not found");

  const existing = await BatchGroup.findOne({
    classId: data.classId,
    gender: data.gender,
    medium: data.medium,
    batchNumber: data.batchNumber,
  });
  if (existing) {
    throw new ConflictError(
      `A batch group with this class, gender, medium and batch number already exists (${existing.name}).`
    );
  }

  await BatchGroup.create({
    name: data.name,
    classId: data.classId,
    gender: data.gender,
    medium: data.medium,
    batchNumber: data.batchNumber,
  });

  revalidatePath("/admin/academic-structure/batch-groups");
}

export async function addSubjectBatchAction(formData: FormData): Promise<void> {
  await requireRole(adminRoles);
  await connectDB();

  const batchGroupId = text(formData, "batchGroupId");

  const data = createSubjectBatchSchema.parse({
    batchGroupId,
    subjectId: text(formData, "subjectId"),
    teacherId: text(formData, "teacherId"),
    maxSeats: num(formData, "maxSeats") || 30,
    monthlyFee: text(formData, "monthlyFee") ? num(formData, "monthlyFee") : undefined,
  });

  const group = await BatchGroup.findById(batchGroupId);
  if (!group) throw new NotFoundError("Batch group not found");

  const subject = await Subject.findById(data.subjectId);
  if (!subject) throw new NotFoundError("Subject not found");

  await SubjectBatch.create({
    batchGroupId,
    subjectId: data.subjectId,
    teacherId: data.teacherId || null,
    maxSeats: data.maxSeats,
    monthlyFee: data.monthlyFee ?? subject.baseMonthlyFee,
  });

  revalidatePath(`/admin/academic-structure/batch-groups/${batchGroupId}`);
}

/* -------------------------------- Enrollment -------------------------------- */

export async function enrollStudentAction(formData: FormData): Promise<ActionResult & { details?: string[] }> {
  try {
    await requireRole(adminRoles);
    await connectDB();

    const studentId = text(formData, "studentId");
    const subjectBatchIds = formData.getAll("subjectBatchIds").map((v) => String(v)).filter(Boolean);

    const data = enrollStudentSchema.parse({ studentId, subjectBatchIds });

    const results = await enrollStudentInSubjectBatches(data.studentId, data.subjectBatchIds);

    revalidatePath("/admin/academic-structure/enroll");
    return {
      success: true,
      details: results.map((r) => r.message),
    };
  } catch (error) {
    return { success: false, message: errMessage(error, "Failed to enroll student") };
  }
}
