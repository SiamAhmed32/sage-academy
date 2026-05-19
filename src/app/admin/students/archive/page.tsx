import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { connectDB } from "@/lib/mongodb";
import Student from "@/models/Student";
import { getClassLabel } from "@/constants/class-levels";
import { restoreStudentAction, deleteStudentAction } from "@/app/admin/actions";
import { ArrowLeft, RotateCcw, Trash2, User } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default async function StudentArchivePage() {
  await connectDB();

  const archivedStudents = await Student.find({ isActive: false })
    .sort({ updatedAt: -1 })
    .lean();

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
          title="শিক্ষার্থী আর্কাইভ (Archive)"
          description="আর্কাইভ করা শিক্ষার্থীদের তালিকা। এখান থেকে তথ্য পুনরুদ্ধার বা চিরস্থায়ীভাবে মুছে ফেলা যাবে।"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-sage-border bg-white shadow-sm">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-sage-border bg-sage-red-50/50">
              <th className="p-4 text-xs font-black uppercase text-sage-secondary">শিক্ষার্থী (Student)</th>
              <th className="p-4 text-xs font-black uppercase text-sage-secondary text-right">অ্যাকশন (Actions)</th>
            </tr>
          </thead>
          <tbody>
            {archivedStudents.length === 0 ? (
              <tr>
                <td colSpan={2} className="p-10 text-center text-sage-gray-400 italic">
                  আর্কাইভে কোনো শিক্ষার্থী নেই।
                </td>
              </tr>
            ) : (
              archivedStudents.map((student: any) => (
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
                        <p className="text-[10px] text-sage-gray-400">ID: {student.studentId} | {getClassLabel(student.classLevel)}</p>
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
                          পুনরুদ্ধার (Restore)
                        </button>
                      </form>
                      
                      <form action={deleteStudentAction}>
                        <input type="hidden" name="id" value={student._id.toString()} />
                        <button 
                          type="submit"
                          className="inline-flex h-9 items-center gap-2 rounded-lg border border-sage-border bg-white px-4 text-xs font-bold text-red-600 transition hover:bg-red-50 shadow-sm"
                        >
                          <Trash2 size={14} />
                          মুছে ফেলুন (Delete)
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
    </div>
  );
}
