import { NextRequest } from "next/server";
import mongoose from "mongoose";

import { withApiHandler } from "@/lib/api-handler";
import { successResponse } from "@/lib/api-response";
import { NotFoundError } from "@/lib/errors";
import { connectDB } from "@/lib/mongodb";
import { enrollStudentInSubjectBatches } from "@/lib/enrollment-service";
import { currentBillingCycle, generateInvoiceForEnrollments } from "@/lib/invoice-service";
import { adminRoles, requireRole } from "@/lib/rbac";
import { buildStudentId, getNextStudentSerial } from "@/lib/student-id";
import Class from "@/models/Class";
import Student from "@/models/Student";
import { admitStudentSchema } from "@/schemas/admission";

/**
 * Screen 2 — "New Admission": one submit creates the Student, enrolls them
 * into exactly the subject-batch slots picked on screen (seat-checked, with
 * automatic rollover if a slot filled up between load and submit), and
 * generates their first invoice — all inside one transaction.
 */
export const POST = withApiHandler(async (req: NextRequest) => {
  await requireRole(adminRoles);
  await connectDB();

  const body = await req.json().catch(() => ({}));
  const data = admitStudentSchema.parse(body);

  const parentClass = await Class.findById(data.classId);
  if (!parentClass) throw new NotFoundError("Selected class not found");

  const billingCycle = data.billingCycle ?? currentBillingCycle();

  const session = await mongoose.startSession();
  try {
    let result: {
      student: unknown;
      enrollments: Awaited<ReturnType<typeof enrollStudentInSubjectBatches>>;
      invoice: unknown;
    } | null = null;

    await session.withTransaction(async () => {
      // classLevel/version are still what billing, routine and the student
      // portal read today — Class.legacyClassLevel is the real grade number
      // that maps this Class document onto that numeric field.
      const serialNumber = await getNextStudentSerial(new Date().getFullYear(), parentClass.legacyClassLevel);
      const studentId = buildStudentId(new Date().getFullYear(), parentClass.legacyClassLevel, serialNumber);

      const [student] = await Student.create(
        [
          {
            studentId,
            admissionYear: new Date().getFullYear(),
            classLevel: parentClass.legacyClassLevel,
            serialNumber,
            classId: data.classId,
            nameEnglish: data.name,
            nameBangla: data.nameBangla,
            phone: data.phone,
            whatsapp: data.studentWhatsapp,
            guardianPhone: data.guardianPhone,
            gender: data.gender,
            dateOfBirth: data.dateOfBirth,
            version: data.medium,
            fatherName: data.fatherName,
            motherName: data.motherName,
            guardianName: data.guardianName,
            schoolName: data.schoolName,
            section: data.section,
            roll: data.roll,
            admissionDate: data.admissionDate ?? new Date(),
            presentAddress: data.presentAddress,
            permanentAddress: data.permanentAddress,
            isActive: true,
          },
        ],
        { session }
      );

      const enrollmentResults = await enrollStudentInSubjectBatches(
        student._id.toString(),
        data.subjectBatchIds,
        session
      );

      const enrollmentIds = enrollmentResults
        .map((r) => r.enrollmentId)
        .filter((id): id is string => Boolean(id));

      const invoice = await generateInvoiceForEnrollments(
        student._id.toString(),
        enrollmentIds,
        billingCycle,
        data.discount,
        session
      );

      result = { student, enrollments: enrollmentResults, invoice };
    });

    return successResponse(result, "Student admitted successfully", 201);
  } finally {
    await session.endSession();
  }
});
