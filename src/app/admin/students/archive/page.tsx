import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { connectDB } from "@/lib/mongodb";
import Student from "@/models/Student";
import { getAdminClassLabel } from "@/constants/admin-display";
import { restoreStudentAction, deleteStudentAction } from "@/app/admin/actions";
import { ArrowLeft, RotateCcw, Trash2, User } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { formatAdminNumber } from "@/lib/admin-format";
import {
  escapeMongoRegex,
  firstQueryValue,
  normalizeAdminSearch,
  parseAdminDate,
  parseAllowedInteger,
  parsePositiveInteger,
  parseWhitelistedValue,
} from "@/lib/student-payment-query";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const archiveLimits = [10, 25, 50] as const;
const archiveSorts = {
  "archived-desc": { updatedAt: -1 },
  "name-asc": { nameEnglish: 1, _id: 1 },
  "id-asc": { studentId: 1, _id: 1 },
  "admission-desc": { admissionDate: -1, _id: 1 },
} as const;

type ArchivedStudentRow = {
  _id: { toString(): string };
  image?: { url?: string };
  nameEnglish: string;
  studentId: string;
  classLevel: number;
};

function archivePageHref(filters: Record<string, string>, page: number, limit: number) {
  const query = new URLSearchParams(filters);
  query.set("page", String(page));
  query.set("limit", String(limit));
  return `/admin/students/archive?${query.toString()}`;
}

export default async function StudentArchivePage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const q = normalizeAdminSearch(firstQueryValue(params.q));
  const classLevel = parseAllowedInteger(
    firstQueryValue(params.classLevel),
    Array.from({ length: 12 }, (_, index) => index + 1),
    0
  );
  const dateFrom = firstQueryValue(params.dateFrom) ?? "";
  const dateTo = firstQueryValue(params.dateTo) ?? "";
  const fromDate = parseAdminDate(dateFrom, "start");
  const toDate = parseAdminDate(dateTo, "end");
  const sort = parseWhitelistedValue(
    firstQueryValue(params.sort),
    Object.keys(archiveSorts) as Array<keyof typeof archiveSorts>,
    "archived-desc"
  );
  const requestedPage = parsePositiveInteger(firstQueryValue(params.page), 1);
  const limit = parseAllowedInteger(firstQueryValue(params.limit), archiveLimits, 25);

  await connectDB();

  const query: Record<string, unknown> = { isActive: false };
  if (q) {
    const safeSearch = escapeMongoRegex(q);
    query.$or = [
      { nameEnglish: { $regex: safeSearch, $options: "i" } },
      { nameBangla: { $regex: safeSearch, $options: "i" } },
      { studentId: { $regex: safeSearch, $options: "i" } },
      { whatsapp: { $regex: safeSearch, $options: "i" } },
    ];
  }
  if (classLevel) query.classLevel = classLevel;
  if (fromDate || toDate) {
    query.updatedAt = {
      ...(fromDate ? { $gte: fromDate } : {}),
      ...(toDate ? { $lte: toDate } : {}),
    };
  }

  const totalStudents = await Student.countDocuments(query);
  const totalPages = Math.max(1, Math.ceil(totalStudents / limit));
  const page = Math.min(requestedPage, totalPages);
  const archivedStudents = await Student.find(query)
    .sort(archiveSorts[sort])
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();
  const activeFilters = {
    ...(q ? { q } : {}),
    ...(classLevel ? { classLevel: String(classLevel) } : {}),
    ...(dateFrom && fromDate ? { dateFrom } : {}),
    ...(dateTo && toDate ? { dateTo } : {}),
    ...(sort !== "archived-desc" ? { sort } : {}),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link 
          href="/admin/students"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-sage-border bg-white text-sage-gray-500 transition hover:bg-sage-red-50 hover:text-sage-primary shadow-sm"
        >
          <ArrowLeft size={20} />
        </Link>
        <AdminPageHeader
          title="Student Archive"
          description="Restore archived students or permanently delete their records."
        />
      </div>

      <form method="get" className="grid gap-3 rounded-xl border border-sage-border bg-white p-4 md:grid-cols-2 xl:grid-cols-7">
        <input name="q" defaultValue={q} placeholder="Search name, ID, or WhatsApp" className="h-10 rounded-lg border border-sage-border px-3 text-sm xl:col-span-2" />
        <select name="classLevel" defaultValue={classLevel || ""} className="h-10 rounded-lg border border-sage-border bg-white px-3 text-sm">
          <option value="">All Classes</option>
          {Array.from({ length: 12 }, (_, index) => index + 1).map((level) => (
            <option key={level} value={level}>{getAdminClassLabel(level)}</option>
          ))}
        </select>
        <input type="date" name="dateFrom" defaultValue={dateFrom} aria-label="Archived date from" className="h-10 rounded-lg border border-sage-border px-3 text-sm" />
        <input type="date" name="dateTo" defaultValue={dateTo} aria-label="Archived date to" className="h-10 rounded-lg border border-sage-border px-3 text-sm" />
        <select name="sort" defaultValue={sort} className="h-10 rounded-lg border border-sage-border bg-white px-3 text-sm">
          <option value="archived-desc">Recently Archived</option>
          <option value="name-asc">Name A-Z</option>
          <option value="id-asc">Student ID</option>
          <option value="admission-desc">Latest Admission</option>
        </select>
        <div className="flex gap-2">
          <input type="hidden" name="limit" value={limit} />
          <button type="submit" className="h-10 flex-1 rounded-lg bg-sage-primary px-3 text-sm font-bold text-white">Apply</button>
          <Link href="/admin/students/archive" className="grid h-10 place-items-center rounded-lg border border-sage-border px-3 text-sm font-bold text-sage-secondary">Reset</Link>
        </div>
      </form>

      <div className="overflow-hidden rounded-xl border border-sage-border bg-white shadow-sm">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-sage-border bg-sage-red-50/50">
              <th className="p-4 text-xs font-black uppercase text-sage-secondary">Student</th>
              <th className="p-4 text-xs font-black uppercase text-sage-secondary text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {archivedStudents.length === 0 ? (
              <tr>
                <td colSpan={2} className="p-10 text-center text-sage-gray-400 italic">
                  No archived students found.
                </td>
              </tr>
            ) : (
              (archivedStudents as ArchivedStudentRow[]).map((student) => (
                <tr key={student._id.toString()} className="border-b border-sage-border last:border-0 hover:bg-sage-red-50/20 transition group">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="relative h-10 w-10 overflow-hidden rounded-full border border-sage-border bg-sage-red-50 flex items-center justify-center text-sage-primary">
                        {student.image?.url ? (
                          <Image src={student.image.url} alt={student.nameEnglish} fill className="object-cover" />
                        ) : (
                          <User size={20} />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-sage-secondary group-hover:text-sage-primary transition">{student.nameEnglish}</p>
                        <p className="text-[10px] text-sage-gray-400">ID: {student.studentId} | {getAdminClassLabel(student.classLevel)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <form action={restoreStudentAction}>
                        <input type="hidden" name="id" value={student._id.toString()} />
                        <button 
                          type="submit"
                          className="inline-flex h-9 items-center gap-2 rounded-lg border border-sage-border bg-white px-4 text-xs font-bold text-sage-secondary transition hover:bg-sage-red-50 hover:text-sage-primary shadow-sm"
                        >
                          <RotateCcw size={14} />
                          Restore
                        </button>
                      </form>
                      
                      <form action={deleteStudentAction}>
                        <input type="hidden" name="id" value={student._id.toString()} />
                        <button 
                          type="submit"
                          className="inline-flex h-9 items-center gap-2 rounded-lg border border-sage-border bg-white px-4 text-xs font-bold text-red-600 transition hover:bg-red-50 shadow-sm"
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-sage-gray-500">
        <p>
          Showing {formatAdminNumber(totalStudents ? (page - 1) * limit + 1 : 0)}-
          {formatAdminNumber(Math.min(totalStudents, page * limit))} of {formatAdminNumber(totalStudents)}
        </p>
        <div className="flex items-center gap-2">
          <Link
            href={archivePageHref(activeFilters, Math.max(1, page - 1), limit)}
            aria-disabled={page <= 1}
            className={`rounded-lg border border-sage-border px-3 py-2 font-bold ${page <= 1 ? "pointer-events-none opacity-50" : "bg-white text-sage-secondary"}`}
          >
            Previous
          </Link>
          <span className="rounded-lg bg-sage-red-50 px-3 py-2 font-bold text-sage-primary">
            Page {formatAdminNumber(page)} of {formatAdminNumber(totalPages)}
          </span>
          <Link
            href={archivePageHref(activeFilters, Math.min(totalPages, page + 1), limit)}
            aria-disabled={page >= totalPages}
            className={`rounded-lg border border-sage-border px-3 py-2 font-bold ${page >= totalPages ? "pointer-events-none opacity-50" : "bg-white text-sage-secondary"}`}
          >
            Next
          </Link>
        </div>
      </div>
    </div>
  );
}
