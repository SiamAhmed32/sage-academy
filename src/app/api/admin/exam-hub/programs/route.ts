import { NextRequest } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { successResponse } from "@/lib/api-response";
import { BadRequestError } from "@/lib/errors";
import { parseCreateExamProgramBody } from "@/lib/admin/exam-hub-program-body";
import { slugifyExamProgram } from "@/lib/exam-hub";
import { connectDB } from "@/lib/mongodb";
import { adminRoles, requireRole } from "@/lib/rbac";
import ExamProgram from "@/models/ExamProgram";
import ExamQuestion from "@/models/ExamQuestion";
import ExamEnrollment from "@/models/ExamEnrollment";

async function ensureUniqueSlug(base: string, excludeId?: string) {
  let slug = slugifyExamProgram(base);
  let suffix = 0;
  while (true) {
    const candidate = suffix ? `${slug}-${suffix}` : slug;
    const exists = await ExamProgram.findOne({
      slug: candidate,
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    }).select("_id");
    if (!exists) return candidate;
    suffix += 1;
  }
}

export const GET = withApiHandler(async () => {
  await requireRole(adminRoles);
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

  return successResponse(
    programs.map((p) => ({
      ...p,
      _id: String(p._id),
      questionCount: qMap.get(String(p._id)) || 0,
      enrollmentCount: eMap.get(String(p._id)) || 0,
    })),
    "Programs fetched"
  );
});

export const POST = withApiHandler(async (req: NextRequest) => {
  await requireRole(adminRoles);
  await connectDB();

  const body = await parseCreateExamProgramBody(req);
  const slug = await ensureUniqueSlug(body.slug || body.title);

  if (body.deliveryMode === "online" && body.accessType === "private" && !body.isPaid) {
    throw new BadRequestError("Private online exams must be marked as paid");
  }

  const program = await ExamProgram.create({ ...body, slug });
  return successResponse({ ...program.toObject(), _id: program._id.toString() }, "Exam program created", 201);
});
