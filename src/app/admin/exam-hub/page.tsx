import { ExamHubManager } from "@/components/admin/exam-hub/ExamHubManager";
import { examAttemptTiles, examEnrollmentTiles, examProgramTiles } from "@/lib/grid/tiles-exam-hub";
import { connectDB } from "@/lib/mongodb";
import ExamProgram from "@/models/ExamProgram";

export default async function AdminExamHubPage() {
  await connectDB();
  const [programs, programTiles, enrollmentTiles, attemptTiles] = await Promise.all([
    ExamProgram.find().select("title slug deliveryMode status").sort({ title: 1, _id: 1 }).lean(),
    examProgramTiles(),
    examEnrollmentTiles(),
    examAttemptTiles(),
  ]);
  const initialProgramOptions = programs.map((p) => ({
    _id: String(p._id),
    title: p.title,
    slug: p.slug,
    deliveryMode: p.deliveryMode,
    status: p.status,
  }));

  return (
    <ExamHubManager
      initialProgramOptions={initialProgramOptions}
      tiles={{ programs: programTiles, enrollments: enrollmentTiles, attempts: attemptTiles }}
    />
  );
}
