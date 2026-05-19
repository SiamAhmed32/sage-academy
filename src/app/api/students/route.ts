import { NextRequest } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { successResponse } from "@/lib/api-response";
import { buildStudentId, getNextStudentSerial } from "@/lib/student-id";
import { connectDB } from "@/lib/mongodb";
import { ConflictError } from "@/lib/errors";
import { adminRoles, requireRole, staffRoles } from "@/lib/rbac";
import Student from "@/models/Student";
import {
  DUPLICATE_STUDENT_MESSAGE,
  findActiveDuplicateStudent,
} from "@/lib/student-duplicate";
import { createStudentSchema } from "@/schemas/student";

export const GET = withApiHandler(async () => {
  await requireRole(staffRoles);
  await connectDB();

  const students = await Student.find()
    .populate("batch", "title slug")
    .sort({ createdAt: -1 });

  return successResponse(students, "Students fetched successfully");
});

export const POST = withApiHandler(async (req: NextRequest) => {
  await requireRole(adminRoles);
  await connectDB();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const data = createStudentSchema.parse(body);

  const dup = await findActiveDuplicateStudent({
    classLevel: data.classLevel,
    schoolName: data.schoolName ?? "",
    roll: data.roll ?? "",
  });
  if (dup) {
    throw new ConflictError(DUPLICATE_STUDENT_MESSAGE);
  }

  const serialNumber = await getNextStudentSerial(data.admissionYear, data.classLevel);
  const studentId = buildStudentId(data.admissionYear, data.classLevel, serialNumber);

  const student = await Student.create({
    ...data,
    batch: data.batch || null,
    roll: data.roll ?? "",
    serialNumber,
    studentId,
  });

  return successResponse(student, "Student created successfully", 201);
});
