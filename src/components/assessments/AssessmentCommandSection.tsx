import { AssessmentGateway } from "@/components/assessments/AssessmentGateway";
import { getPublicAssessments } from "@/lib/assessments";
import { connectDB } from "@/lib/mongodb";

export async function AssessmentCommandSection() {
  await connectDB();
  const assessments = await getPublicAssessments({ featuredOnly: true, limit: 8 });
  if (assessments.length === 0) return null;

  return <AssessmentGateway assessments={JSON.parse(JSON.stringify(assessments))} />;
}
