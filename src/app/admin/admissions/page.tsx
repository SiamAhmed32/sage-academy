import { Metadata } from "next";
import { connectDB } from "@/lib/mongodb";
import AdmissionRequest from "@/models/AdmissionRequest";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdmissionTable } from "@/components/admin/admissions/AdmissionTable";
import { AdmissionFilters } from "@/components/admin/admissions/AdmissionFilters";

export const metadata: Metadata = {
  title: "Admission Management | SAGE Admin",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface AdmissionPageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
    class?: string;
    view?: string;
  }>;
}

export default async function AdmissionPage({ searchParams }: AdmissionPageProps) {
  // 1. Await the searchParams (Crucial for Next.js 15+)
  const resolvedParams = await searchParams;
  const view = resolvedParams.view === "archived" ? "archived" : "active";
  const { search, status, class: className } = resolvedParams;

  // 2. Ensure DB is connected
  await connectDB();
  
  // 3. Build the query
  const query: any = {};
  
  if (view === "archived") {
    query.isArchived = true;
  } else {
    // Show leads that are NOT archived (handles false or missing fields)
    query.isArchived = { $ne: true };
  }
  
  if (search) {
    query.$or = [
      { studentName: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
    ];
  }

  if (status && status !== "all") query.status = status;
  if (className && className !== "all") query.className = className;

  // 4. Fetch data with explicit error handling
  const rawRequests = await AdmissionRequest.find(query).sort({ createdAt: -1 }).lean();
  const requests = JSON.parse(JSON.stringify(rawRequests));

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <AdminPageHeader 
        title="ভর্তি আবেদনসমূহ" 
        description={`SAGE Academy - ${view === "archived" ? "আর্কাইভড" : "একটিভ"} ভর্তি আবেদনসমূহ ম্যানেজ করুন।`}
      />

      <div className="space-y-4">
        <AdmissionFilters />
        <AdmissionTable requests={requests} />
      </div>
    </div>
  );
}
