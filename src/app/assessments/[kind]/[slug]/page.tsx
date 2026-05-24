import { notFound } from "next/navigation";
import { activeAssessmentQuery, assessmentModel, serializeAssessment, type AssessmentKind } from "@/lib/assessments";
import { connectDB } from "@/lib/mongodb";
import { AssessmentDetailClient } from "@/components/assessments/AssessmentDetailClient";

type PageProps = {
  params: Promise<{ kind: string; slug: string }>;
};

function parseKind(kind: string): AssessmentKind | null {
  if (kind === "model-tests") return "modelTest";
  if (kind === "exams") return "exam";
  return null;
}

export default async function AssessmentDetailPage({ params }: PageProps) {
  const { kind: rawKind, slug } = await params;
  const kind = parseKind(rawKind);
  if (!kind) notFound();

  await connectDB();
  const model = assessmentModel(kind);
  const doc = await model.findOne({ ...activeAssessmentQuery(false), slug }).lean();
  if (!doc) notFound();

  const assessment = serializeAssessment(doc, kind);
  const badge = assessment.kind === "modelTest" ? "Model Test" : assessment.examType || "Exam";

  return <AssessmentDetailClient assessment={assessment} badge={badge} />;
}
