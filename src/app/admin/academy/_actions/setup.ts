"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { BATCH_GENDERS, VERSIONS, WEEK_DAYS } from "@/lib/academy/constants";
import { addMonths, currentMonthKey, dhakaParts, formatBatchCode, isTime, monthLabel, timeToMinutes } from "@/lib/academy/codes";
import { peekBatchSequence, reserveBatchSequence } from "@/lib/academy/batch-sequence";
import { feeEntryForMonth, type FeeEntry } from "@/lib/academy/fees";
import { allActiveSlots, batchStudentCounts, getBatchDetail, teacherTeaching } from "@/lib/academy/queries";
import { externalClashes, internalOverlaps, type ClashSlot } from "@/lib/academy/routine";
import { AcademyError, logActivity, requireObjectId, runAction, withTransaction } from "@/lib/academy/server";
import AcademyBatch from "@/models/academy/AcademyBatch";
import AcademyClass from "@/models/academy/AcademyClass";
import AcademyEnrollment from "@/models/academy/AcademyEnrollment";
import AcademySubject from "@/models/academy/AcademySubject";
import Teacher from "@/models/Teacher";

function refresh() {
  revalidatePath("/admin", "layout");
}

const money = z.coerce.number().min(0, "Fees cannot be negative.").max(1_000_000, "That fee is too large.");

// ───────────── Classes ─────────────

const classSchema = z.object({
  id: z.string().optional(),
  level: z.coerce.number().int().min(1, "Class must be between 1 and 12.").max(12, "Class must be between 1 and 12."),
  name: z.string().trim().max(40).optional(),
});

export async function saveClassAction(input: z.input<typeof classSchema>) {
  return runAction("admin", async (actor) => {
    const data = classSchema.parse(input);
    const name = data.name || `Class ${data.level}`;
    const clash = await AcademyClass.findOne({ level: data.level, ...(data.id ? { _id: { $ne: data.id } } : {}) }).lean();
    if (clash) throw new AcademyError(`Class ${data.level} already exists.`);

    if (data.id) {
      requireObjectId(data.id, "class");
      const existing = await AcademyClass.findById(data.id);
      if (!existing) throw new AcademyError("That class no longer exists.");
      if (existing.level !== data.level) {
        const used = await AcademyBatch.exists({ classId: existing._id });
        if (used) throw new AcademyError("This class already has batches, so its level cannot change. You can still rename it.");
      }
      existing.set({ level: data.level, name });
      await existing.save();
      await logActivity({ action: "class.updated", message: `Updated ${name}.` }, actor);
    } else {
      await AcademyClass.create({ level: data.level, name });
      await logActivity({ action: "class.created", message: `Created ${name}.` }, actor);
    }
    refresh();
    return { ok: true, message: data.id ? "Class updated." : `${name} created.` };
  });
}

export async function setClassArchivedAction(id: string, archived: boolean) {
  return runAction("admin", async (actor) => {
    requireObjectId(id, "class");
    if (archived) {
      const activeBatch = await AcademyBatch.exists({ classId: id, status: "active" });
      if (activeBatch) throw new AcademyError("Archive this class's active batches first.");
    }
    const updated = await AcademyClass.findByIdAndUpdate(id, { isArchived: archived }, { new: true }).lean();
    if (!updated) throw new AcademyError("That class no longer exists.");
    await logActivity({ action: archived ? "class.archived" : "class.restored", message: `${archived ? "Archived" : "Restored"} ${updated.name}.` }, actor);
    refresh();
    return { ok: true, message: archived ? "Class archived." : "Class restored." };
  });
}

// ───────────── Subjects ─────────────

const subjectSchema = z.object({
  id: z.string().optional(),
  classId: z.string(),
  name: z.string().trim().min(1, "Enter the subject name.").max(60),
  code: z.string().trim().max(12).optional().default(""),
  bangla: money,
  english: money,
});

export async function saveSubjectAction(input: z.input<typeof subjectSchema>) {
  return runAction("admin", async (actor) => {
    const data = subjectSchema.parse(input);
    requireObjectId(data.classId, "class");
    const cls = await AcademyClass.findById(data.classId).lean();
    if (!cls) throw new AcademyError("Choose a class for this subject.");

    const duplicate = await AcademySubject.findOne({
      classId: data.classId,
      name: new RegExp(`^${data.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"),
      ...(data.id ? { _id: { $ne: data.id } } : {}),
    }).lean();
    if (duplicate) throw new AcademyError(`${cls.name} already has a subject called ${duplicate.name}.`);

    const month = currentMonthKey();

    if (!data.id) {
      await AcademySubject.create({
        classId: data.classId,
        name: data.name,
        code: data.code,
        fees: [{ effectiveFrom: "2000-01", bangla: data.bangla, english: data.english, setBy: actor, setAt: new Date() }],
      });
      await logActivity(
        { action: "subject.created", message: `Created ${data.name} (${cls.name}) — Bangla ৳${data.bangla}, English ৳${data.english}.` }, // admin-language-allow
        actor
      );
      refresh();
      return { ok: true, message: `${data.name} added to ${cls.name}.` };
    }

    requireObjectId(data.id, "subject");
    const subject = await AcademySubject.findById(data.id);
    if (!subject) throw new AcademyError("That subject no longer exists.");
    if (String(subject.classId) !== data.classId) {
      throw new AcademyError("A subject cannot move to another class. Create it in the other class instead.");
    }

    subject.set({ name: data.name, code: data.code });

    const fees = (subject.fees ?? []) as unknown as FeeEntry[];
    // Compare with the newest entry, which may be a change already scheduled for next month.
    const latest = [...fees].sort((a, b) => a.effectiveFrom.localeCompare(b.effectiveFrom)).at(-1) ?? feeEntryForMonth(fees, month);
    const feeChanged = !latest || latest.bangla !== data.bangla || latest.english !== data.english;
    let message = "Subject updated.";

    if (feeChanged) {
      const inUse = await AcademyEnrollment.exists({ subjectId: subject._id });
      if (!inUse) {
        // Nobody has been billed for it yet, so the fee can be corrected right away.
        subject.set("fees", [{ effectiveFrom: "2000-01", bangla: data.bangla, english: data.english, setBy: actor, setAt: new Date() }]);
        message = "Fees updated. No students take this subject yet, so the new fees apply straight away.";
      } else {
        const nextMonth = addMonths(month, 1);
        const kept = fees.filter((entry) => entry.effectiveFrom <= month);
        subject.set("fees", [...kept, { effectiveFrom: nextMonth, bangla: data.bangla, english: data.english, setBy: actor, setAt: new Date() }]);
        message = `Fees saved. Current students pay the new fees from ${monthLabel(nextMonth)}; bills already created stay the same.`;
      }
      await logActivity(
        {
          action: "subject.fee",
          subjectId: String(subject._id),
          message: `Changed ${data.name} fees to Bangla ৳${data.bangla}, English ৳${data.english}.`, // admin-language-allow
        },
        actor
      );
    }

    await subject.save();
    refresh();
    return { ok: true, message };
  });
}

export async function cancelUpcomingFeeAction(subjectId: string) {
  return runAction("admin", async (actor) => {
    requireObjectId(subjectId, "subject");
    const subject = await AcademySubject.findById(subjectId);
    if (!subject) throw new AcademyError("That subject no longer exists.");
    const month = currentMonthKey();
    const fees = (subject.fees ?? []) as unknown as FeeEntry[];
    subject.set("fees", fees.filter((entry) => entry.effectiveFrom <= month));
    await subject.save();
    await logActivity({ action: "subject.fee", subjectId, message: `Cancelled the scheduled fee change for ${subject.name}.` }, actor);
    refresh();
    return { ok: true, message: "Scheduled fee change cancelled." };
  });
}

export async function setSubjectArchivedAction(id: string, archived: boolean) {
  return runAction("admin", async (actor) => {
    requireObjectId(id, "subject");
    if (archived) {
      const inBatch = await AcademyBatch.exists({ status: "active", "subjects.subjectId": id });
      if (inBatch) throw new AcademyError("This subject is still in an active batch. Remove it from those batches first.");
    }
    const subject = await AcademySubject.findByIdAndUpdate(id, { isArchived: archived }, { new: true }).lean();
    if (!subject) throw new AcademyError("That subject no longer exists.");
    await logActivity({ action: archived ? "subject.archived" : "subject.restored", subjectId: id, message: `${archived ? "Archived" : "Restored"} ${subject.name}.` }, actor);
    refresh();
    return { ok: true, message: archived ? "Subject archived." : "Subject restored." };
  });
}

// ───────────── Batches ─────────────

const slotSchema = z.object({
  subjectId: z.string(),
  day: z.enum(WEEK_DAYS),
  start: z.string().refine(isTime, "Enter a start time."),
  end: z.string().refine(isTime, "Enter an end time."),
  room: z.string().trim().max(20).optional().default(""),
});

const batchSchema = z.object({
  id: z.string().optional(),
  year: z.coerce.number().int().min(2024).max(2100).optional(),
  classId: z.string(),
  gender: z.enum(BATCH_GENDERS),
  version: z.enum(VERSIONS),
  capacity: z.coerce.number().int().min(1, "Batch size must be at least 1.").max(500),
  note: z.string().trim().max(300).optional().default(""),
  subjects: z
    .array(z.object({ subjectId: z.string(), teacherId: z.string().optional().default("") }))
    .min(1, "Choose at least one subject for this batch."),
  routine: z.array(slotSchema).default([]),
});

export type BatchInput = z.input<typeof batchSchema>;

export async function previewBatchCodeAction(input: { classId: string; gender: string; version: string }) {
  return runAction("staff", async () => {
    requireObjectId(input.classId, "class");
    const cls = await AcademyClass.findById(input.classId).lean();
    if (!cls) throw new AcademyError("Choose a class.");
    const gender = z.enum(BATCH_GENDERS).parse(input.gender);
    const version = z.enum(VERSIONS).parse(input.version);
    const key = { classId: input.classId, classLevel: cls.level, gender, version };
    const sequence = await peekBatchSequence(key);
    return { ok: true, message: "", data: { code: formatBatchCode({ ...key, sequence }), sequence } };
  });
}

/** Batches, subjects and weekly classes one teacher teaches (teacher side panel). */
export async function getTeacherTeachingAction(teacherId: string) {
  return runAction("staff", async () => {
    const teaching = await teacherTeaching();
    return { ok: true, message: "", data: teaching.get(teacherId) ?? { batches: [], weekly: 0 } };
  });
}

/** The batch's current details, for the edit drawer on the Batches list. */
export async function getBatchForEditAction(id: string) {
  return runAction("staff", async () => {
    requireObjectId(id, "batch");
    const batch = await getBatchDetail(id);
    if (!batch) throw new AcademyError("That batch no longer exists.");
    return {
      ok: true,
      message: "",
      data: {
        id: batch.id,
        code: batch.code,
        year: batch.year,
        classId: batch.classId,
        className: batch.className,
        classLevel: batch.classLevel,
        gender: batch.gender,
        version: batch.version,
        capacity: batch.capacity,
        note: batch.note,
        students: batch.students,
        subjects: batch.subjects.map((item) => ({ subjectId: item.subjectId, teacherId: item.teacherId })),
        routine: batch.routine,
      },
    };
  });
}

export async function saveBatchAction(input: BatchInput) {
  return runAction<{ id: string; code: string }>("admin", async (actor) => {
    const data = batchSchema.parse(input);
    requireObjectId(data.classId, "class");
    const cls = await AcademyClass.findById(data.classId).lean();
    if (!cls || cls.isArchived) throw new AcademyError("Choose an active class.");

    // Subjects must belong to this class.
    const subjectIds = [...new Set(data.subjects.map((item) => requireObjectId(item.subjectId, "subject")))];
    const subjects = await AcademySubject.find({ _id: { $in: subjectIds }, classId: data.classId }).lean();
    if (subjects.length !== subjectIds.length) throw new AcademyError("Every subject must belong to the selected class.");
    const subjectName = new Map(subjects.map((subject) => [String(subject._id), subject.name]));

    const teacherIds = data.subjects.map((item) => item.teacherId).filter(Boolean);
    const teachers = await Teacher.find({ _id: { $in: teacherIds } }).select("name").lean<{ _id: unknown; name: string }[]>();
    if (teachers.length !== new Set(teacherIds).size) throw new AcademyError("One of the chosen teachers no longer exists.");
    const teacherName = new Map(teachers.map((teacher) => [String(teacher._id), teacher.name]));
    const teacherFor = new Map(data.subjects.map((item) => [item.subjectId, item.teacherId || null]));

    // Routine checks.
    for (const slot of data.routine) {
      if (!subjectName.has(slot.subjectId)) throw new AcademyError("Every class in the routine must be one of this batch's subjects.");
      if (timeToMinutes(slot.end) <= timeToMinutes(slot.start)) {
        throw new AcademyError(`${subjectName.get(slot.subjectId)}: the end time must be after the start time.`);
      }
    }

    const existing = data.id ? await AcademyBatch.findById(requireObjectId(data.id, "batch")) : null;
    if (data.id && !existing) throw new AcademyError("That batch no longer exists.");

    const code = existing?.code ?? "(new batch)";
    const mine: ClashSlot[] = data.routine.map((slot) => ({
      ...slot,
      subjectName: subjectName.get(slot.subjectId) ?? "Subject",
      batchCode: code,
      teacherId: teacherFor.get(slot.subjectId) ?? null,
      teacherName: teacherName.get(teacherFor.get(slot.subjectId) ?? "") ?? "",
    }));
    const others = (await allActiveSlots()).filter((slot) => slot.batchId !== data.id);
    const problems = [...internalOverlaps(mine), ...externalClashes(mine, others)];
    if (problems.length > 0) {
      throw new AcademyError(`The routine has clashes:\n• ${problems.slice(0, 6).join("\n• ")}`);
    }

    if (existing) {
      // Code-defining fields never change; they are shown read-only in the form.
      const counts = await batchStudentCounts([existing._id]);
      const students = counts.get(String(existing._id)) ?? 0;
      if (data.capacity < students) {
        throw new AcademyError(`This batch already has ${students} students. The batch size cannot be lower than that.`);
      }
      const removed = existing.subjects
        .map((item) => String(item.subjectId))
        .filter((subjectId) => !subjectIds.includes(subjectId));
      if (removed.length > 0) {
        const taken = await AcademyEnrollment.find({ batchId: existing._id, subjectId: { $in: removed }, status: "active" })
          .distinct("subjectId");
        if (taken.length > 0) {
          const names = await AcademySubject.find({ _id: { $in: taken } }).distinct("name");
          throw new AcademyError(`Students still take ${names.join(", ")} in this batch. Transfer or drop them before removing the subject.`);
        }
      }
      existing.set({
        capacity: data.capacity,
        note: data.note,
        subjects: data.subjects.map((item) => ({ subjectId: item.subjectId, teacherId: item.teacherId || null })),
        routine: data.routine,
      });
      await existing.save();
      await logActivity({ action: "batch.updated", batchId: String(existing._id), message: `Updated batch ${existing.code}.` }, actor);
      refresh();
      return { ok: true, message: `Batch ${existing.code} saved.`, data: { id: String(existing._id), code: existing.code } };
    }

    const created = await withTransaction(async (session) => {
      const key = { classId: data.classId, classLevel: cls.level, gender: data.gender, version: data.version };
      const sequence = await reserveBatchSequence(key, session);
      const batchCode = formatBatchCode({ ...key, sequence });
      const [batch] = await AcademyBatch.create(
        [
          {
            code: batchCode,
            year: dhakaParts().year,
            classId: data.classId,
            classLevel: cls.level,
            gender: data.gender,
            version: data.version,
            sequence,
            capacity: data.capacity,
            note: data.note,
            subjects: data.subjects.map((item) => ({ subjectId: item.subjectId, teacherId: item.teacherId || null })),
            routine: data.routine,
          },
        ],
        { session }
      );
      await logActivity({ action: "batch.created", batchId: String(batch._id), message: `Created batch ${batchCode}.` }, actor, session);
      return { id: String(batch._id), code: batchCode };
    });

    refresh();
    return { ok: true, message: `Batch ${created.code} created.`, data: created };
  });
}

export async function setBatchStatusAction(id: string, status: "active" | "archived") {
  return runAction("admin", async (actor) => {
    requireObjectId(id, "batch");
    if (status === "archived") {
      const inUse = await AcademyEnrollment.exists({ batchId: id, status: "active" });
      if (inUse) throw new AcademyError("Students are still enrolled in this batch. Transfer or drop them first.");
    }
    const batch = await AcademyBatch.findByIdAndUpdate(id, { status }, { new: true }).lean();
    if (!batch) throw new AcademyError("That batch no longer exists.");
    await logActivity({ action: `batch.${status}`, batchId: id, message: `${status === "archived" ? "Archived" : "Restored"} batch ${batch.code}.` }, actor);
    refresh();
    return { ok: true, message: status === "archived" ? "Batch archived." : "Batch restored." };
  });
}

