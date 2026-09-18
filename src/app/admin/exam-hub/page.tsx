import { ExamHubManager } from "@/components/admin/exam-hub/ExamHubManager";
import { connectDB } from "@/lib/mongodb";
import ExamProgram from "@/models/ExamProgram";

export default async function AdminExamHubPage() {
  await connectDB();
  const programs = await ExamProgram.find()
    .select("title slug deliveryMode status")
    .sort({ title: 1, _id: 1 })
    .lean();
  const initialProgramOptions = programs.map((p) => ({
    _id: String(p._id),
    title: p.title,
    slug: p.slug,
    deliveryMode: p.deliveryMode,
    status: p.status,
  }));

  return <ExamHubManager initialProgramOptions={initialProgramOptions} />;
}
