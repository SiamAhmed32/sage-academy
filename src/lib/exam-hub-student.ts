import { sanitizePhone } from "@/lib/exam-hub";
import { connectDB } from "@/lib/mongodb";
import ExamAttempt from "@/models/ExamAttempt";
import ExamProgram from "@/models/ExamProgram";

export type StudentExamResultRow = {
  attemptId: string;
  programSlug: string;
  title: string;
  score: number;
  totalMarks: number;
  durationSeconds: number;
  submittedAt: string;
  status: string;
};

export async function getExamResultsForPhone(rawPhone: string, limit = 50) {
  await connectDB();
  const phone = sanitizePhone(rawPhone);
  if (!phone) return [];

  const attempts = await ExamAttempt.find({
    phone,
    status: { $in: ["submitted", "expired"] },
  })
    .sort({ submittedAt: -1, createdAt: -1 })
    .limit(limit)
    .lean();

  if (!attempts.length) return [];

  const programIds = [...new Set(attempts.map((a) => String(a.programId)))];
  const programs = await ExamProgram.find({ _id: { $in: programIds } }).select("title slug").lean();
  const programMap = new Map(programs.map((p) => [String(p._id), p]));

  return attempts
    .filter((a) => a.status === "submitted")
    .map((attempt) => {
      const program = programMap.get(String(attempt.programId));
      return {
        attemptId: String(attempt._id),
        programSlug: program?.slug || "",
        title: program?.title || "Exam",
        score: Number(attempt.score || 0),
        totalMarks: Number(attempt.totalMarks || 0),
        durationSeconds: Number(attempt.durationSeconds || 0),
        submittedAt: attempt.submittedAt
          ? new Date(attempt.submittedAt).toISOString()
          : new Date(attempt.createdAt).toISOString(),
        status: attempt.status,
      } satisfies StudentExamResultRow;
    });
}
