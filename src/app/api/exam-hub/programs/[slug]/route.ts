import { withApiHandler } from "@/lib/api-handler";
import { successResponse } from "@/lib/api-response";
import { NotFoundError } from "@/lib/errors";
import { serializePublicProgram } from "@/lib/exam-hub";
import { connectDB } from "@/lib/mongodb";
import ExamProgram from "@/models/ExamProgram";

type RouteContext = { params: Promise<Record<string, string>> };

export const GET = withApiHandler(async (_req, context: RouteContext) => {
  await connectDB();
  const { slug } = await context.params;
  const program = await ExamProgram.findOne({ slug, status: "published" }).lean();
  if (!program) throw new NotFoundError("Exam not found");
  return successResponse(serializePublicProgram(program as Record<string, unknown>), "Program fetched");
});
