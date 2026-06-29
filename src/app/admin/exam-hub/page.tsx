import { ExamHubManager } from "@/components/admin/exam-hub/ExamHubManager";
import { connectDB } from "@/lib/mongodb";
import ExamEnrollment from "@/models/ExamEnrollment";
import ExamProgram from "@/models/ExamProgram";
import ExamQuestion from "@/models/ExamQuestion";

export default async function AdminExamHubPage() {
  await connectDB();
  const programs = await ExamProgram.find().sort({ order: 1, createdAt: -1 }).lean();
  const programIds = programs.map((p) => p._id);

  const [questionCounts, enrollmentCounts] = await Promise.all([
    ExamQuestion.aggregate([
      { $match: { programId: { $in: programIds }, isActive: true } },
      { $group: { _id: "$programId", count: { $sum: 1 } } },
    ]),
    ExamEnrollment.aggregate([
      { $match: { programId: { $in: programIds } } },
      { $group: { _id: "$programId", count: { $sum: 1 } } },
    ]),
  ]);

  const qMap = new Map(questionCounts.map((r) => [String(r._id), r.count as number]));
  const eMap = new Map(enrollmentCounts.map((r) => [String(r._id), r.count as number]));

  const initialPrograms = programs.map((p) => ({
    ...JSON.parse(JSON.stringify(p)),
    _id: String(p._id),
    questionCount: qMap.get(String(p._id)) || 0,
    enrollmentCount: eMap.get(String(p._id)) || 0,
  }));

  return <ExamHubManager initialPrograms={initialPrograms} />;
}
