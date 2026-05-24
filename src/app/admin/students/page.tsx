import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { connectDB } from "@/lib/mongodb";
import AcademicBatch from "@/models/AcademicBatch";
import Student from "@/models/Student";
import { StudentCreatePanel } from "@/components/admin/students/StudentCreatePanel";
import { StudentFilters } from "@/components/admin/students/StudentFilters";
import { StudentEditDialog } from "@/components/admin/students/StudentEditDialog";
import { StudentSubjectsDialog } from "@/components/admin/students/StudentSubjectsDialog";
import { StudentArchiveDialog } from "@/components/admin/students/StudentArchiveDialog";
import { getClassLabel } from "@/constants/class-levels";
import { restoreStudentAction, deleteStudentAction } from "@/app/admin/actions";
import { Search, CreditCard, RotateCcw, Trash2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

type StudentListRow = {
  _id: { toString(): string };
  image?: { url?: string };
  nameEnglish: string;
  studentId: string;
  classLevel: number;
  batch?: { title?: string; batchCode?: string } | null;
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

export default async function AdminStudentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const classLevel = (params.classLevel ?? "").trim();
  const batchCode = (params.batchCode ?? "").trim();
  const status = (params.status ?? "active").trim();

  await connectDB();

  const query: Record<string, unknown> = {};
  if (status === "archived") {
    query.isActive = false;
  } else {
    query.isActive = true;
  }
  if (q) {
    query.$or = [
      { nameEnglish: { $regex: q, $options: "i" } },
      { nameBangla: { $regex: q, $options: "i" } },
      { whatsapp: { $regex: q, $options: "i" } },
      { studentId: { $regex: q, $options: "i" } },
    ];
  }
  if (classLevel) query.classLevel = Number(classLevel);

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

  const [students, batches, allActiveAcademicBatches] = await Promise.all([
    Student.find(query).populate("batch", "title batchCode").sort({ createdAt: -1 }).lean(),
    AcademicBatch.find(activeBatchQuery).sort({ order: 1, classLevel: 1 }).select("_id title batchCode").lean(),
    AcademicBatch.find(activeBatchQuery).sort({ order: 1, classLevel: 1 }).lean(),
  ]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="শিক্ষার্থী ম্যানেজমেন্ট"
        description="শিক্ষার্থী ভর্তি, তথ্য অনুসন্ধান ও প্রোফাইল ব্যবস্থাপনা এখান থেকেই করুন।"
      />

      <StudentCreatePanel batches={allActiveAcademicBatches} />

      <StudentFilters
        q={q}
        classLevel={classLevel}
        batchCode={batchCode}
        status={status}
        batches={batches.map(b => ({
          _id: b._id.toString(),
          title: b.title,
          batchCode: b.batchCode
        }))}
      />

      <div className="overflow-hidden rounded-xl border border-sage-border bg-white shadow-sm">
        <table className="w-full min-w-[1000px] text-left text-sm">
          <thead className="bg-sage-red-50 text-sage-secondary">
            <tr className="border-b border-sage-border">
              <th className="p-4 font-bold">শিক্ষার্থী তথ্য</th>
              <th className="p-4 font-bold">শ্রেণি ও ব্যাচ</th>
              <th className="p-4 font-bold">বিষয়সমূহ</th>
              <th className="p-4 font-bold">যোগাযোগ</th>
              <th className="p-4 font-bold">ভর্তির তারিখ</th>
              <th className="p-4 font-bold text-right">অ্যাকশন</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sage-border">
            {(students as StudentListRow[]).map((student) => (
              <tr key={student._id.toString()} className="group hover:bg-sage-red-50/20 transition">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="relative h-10 w-10 overflow-hidden rounded-full border border-sage-border bg-sage-red-50 flex items-center justify-center text-sage-primary">
                      {student.image?.url ? (
                        <Image src={student.image.url} alt={student.nameEnglish} fill className="object-cover" />
                      ) : (
                        <span className="font-bold uppercase text-sage-primary">{student.nameEnglish.charAt(0)}</span>
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-sage-secondary leading-none">{student.nameEnglish}</p>
                      <p className="mt-1 text-[10px] font-bold text-sage-primary uppercase tracking-wider">{student.studentId}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <div className="space-y-1">
                    <span className="inline-block rounded-md bg-sage-red-50 px-2 py-0.5 text-[10px] font-bold text-sage-primary">{getClassLabel(student.classLevel)}</span>
                    <p className="text-xs font-semibold text-sage-gray-600 leading-tight">{student.batch?.title ?? "No Batch"}</p>
                    {student.batch?.batchCode && (
                       <p className="text-[9px] font-bold text-sage-gray-400 uppercase tracking-widest">{student.batch.batchCode}</p>
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
                  <p className="font-semibold text-sage-secondary">{student.whatsapp}</p>
                  <p className="text-[10px] text-sage-gray-500">Guardian: {student.guardianName || student.fatherName || student.motherName || "N/A"}</p>
                </td>
                <td className="p-4">
                  <p className="text-xs font-semibold text-sage-gray-600">
                    {student.admissionDate ? new Date(student.admissionDate).toLocaleDateString("bn-BD") : "N/A"}
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
                            title="রিস্টোর করুন"
                          >
                            <RotateCcw size={16} />
                          </button>
                        </form>
                        
                        <form action={deleteStudentAction}>
                          <input type="hidden" name="id" value={student._id.toString()} />
                          <button 
                            type="submit"
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600 transition hover:bg-red-600 hover:text-white shadow-sm"
                            title="মুছে ফেলুন"
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
                      প্রোফাইল দেখুন
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
                    <p className="text-sm font-bold text-sage-secondary">কোন শিক্ষার্থী পাওয়া যায়নি</p>
                    <p className="text-xs text-sage-gray-500">ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন।</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
