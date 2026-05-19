import { NextRequest } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { successResponse } from "@/lib/api-response";
import { connectDB } from "@/lib/mongodb";
import { requireRole, staffRoles } from "@/lib/rbac";
import Student from "@/models/Student";

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export const GET = withApiHandler(async (req: NextRequest) => {
  await requireRole(staffRoles);
  await connectDB();

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() || "";
  const classLevel = Number(searchParams.get("classLevel") || 0);
  const query: Record<string, unknown> = { isActive: true };

  if (Number.isInteger(classLevel) && classLevel >= 1 && classLevel <= 12) {
    query.classLevel = classLevel;
  }

  if (!q && !query.classLevel) {
    return successResponse([], "Search or class filter required");
  }

  if (q) {
    const pattern = new RegExp(escapeRegex(q), "i");
    query.$or = [
      { nameEnglish: pattern },
      { studentId: pattern },
      { phone: pattern },
      { whatsapp: pattern },
    ];
  }

  const students = await Student.find(query)
    .select("nameEnglish studentId classLevel selectedSubjects")
    .sort(q ? { nameEnglish: 1 } : { createdAt: -1 })
    .limit(12)
    .lean();

  return successResponse(students, "Students fetched successfully");
});
