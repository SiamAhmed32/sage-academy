import type { ClientSession, Types } from "mongoose";

import { ConflictError, NotFoundError } from "@/lib/errors";
import Enrollment from "@/models/Enrollment";
import SubjectBatch from "@/models/SubjectBatch";
import Student from "@/models/Student";

type SubjectBatchSlot = {
  _id: Types.ObjectId;
  batchGroupId: Types.ObjectId;
  subjectId: Types.ObjectId;
  teacherId: Types.ObjectId | null;
  maxSeats: number;
  monthlyFee: number;
};

export type EnrollmentResult = {
  subjectBatchId: string;
  status: "enrolled" | "rolled_over" | "already_enrolled";
  /** The slot the student actually ended up in (may differ from the one requested,
   *  if a rollover to another section happened). */
  finalSubjectBatchId: string;
  /** The created (or pre-existing) Enrollment document's id, when one exists. */
  enrollmentId: string | null;
  message: string;
};

/** How many ACTIVE enrollments currently sit in a given SubjectBatch slot. */
export async function getActiveSeatCount(subjectBatchId: string, session?: ClientSession) {
  return Enrollment.countDocuments({
    subjectBatchId,
    status: "ACTIVE",
  }).session(session ?? null);
}

/**
 * Finds (or creates) the next open section for the same subject + batch group
 * profile once the requested slot is full — e.g. "Physics Batch 1" is full,
 * so the student rolls into "Physics Batch 2", creating it if it doesn't
 * exist yet (mirroring the original slot's teacher/fee/seat cap).
 */
async function findOrCreateRolloverSlot(fullSlot: SubjectBatchSlot, session?: ClientSession) {
  // Look for a sibling SubjectBatch: same batchGroup + same subject, not the
  // full one, that still has room — ordered by creation (i.e. "Batch 2" before "Batch 3").
  const siblings = await SubjectBatch.find({
    batchGroupId: fullSlot.batchGroupId,
    subjectId: fullSlot.subjectId,
    _id: { $ne: fullSlot._id },
    isActive: true,
  })
    .sort({ createdAt: 1 })
    .session(session ?? null);

  for (const sibling of siblings) {
    const seats = await getActiveSeatCount(sibling._id.toString(), session);
    if (seats < sibling.maxSeats) {
      return { slot: sibling, created: false };
    }
  }

  // No open sibling — spin up a fresh overflow slot cloned from the full one.
  const [overflow] = await SubjectBatch.create(
    [
      {
        batchGroupId: fullSlot.batchGroupId,
        subjectId: fullSlot.subjectId,
        teacherId: fullSlot.teacherId,
        maxSeats: fullSlot.maxSeats,
        monthlyFee: fullSlot.monthlyFee,
        isActive: true,
      },
    ],
    { session }
  );

  return { slot: overflow, created: true };
}

/**
 * Enrolls a single student into a single SubjectBatch slot.
 *
 * Business rule (seat saturation + auto-rollover):
 *   1. If the student is already ACTIVE in this exact slot → no-op, report it.
 *   2. If the slot has room (currentActiveEnrollments < maxSeats) → enroll here.
 *   3. If the slot is full → automatically find/create the next available
 *      section for the same subject in the same batch group and enroll there
 *      instead, so the caller never has to retry manually.
 */
export async function enrollStudentInSubjectBatch(
  studentId: string,
  subjectBatchId: string,
  session?: ClientSession
): Promise<EnrollmentResult> {
  const slot = await SubjectBatch.findById(subjectBatchId).session(session ?? null);
  if (!slot || !slot.isActive) {
    throw new NotFoundError("Subject batch slot not found");
  }

  const existing = await Enrollment.findOne({
    studentId,
    subjectBatchId,
    status: "ACTIVE",
  }).session(session ?? null);
  if (existing) {
    return {
      subjectBatchId,
      finalSubjectBatchId: subjectBatchId,
      enrollmentId: existing._id.toString(),
      status: "already_enrolled",
      message: "Student is already enrolled in this subject batch.",
    };
  }

  const seatsUsed = await getActiveSeatCount(subjectBatchId, session);

  if (seatsUsed < slot.maxSeats) {
    const [created] = await Enrollment.create(
      [{ studentId, subjectBatchId, status: "ACTIVE" }],
      { session }
    );
    return {
      subjectBatchId,
      finalSubjectBatchId: subjectBatchId,
      enrollmentId: created._id.toString(),
      status: "enrolled",
      message: "Enrolled successfully.",
    };
  }

  // Slot saturated → roll over to (or create) the next section.
  const { slot: rolloverSlot, created } = await findOrCreateRolloverSlot(slot, session);

  // A student can't hold two enrollments for the same subject in the same
  // batch group, so guard against a duplicate on the rollover target too.
  const dupOnRollover = await Enrollment.findOne({
    studentId,
    subjectBatchId: rolloverSlot._id,
    status: "ACTIVE",
  }).session(session ?? null);
  if (dupOnRollover) {
    return {
      subjectBatchId,
      finalSubjectBatchId: rolloverSlot._id.toString(),
      enrollmentId: dupOnRollover._id.toString(),
      status: "already_enrolled",
      message: "Requested batch was full; student is already enrolled in the rollover section.",
    };
  }

  const [rolledEnrollment] = await Enrollment.create(
    [{ studentId, subjectBatchId: rolloverSlot._id, status: "ACTIVE" }],
    { session }
  );

  return {
    subjectBatchId,
    finalSubjectBatchId: rolloverSlot._id.toString(),
    enrollmentId: rolledEnrollment._id.toString(),
    status: "rolled_over",
    message: created
      ? "Requested batch was full; a new section was created and the student was enrolled there."
      : "Requested batch was full; the student was enrolled in the next available section.",
  };
}

/**
 * Enrolls a student into several SubjectBatch slots at once
 * (e.g. Math + Science, skipping English).
 * Each slot is evaluated independently — one full slot rolling the student
 * over does not affect enrollment into the other requested slots.
 */
export async function enrollStudentInSubjectBatches(
  studentId: string,
  subjectBatchIds: string[],
  session?: ClientSession
): Promise<EnrollmentResult[]> {
  const student = await Student.findById(studentId).select("_id").session(session ?? null);
  if (!student) {
    throw new NotFoundError("Student not found");
  }

  const results: EnrollmentResult[] = [];
  for (const subjectBatchId of subjectBatchIds) {
    // Sequential on purpose: seat counts must be checked and written one at a
    // time to avoid two near-simultaneous requests both reading "29/30 open".
    const result = await enrollStudentInSubjectBatch(studentId, subjectBatchId, session);
    results.push(result);
  }
  return results;
}

/** Marks an enrollment as dropped, freeing up its seat. */
export async function dropEnrollment(enrollmentId: string) {
  const enrollment = await Enrollment.findById(enrollmentId);
  if (!enrollment) {
    throw new NotFoundError("Enrollment not found");
  }
  if (enrollment.status !== "ACTIVE") {
    throw new ConflictError("Enrollment is not active");
  }
  enrollment.status = "DROPPED";
  enrollment.droppedAt = new Date();
  await enrollment.save();
  return enrollment;
}

/**
 * Moves a student from their current SubjectBatch slot to a different one
 * (Screen 3 — "Transfer Subject Batch"). Unlike enrollment, a transfer never
 * silently rolls over: if the target is full the admin sees a clear
 * conflict and must pick another section themselves.
 */
export async function transferEnrollment(enrollmentId: string, newSubjectBatchId: string) {
  const enrollment = await Enrollment.findById(enrollmentId);
  if (!enrollment) throw new NotFoundError("Enrollment not found");
  if (enrollment.status !== "ACTIVE") {
    throw new ConflictError("Only an active enrollment can be transferred");
  }

  if (String(enrollment.subjectBatchId) === String(newSubjectBatchId)) {
    throw new ConflictError("Student is already in that batch");
  }

  const targetSlot = await SubjectBatch.findById(newSubjectBatchId);
  if (!targetSlot || !targetSlot.isActive) {
    throw new NotFoundError("Target subject batch not found");
  }

  const dup = await Enrollment.findOne({
    studentId: enrollment.studentId,
    subjectBatchId: newSubjectBatchId,
    status: "ACTIVE",
  });
  if (dup) {
    throw new ConflictError("Student already has an active enrollment in the target batch");
  }

  const seatsUsed = await getActiveSeatCount(newSubjectBatchId);
  if (seatsUsed >= targetSlot.maxSeats) {
    throw new ConflictError(`Target batch is full (${seatsUsed}/${targetSlot.maxSeats} seats).`);
  }

  enrollment.subjectBatchId = targetSlot._id;
  await enrollment.save();
  return enrollment;
}
