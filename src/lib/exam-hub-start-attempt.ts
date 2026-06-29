import { NextRequest } from "next/server";

import { BadRequestError, NotFoundError } from "@/lib/errors";
import { activeExamQuestionQuery, isProgramLive, sanitizePhone } from "@/lib/exam-hub";
import { getClientMeta, getConfirmedEnrollment } from "@/lib/exam-hub-auth";
import { finalizeExpiredAttemptsForEnrollment } from "@/lib/exam-hub-submit";
import { assertRateLimit, buildRateLimitKey } from "@/lib/rate-limit";
import { connectDB } from "@/lib/mongodb";
import ExamAttempt from "@/models/ExamAttempt";
import ExamProgram from "@/models/ExamProgram";
import ExamQuestion from "@/models/ExamQuestion";

type StartAttemptInput = {
  slug: string;
  enrollmentId: string;
  phone: string;
};

export async function startExamAttempt(req: NextRequest, input: StartAttemptInput) {
  await connectDB();
  const phone = sanitizePhone(input.phone);

  assertRateLimit(buildRateLimitKey("exam-hub:start", req, phone), 12, 15 * 60_000);

  const program = await ExamProgram.findOne({
    slug: input.slug,
    status: "published",
    deliveryMode: "online",
  }).lean();
  if (!program) throw new NotFoundError("Online exam not found");
  if (!isProgramLive(program.startDate, program.endDate)) {
    throw new BadRequestError("Exam is not live right now");
  }

  const enrollment = await getConfirmedEnrollment(String(program._id), input.enrollmentId, phone);
  await finalizeExpiredAttemptsForEnrollment(enrollment._id);

  const submittedCount = await ExamAttempt.countDocuments({
    enrollmentId: enrollment._id,
    status: "submitted",
  });
  if (submittedCount >= Number(program.maxAttempts || 1)) {
    throw new BadRequestError("Maximum attempts reached");
  }

  const inProgress = await ExamAttempt.findOne({
    enrollmentId: enrollment._id,
    status: "in_progress",
    expiresAt: { $gt: new Date() },
  }).lean();
  if (inProgress) {
    return {
      attemptId: String(inProgress._id),
      expiresAt: inProgress.expiresAt,
      durationMinutes: program.durationMinutes,
      resumed: true as const,
    };
  }

  const questions = await ExamQuestion.find(activeExamQuestionQuery(program._id)).sort({ order: 1 }).lean();
  if (!questions.length) throw new BadRequestError("No questions configured for this exam");

  const startedAt = new Date();
  const expiresAt = new Date(startedAt.getTime() + Number(program.durationMinutes || 20) * 60 * 1000);
  const meta = getClientMeta(req);

  const attempt = await ExamAttempt.create({
    programId: program._id,
    enrollmentId: enrollment._id,
    name: enrollment.name,
    phone,
    startedAt,
    expiresAt,
    status: "in_progress",
    answers: questions.map((q) => ({ questionId: q._id, selectedIndex: null })),
    totalMarks: questions.reduce((sum, q) => sum + Number(q.marks || 1), 0),
    ...meta,
  });

  return {
    attemptId: attempt._id.toString(),
    expiresAt: attempt.expiresAt,
    durationMinutes: program.durationMinutes,
    resumed: false as const,
  };
}
