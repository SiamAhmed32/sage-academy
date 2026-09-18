import { NextRequest } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { successResponse } from "@/lib/api-response";
import { ConflictError } from "@/lib/errors";
import { connectDB } from "@/lib/mongodb";
import { adminRoles, requireRole, staffRoles } from "@/lib/rbac";
import Class from "@/models/Class";
import { createClassSchema } from "@/schemas/academic-structure";

export const GET = withApiHandler(async () => {
  await requireRole(staffRoles);
  await connectDB();

  const classes = await Class.find().sort({ orderIndex: 1, name: 1 });
  return successResponse(classes, "Classes fetched successfully");
});

export const POST = withApiHandler(async (req: NextRequest) => {
  await requireRole(adminRoles);
  await connectDB();

  const body = await req.json().catch(() => ({}));
  const data = createClassSchema.parse(body);

  const existing = await Class.findOne({ name: data.name });
  if (existing) {
    throw new ConflictError(`Class "${data.name}" already exists.`);
  }

  const created = await Class.create(data);
  return successResponse(created, "Class created successfully", 201);
});
