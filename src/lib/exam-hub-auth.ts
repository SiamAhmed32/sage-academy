import ExamAttempt from "@/models/ExamAttempt";
import ExamEnrollment from "@/models/ExamEnrollment";
import { BadRequestError, ForbiddenError, NotFoundError } from "@/lib/errors";
import { enrollmentCanStartExam, sanitizePhone } from "@/lib/exam-hub";
import { finalizeExamAttempt } from "@/lib/exam-hub-submit";

export async function getAttemptForPhone(attemptId: string, phone: string) {
  const attempt = await ExamAttempt.findById(attemptId).lean();
  if (!attempt) throw new NotFoundError("Attempt not found");

  if (sanitizePhone(attempt.phone) !== sanitizePhone(phone)) {
    throw new ForbiddenError("This attempt does not belong to this phone number");
  }

  return attempt;
}

export async function assertAttemptInProgress(attemptId: string, phone: string) {
  let attempt = await getAttemptForPhone(attemptId, phone);

  if (attempt.status === "submitted") {
    throw new BadRequestError("Exam already submitted");
  }

  if (attempt.status === "in_progress" && new Date() > new Date(attempt.expiresAt)) {
    await finalizeExamAttempt(attemptId);
    attempt = await getAttemptForPhone(attemptId, phone);
    throw new BadRequestError("Exam time has expired and was auto-submitted");
  }

  if (attempt.status !== "in_progress") {
    throw new BadRequestError("Exam is no longer active");
  }

  return attempt;
}

export async function getConfirmedEnrollment(programId: string, enrollmentId: string, phone: string) {
  const enrollment = await ExamEnrollment.findOne({
    _id: enrollmentId,
    programId,
    phone: sanitizePhone(phone),
  }).lean();

  if (!enrollment) throw new NotFoundError("Enrollment not found");
  if (!enrollmentCanStartExam(enrollment)) {
    throw new BadRequestError("Enrollment is not confirmed yet");
  }

  return enrollment;
}

export function getClientMeta(req: Request) {
  return {
    ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "",
    userAgent: req.headers.get("user-agent")?.slice(0, 400) || "",
  };
}
