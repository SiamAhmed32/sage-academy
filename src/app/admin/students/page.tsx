import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { connectDB } from "@/lib/mongodb";
import AcademicBatch from "@/models/AcademicBatch";
import Student from "@/models/Student";
import { StudentCreatePanel } from "@/components/admin/students/StudentCreatePanel";
import { StudentFilters } from "@/components/admin/students/StudentFilters";
import { StudentEditDialog } from "@/components/admin/students/StudentEditDialog";
import { StudentSubjectsDialog } from "@/components/admin/students/StudentSubjectsDialog";
import { StudentArchiveDialog } from "@/components/admin/students/StudentArchiveDialog";
import { getAdminClassLabel } from "@/constants/admin-display";
import { restoreStudentAction, deleteStudentAction } from "@/app/admin/actions";
import { Search, CreditCard, RotateCcw, Trash2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { formatAdminDate, formatAdminNumber } from "@/lib/admin-format";
import {
  escapeMongoRegex,
  firstQueryValue,
  normalizeAdminSearch,
  parseAdminDate,
  parseAllowedInteger,
  parsePositiveInteger,
  parseWhitelistedValue,
} from "@/lib/student-payment-query";

type StudentListRow = {
  _id: { toString(): string };
  image?: { url?: string };
  nameEnglish: string;
  studentId: string;
  classLevel: number;
  batch?: { _id?: { toString(): string }; title?: string; batchCode?: string } | null;
  selectedSubjects?: Array<{
    subjectName: string;
    monthlyFee: number;
    baseFee?: number;
    discountType?: string;
    discountValue?: number;
    discountNote?: string;
  }>;
  whatsapp?: string;
  guardianName?: string;
  fatherName?: string;
  motherName?: string;
  admissionDate?: string | Date;
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const studentSorts = {
  "created-desc": { createdAt: -1 },
  "admission-desc": { admissionDate: -1, createdAt: -1 },
  "name-asc": { nameEnglish: 1, _id: 1 },
  "id-asc": { studentId: 1, _id: 1 },
} as const;
const studentLimits = [10, 25, 50] as const;

function studentPageHref(
  filters: Record<string, string>,
  page: number,
  limit: number
) {
  const query = new URLSearchParams(filters);
  query.set("page", String(page));
  query.set("limit", String(limit));
  return `/admin/students?${query.toString()}`;
}

export default async function AdminStudentsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const q = normalizeAdminSearch(firstQueryValue(params.q));
  const classLevelValue = firstQueryValue(params.classLevel);
  const classNumber = parseAllowedInteger(
    classLevelValue,
    Array.from({ length: 12 }, (_, index) => index + 1),
    0
  );
  const classLevel = classNumber ? String(classNumber) : "";
  const batchCode = normalizeAdminSearch(firstQueryValue(params.batchCode), 64);
  const status = parseWhitelistedValue(
    firstQueryValue(params.status),
    ["active", "archived"] as const,
    "active"
  );
  const sort = parseWhitelistedValue(
    firstQueryValue(params.sort),
    Object.keys(studentSorts) as Array<keyof typeof studentSorts>,
    "created-desc"
  );
  const dateFrom = firstQueryValue(params.dateFrom) ?? "";
  const dateTo = firstQueryValue(params.dateTo) ?? "";
  const fromDate = parseAdminDate(dateFrom, "start");
  const toDate = parseAdminDate(dateTo, "end");
  const requestedPage = parsePositiveInteger(firstQueryValue(params.page), 1);
  const limit = parseAllowedInteger(firstQueryValue(params.limit), studentLimits, 25);

  await connectDB();

  const query: Record<string, unknown> = {};
  query.isActive = status !== "archived";
  if (q) {
    const safeSearch = escapeMongoRegex(q);
    query.$or = [
      { nameEnglish: { $regex: safeSearch, $options: "i" } },
      { nameBangla: { $regex: safeSearch, $options: "i" } },
      { whatsapp: { $regex: safeSearch, $options: "i" } },
      { studentId: { $regex: safeSearch, $options: "i" } },
    ];
  }
  if (classNumber) query.classLevel = classNumber;
  if (fromDate || toDate) {
    query.admissionDate = {
      ...(fromDate ? { $gte: fromDate } : {}),
      ...(toDate ? { $lte: toDate } : {}),
    };
  }

  if (batchCode && batchCode !== "all") {
    const targetAcademicBatch = await AcademicBatch.findOne({ batchCode }).select("_id").lean();
    if (targetAcademicBatch) {
      query.batch = targetAcademicBatch._id;
    } else {
      query.batch = "000000000000000000000000"; // No match
    }
  }

  const activeBatchQuery = {
    isArchived: { $ne: true },
    isActive: { $ne: false },
  };

  const [totalStudents, batches, allActiveAcademicBatches] = await Promise.all([
    Student.countDocuments(query),
    AcademicBatch.find(activeBatchQuery).sort({ order: 1, classLevel: 1 }).select("_id title batchCode").lean(),
    AcademicBatch.find(activeBatchQuery).sort({ order: 1, classLevel: 1 }).lean(),
  ]);
  const totalPages = Math.max(1, Math.ceil(totalStudents / limit));
  const page = Math.min(requestedPage, totalPages);
  const students = await Student.find(query)
    .populate("batch", "title batchCode")
    .sort(studentSorts[sort])
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();
  const activeFilters = {
    ...(q ? { q } : {}),
    ...(classLevel ? { classLevel } : {}),
    ...(batchCode && batchCode !== "all" ? { batchCode } : {}),
    ...(status !== "active" ? { status } : {}),
    ...(dateFrom && fromDate ? { dateFrom } : {}),
    ...(dateTo && toDate ? { dateTo } : {}),
    ...(sort !== "created-desc" ? { sort } : {}),
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Student Management"
        description="Enroll students, search records, and manage profiles."
      />

      <StudentCreatePanel batches={allActiveAcademicBatches} />

      <StudentFilters
        q={q}
        classLevel={classLevel}
        batchCode={batchCode}
        status={status}
        dateFrom={dateFrom}
        dateTo={dateTo}
        sort={sort}
        limit={limit}
        batches={batches.map(b => ({
          _id: b._id.toString(),
          title: b.title,
          batchCode: b.batchCode
        }))}
      />

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full min-w-[1000px] text-left text-sm">
          <thead className="bg-gray-50 text-xs font-bold uppercase tracking-wide text-gray-500">
            <tr className="border-b border-gray-200">
              <th className="p-4">Student</th>
              <th className="p-4">Class and Batch</th>
              <th className="p-4">Subjects</th>
              <th className="p-4">Contact</th>
              <th className="p-4">Admission Date</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(students as StudentListRow[]).map((student) => (
              <tr key={student._id.toString()} className="group hover:bg-gray-50 transition">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="relative h-10 w-10 overflow-hidden rounded-full border border-gray-200 bg-sage-red-50 flex items-center justify-center text-sage-primary">
                      {student.image?.url ? (
                        <Image src={student.image.url} alt={student.nameEnglish} fill className="object-cover" />
                      ) : (
                        <span className="font-bold uppercase text-sage-primary">{student.nameEnglish.charAt(0)}</span>
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 leading-none">{student.nameEnglish}</p>
                      <p className="mt-1 text-[10px] font-bold text-sage-primary uppercase tracking-wider">{student.studentId}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <div className="space-y-1">
                    <span className="inline-block rounded-md bg-sage-red-50 px-2 py-0.5 text-[10px] font-bold text-sage-primary">{getAdminClassLabel(student.classLevel)}</span>
                    <p className="text-xs font-semibold text-gray-600 leading-tight">{student.batch?.title ?? "No Batch"}</p>
                    {student.batch?.batchCode && (
                       <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{student.batch.batchCode}</p>
                    )}
                  </div>
                </td>
                <td className="p-4">
                  <StudentSubjectsDialog
                    studentName={student.nameEnglish}
                    subjects={student.selectedSubjects || []}
                  />
                </td>
                <td className="p-4">
                  <p className="font-semibold text-gray-900">{student.whatsapp}</p>
                  <p className="text-[10px] text-gray-500">Guardian: {student.guardianName || student.fatherName || student.motherName || "N/A"}</p>
                </td>
                <td className="p-4">
                  <p className="text-xs font-semibold text-gray-600">
                    {formatAdminDate(student.admissionDate, "N/A")}
                  </p>
                </td>
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <StudentEditDialog student={student} batches={allActiveAcademicBatches} />
                    
                    {status === "archived" ? (
                      <>
                        <form action={restoreStudentAction}>
                          <input type="hidden" name="id" value={student._id.toString()} />
                          <button 
                            type="submit"
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50 text-green-600 transition hover:bg-green-100 shadow-sm"
                            title="Restore student"
                          >
                            <RotateCcw size={16} />
                          </button>
                        </form>
                        
                        <form action={deleteStudentAction}>
                          <input type="hidden" name="id" value={student._id.toString()} />
                          <button 
                            type="submit"
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600 transition hover:bg-red-600 hover:text-white shadow-sm"
                            title="Delete student"
                          >
                            <Trash2 size={16} />
                          </button>
                        </form>
                      </>
                    ) : (
                      <StudentArchiveDialog 
                        studentId={student._id.toString()} 
                        studentName={student.nameEnglish} 
                      />
                    )}

                    <Link
                      href={`/admin/students/${student._id.toString()}/payments`}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-sage-red-50 text-sage-primary transition hover:bg-sage-primary hover:text-white shadow-sm"
                      title="Open payments"
                    >
                      <CreditCard size={16} />
                    </Link>

                    <Link
                      href={`/admin/students/${student._id.toString()}`}
                      className="inline-flex h-[38px] items-center gap-2 rounded-lg bg-sage-red-50 px-4 text-xs font-bold text-sage-primary transition hover:bg-sage-primary hover:text-white shadow-sm"
                    >
                      View Profile
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
            {students.length === 0 && (
              <tr>
                <td colSpan={6} className="p-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-12 w-12 rounded-full bg-sage-red-50 flex items-center justify-center text-sage-primary opacity-50">
                      <Search size={24} />
                    </div>
                    <p className="text-sm font-bold text-sage-secondary">No students found</p>
                    <p className="text-xs text-sage-gray-500">Change the filters and try again.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-sage-gray-500">
        <p>
          Showing {formatAdminNumber(totalStudents ? (page - 1) * limit + 1 : 0)}-
          {formatAdminNumber(Math.min(totalStudents, page * limit))} of{" "}
          {formatAdminNumber(totalStudents)}
        </p>
        <div className="flex items-center gap-2">
          <Link
            aria-disabled={page <= 1}
            href={studentPageHref(activeFilters, Math.max(1, page - 1), limit)}
            className={`rounded-lg border border-sage-border px-3 py-2 font-bold ${page <= 1 ? "pointer-events-none opacity-50" : "bg-white text-sage-secondary"}`}
          >
            Previous
          </Link>
          <span className="rounded-lg bg-sage-red-50 px-3 py-2 font-bold text-sage-primary">
            Page {formatAdminNumber(page)} of {formatAdminNumber(totalPages)}
          </span>
          <Link
            aria-disabled={page >= totalPages}
            href={studentPageHref(activeFilters, Math.min(totalPages, page + 1), limit)}
            className={`rounded-lg border border-sage-border px-3 py-2 font-bold ${page >= totalPages ? "pointer-events-none opacity-50" : "bg-white text-sage-secondary"}`}
          >
            Next
          </Link>
        </div>
      </div>
    </div>
  );
}
