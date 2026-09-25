import { Metadata } from "next";
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import AdmissionRequest from "@/models/AdmissionRequest";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdmissionInfoGrid } from "@/components/admin/admissions/details/AdmissionInfoGrid";
import { AdmissionAddressBox } from "@/components/admin/admissions/details/AdmissionAddressBox";
import { AdmissionActionSidebar } from "@/components/admin/admissions/details/AdmissionActionSidebar";
import { ChevronLeft, UserCheck, UserPlus } from "lucide-react";
import AcademyStudent from "@/models/academy/AcademyStudent";
import Link from "next/link";
import { formatAdminDateTime } from "@/lib/admin-format";

export const metadata: Metadata = {
  title: "Lead Details | SAGE Admin",
};

export default async function AdmissionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await connectDB();

  // CRITICAL FIX: Plain-ify the Mongoose object for Client Components
  const rawRequest = await AdmissionRequest.findById(id).lean();

  if (!rawRequest) {
    notFound();
  }

  const request = JSON.parse(JSON.stringify(rawRequest));
  // If this request was already turned into a student, link to them instead.
  const admitted = await AcademyStudent.findOne({ admissionRequestId: id })
    .select("studentId")
    .lean<{ _id: unknown; studentId: string }>();

  return (
    <div className="min-h-screen space-y-8 p-4 sm:p-6 lg:p-8 bg-sage-red-50/20">
      <div className="flex flex-col gap-6">
        <Link 
          href="/admin/admissions" 
          className="inline-flex items-center gap-2 text-sm font-bold text-sage-gray-500 hover:text-sage-primary transition"
        >
          <ChevronLeft size={16} />
          Back to Leads
        </Link>
        
        <AdminPageHeader 
          title={request.studentName || "Admission Application"} 
          description={`Lead ID: #${request._id.toString().slice(-8).toUpperCase()} | Submitted on ${formatAdminDateTime(request.createdAt)}`}
          action={
            admitted ? (
              <Link href={`/admin/academy/students/${String(admitted._id)}`} className="btn-secondary">
                <UserCheck size={17} /> Admitted as {admitted.studentId}
              </Link>
            ) : (
              <Link href={`/admin/academy/admission?request=${request._id}`} className="btn-primary">
                <UserPlus size={17} /> Admit student
              </Link>
            )
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-8">
          <div className="rounded-[2.5rem] border border-sage-border bg-white p-8 shadow-xl shadow-sage-red-100/10">
            <h3 className="mb-8 text-xl font-black text-sage-secondary uppercase tracking-tight">
              Student & Academic Information
            </h3>
            <AdmissionInfoGrid item={request} />
            
            <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
              <AdmissionAddressBox title="Present Address" address={request.presentAddress} />
              <AdmissionAddressBox title="Permanent Address" address={request.permanentAddress} />
            </div>

            {request.message && (
              <div className="mt-10 rounded-2xl bg-sage-red-50/50 p-6 border border-sage-red-100">
                <p className="text-[10px] font-black uppercase tracking-widest text-sage-primary mb-2">Message from User</p>
                <p className="text-sm font-bold text-sage-secondary leading-relaxed">{request.message}</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-8">
          <AdmissionActionSidebar request={request} />
        </div>
      </div>
    </div>
  );
}
