import "server-only";

import { unstable_cache } from "next/cache";

import { allActiveSlots, getDashboardData } from "@/lib/academy/queries";
import { connectDB } from "@/lib/mongodb";
import AdmissionRequest from "@/models/AdmissionRequest";
import ContactRequest from "@/models/ContactRequest";
import FreeClassLead from "@/models/FreeClassLead";

async function leadCounts() {
  const start = new Date(`${new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dhaka" }).format(new Date())}T00:00:00+06:00`);
  const [admissions, contacts, freeClass, recentRequests] = await Promise.all([
    AdmissionRequest.countDocuments({ createdAt: { $gte: start } }),
    ContactRequest.countDocuments({ createdAt: { $gte: start } }),
    FreeClassLead.countDocuments({ createdAt: { $gte: start } }),
    AdmissionRequest.find({ status: "new", isArchived: { $ne: true } })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("studentName className phone createdAt")
      .lean<{ _id: unknown; studentName?: string; className?: string; phone?: string; createdAt: Date }[]>(),
  ]);
  return {
    today: admissions + contacts + freeClass,
    recentRequests: recentRequests.map((request) => ({
      id: String(request._id),
      studentName: request.studentName ?? "",
      className: request.className ?? "",
      phone: request.phone ?? "",
      createdAt: new Date(request.createdAt).toISOString(),
    })),
  };
}

async function loadAdminHome() {
  await connectDB();
  const [data, slots, leads] = await Promise.all([getDashboardData(), allActiveSlots(), leadCounts()]);
  return { data, slots, leads };
}

/** Shared dashboard numbers. The signed-in name is added per request and is not part of this cache. */
export const getAdminHome = unstable_cache(loadAdminHome, ["admin-home"], { revalidate: 20 });
