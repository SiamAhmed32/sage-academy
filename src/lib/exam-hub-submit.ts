import { scoreAttempt, activeExamQuestionQuery } from "@/lib/exam-hub";
import { connectDB } from "@/lib/mongodb";
import ExamAttempt from "@/models/ExamAttempt";
import ExamEnrollment from "@/models/ExamEnrollment";
import ExamProgram from "@/models/ExamProgram";
import ExamQuestion from "@/models/ExamQuestion";

export async function finalizeExamAttempt(attemptId: string) {
  await connectDB();

  const attempt = await ExamAttempt.findOne({ _id: attemptId, status: "in_progress" });
  if (!attempt) {
    return ExamAttempt.findById(attemptId).lean();
  }

  const [program, questions] = await Promise.all([
    ExamProgram.findById(attempt.programId).lean(),
    ExamQuestion.find(activeExamQuestionQuery(attempt.programId)).lean(),
  ]);

  if (!program) return attempt.toObject();

  const { score, totalMarks, gradedAnswers } = scoreAttempt(
    questions as Array<{ _id: unknown; marks: number; correctIndex: number }>,
    (attempt.answers || []) as Array<{ questionId: unknown; selectedIndex: number | null }>,
    {
      correctMark: Number(program.correctMark ?? 1),
      wrongMark: Number(program.wrongMark ?? 0),
      unansweredMark: Number(program.unansweredMark ?? 0),
    }
  );

  const now = new Date();
  const expired = now.getTime() > attempt.expiresAt.getTime();
  const submittedAt = expired ? attempt.expiresAt : now;
  const durationSeconds = Math.max(
    0,
    Math.round((submittedAt.getTime() - attempt.startedAt.getTime()) / 1000)
  );

  const updated = await ExamAttempt.findOneAndUpdate(
    { _id: attemptId, status: "in_progress" },
    {
      status: "submitted",
      submittedAt,
      score,
      totalMarks,
      durationSeconds,
      answers: gradedAnswers,
    },
    { new: true }
  );

  if (updated) {
    await ExamEnrollment.findByIdAndUpdate(attempt.enrollmentId, { $inc: { attemptsUsed: 1 } });
  }

  return updated?.toObject() || (await ExamAttempt.findById(attemptId).lean());
}

export async function finalizeExpiredAttemptsForEnrollment(enrollmentId: unknown) {
  const expired = await ExamAttempt.find({
    enrollmentId,
    status: "in_progress",
    expiresAt: { $lte: new Date() },
  })
    .select("_id")
    .lean();

  for (const row of expired) {
    await finalizeExamAttempt(String(row._id));
  }
}
