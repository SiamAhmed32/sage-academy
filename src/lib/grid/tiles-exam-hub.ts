import "server-only";

import { connectDB } from "@/lib/mongodb";
import { examProgramObjectId } from "@/lib/grid/sources/exam-hub";
import type { GridTile } from "@/components/admin/grid/GridTiles";
import ExamAttempt from "@/models/ExamAttempt";
import ExamEnrollment from "@/models/ExamEnrollment";
import ExamProgram from "@/models/ExamProgram";
import ExamQuestion from "@/models/ExamQuestion";

export type ExamHubTileKind = "programs" | "enrollments" | "attempts" | "questions";

/** Scope for program-filtered tiles: one program, or every program when none is chosen. */
function programScope(programId?: string) {
  const oid = examProgramObjectId(programId);
  return oid ? { programId: oid } : {};
}

export async function examProgramTiles(): Promise<GridTile[]> {
  await connectDB();
  const [all, online, offline, published, unpublished] = await Promise.all([
    ExamProgram.countDocuments({}),
    ExamProgram.countDocuments({ deliveryMode: "online" }),
    ExamProgram.countDocuments({ deliveryMode: "offline" }),
    ExamProgram.countDocuments({ status: "published" }),
    ExamProgram.countDocuments({ status: { $ne: "published" } }),
  ]);
  return [
    { key: "all", label: "All programs", value: all, icon: "layers", tone: "blue", preset: "" },
    { key: "online", label: "Online MCQ", value: online, icon: "book", tone: "brand", preset: "online" },
    { key: "offline", label: "Offline center", value: offline, icon: "calendar", tone: "purple", preset: "offline" },
    { key: "published", label: "Published", value: published, icon: "check", tone: "green", preset: "published", note: "Visible on the website" },
    { key: "unpublished", label: "Not published", value: unpublished, icon: "inactive", tone: "amber", preset: "unpublished", note: "Draft, hidden or archived" },
  ];
}

export async function examEnrollmentTiles(programId?: string): Promise<GridTile[]> {
  await connectDB();
  const scope = programScope(programId);
  const [all, review, confirmed, unpaid, cancelled] = await Promise.all([
    ExamEnrollment.countDocuments(scope),
    ExamEnrollment.countDocuments({ ...scope, paymentStatus: "submitted" }),
    ExamEnrollment.countDocuments({ ...scope, status: "confirmed" }),
    ExamEnrollment.countDocuments({ ...scope, paymentStatus: "pending" }),
    ExamEnrollment.countDocuments({ ...scope, status: "cancelled" }),
  ]);
  return [
    { key: "all", label: "All enrollments", value: all, icon: "users", tone: "blue", preset: "" },
    { key: "review", label: "Awaiting review", value: review, icon: "inbox", tone: "red", preset: "review", note: "Payment submitted" },
    { key: "confirmed", label: "Confirmed", value: confirmed, icon: "check", tone: "green", preset: "confirmed" },
    { key: "unpaid", label: "Payment pending", value: unpaid, icon: "wallet", tone: "amber", preset: "unpaid", note: "No payment submitted yet" },
    { key: "cancelled", label: "Cancelled", value: cancelled, icon: "inactive", tone: "zinc", preset: "cancelled" },
  ];
}

export async function examAttemptTiles(programId?: string): Promise<GridTile[]> {
  await connectDB();
  const scope = programScope(programId);
  const [all, submitted, inProgress, expired, average] = await Promise.all([
    ExamAttempt.countDocuments(scope),
    ExamAttempt.countDocuments({ ...scope, status: "submitted" }),
    ExamAttempt.countDocuments({ ...scope, status: "in_progress" }),
    ExamAttempt.countDocuments({ ...scope, status: "expired" }),
    ExamAttempt.aggregate<{ avg: number | null }>([
      { $match: { ...scope, status: "submitted", totalMarks: { $gt: 0 } } },
      { $group: { _id: null, avg: { $avg: { $divide: ["$score", "$totalMarks"] } } } },
    ]).then((rows) => rows[0]?.avg ?? null),
  ]);
  return [
    { key: "all", label: "All attempts", value: all, icon: "layers", tone: "blue", preset: "" },
    { key: "submitted", label: "Submitted", value: submitted, icon: "check", tone: "green", preset: "submitted" },
    { key: "in_progress", label: "In progress", value: inProgress, icon: "clock", tone: "amber", preset: "in_progress" },
    { key: "expired", label: "Expired", value: expired, icon: "alert", tone: "red", preset: "expired", note: "Time ran out" },
    {
      key: "average",
      label: "Average score",
      value: average === null ? "—" : `${Math.round(average * 1000) / 10}%`,
      icon: "active",
      tone: "purple",
      note: "Submitted attempts",
    },
  ];
}

export async function examQuestionTiles(programId?: string): Promise<GridTile[]> {
  const oid = examProgramObjectId(programId);
  if (!oid) return [];
  await connectDB();
  const [all, active, inactive, withImage, marks] = await Promise.all([
    ExamQuestion.countDocuments({ programId: oid }),
    ExamQuestion.countDocuments({ programId: oid, isActive: { $ne: false } }),
    ExamQuestion.countDocuments({ programId: oid, isActive: false }),
    ExamQuestion.countDocuments({ programId: oid, image: { $nin: ["", null] } }),
    ExamQuestion.aggregate<{ total: number }>([
      { $match: { programId: oid, isActive: { $ne: false } } },
      { $group: { _id: null, total: { $sum: "$marks" } } },
    ]).then((rows) => rows[0]?.total ?? 0),
  ]);
  return [
    { key: "all", label: "All questions", value: all, icon: "book", tone: "blue", preset: "" },
    { key: "active", label: "Active", value: active, icon: "check", tone: "green", preset: "active", note: "Shown in the exam" },
    { key: "inactive", label: "Inactive", value: inactive, icon: "inactive", tone: "amber", preset: "inactive", note: "Hidden from students" },
    { key: "with-image", label: "With image", value: withImage, icon: "layers", tone: "purple", preset: "with-image" },
    { key: "marks", label: "Active marks", value: marks, icon: "active", tone: "brand", note: "Sum of active questions" },
  ];
}

export async function examHubTiles(kind: ExamHubTileKind, programId?: string): Promise<GridTile[]> {
  switch (kind) {
    case "programs":
      return examProgramTiles();
    case "enrollments":
      return examEnrollmentTiles(programId);
    case "attempts":
      return examAttemptTiles(programId);
    case "questions":
      return examQuestionTiles(programId);
    default:
      return [];
  }
}
