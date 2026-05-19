import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import AcademicBatch from "@/models/AcademicBatch";
import { requireRole, adminRoles } from "@/lib/rbac";
import { batchPayloadFromFormData } from "@/lib/batch-request";
import { createAcademicBatchSchema } from "@/schemas/academic-batch";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const batches = await AcademicBatch.find({ isArchived: { $ne: true } }).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: batches });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Failed to fetch academic batches" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireRole(adminRoles);
    await connectDB();
    const formData = await req.formData();
    
    const body = await batchPayloadFromFormData(formData);
    const validatedData = createAcademicBatchSchema.parse(body);

    const newBatch = await AcademicBatch.create(validatedData);
    return NextResponse.json({ success: true, data: newBatch });
  } catch (error) {
    console.error("Academic batch creation error:", error);
    return NextResponse.json({ 
      success: false, 
      message: error instanceof Error ? error.message : "Failed to create academic batch" 
    }, { status: 500 });
  }
}
