import { NextRequest } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { successResponse } from "@/lib/api-response";
import { ConflictError, NotFoundError } from "@/lib/errors";
import { connectDB } from "@/lib/mongodb";
import { adminRoles, requireRole, staffRoles } from "@/lib/rbac";
import Class from "@/models/Class";
import Subject from "@/models/Subject";
import { createSubjectSchema } from "@/schemas/academic-structure";

export const GET = withApiHandler(async (req: NextRequest) => {
  await requireRole(staffRoles);
  await connectDB();

  const { searchParams } = new URL(req.url);
  const classId = searchParams.get("classId");

  const query: Record<string, unknown> = {};
  if (classId) query.classId = classId;

  const subjects = await Subject.find(query)
    .populate("classId", "name orderIndex")
    .sort({ name: 1 });

  return successResponse(subjects, "Subjects fetched successfully");
});

export const POST = withApiHandler(async (req: NextRequest) => {
  await requireRole(adminRoles);
  await connectDB();

  const body = await req.json().catch(() => ({}));
  const data = createSubjectSchema.parse(body);

  const parentClass = await Class.findById(data.classId);
  if (!parentClass) throw new NotFoundError("Selected class not found");

  const existing = await Subject.findOne({ classId: data.classId, name: data.name });
  if (existing) {
    throw new ConflictError(`Subject "${data.name}" already exists for ${parentClass.name}.`);
  }

  const created = await Subject.create(data);
  return successResponse(created, "Subject created successfully", 201);
});
