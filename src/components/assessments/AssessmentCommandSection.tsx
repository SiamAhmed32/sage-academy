import { AssessmentGateway } from "@/components/assessments/AssessmentGateway";
import { ExamLeadSection } from "@/components/assessments/ExamLeadSection";
import { getPublicAssessments } from "@/lib/assessments";
import { getOptionalSessionFromCookies } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export async function AssessmentCommandSection() {
  await connectDB();
  const [assessments, session] = await Promise.all([
    getPublicAssessments({ featuredOnly: true, limit: 12 }),
    getOptionalSessionFromCookies(),
  ]);
  const modelTests = assessments.filter((item) => item.kind === "modelTest");
  const exams = assessments.filter((item) => item.kind === "exam" && ["Weekly Test", "Class Test"].includes(item.examType || ""));
  const user = session
    ? await User.findById(session.sub).select("name phone").lean<{ name?: string; phone?: string } | null>()
    : null;

  if (modelTests.length === 0 && exams.length === 0) return null;

  return (
    <>
      {modelTests.length ? <AssessmentGateway assessments={JSON.parse(JSON.stringify(modelTests))} /> : null}
      {exams.length ? <ExamLeadSection exams={JSON.parse(JSON.stringify(exams))} user={user ? { name: user.name, phone: user.phone } : null} /> : null}
    </>
  );
}
