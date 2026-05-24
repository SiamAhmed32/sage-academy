// Force rebuild to clear stale slugify error
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import PromotionCard from "@/models/PromotionCard";
import AcademicBatch from "@/models/AcademicBatch";
import { requireRole, adminRoles } from "@/lib/rbac";
import { uploadBatchImage } from "@/lib/upload-batch-image";
import { buildPublicSlug } from "@/lib/public-slug";

export async function GET() {
  try {
    await connectDB();
    const cards = await PromotionCard.find({}).sort({ order: 1, createdAt: -1 }).populate("linkedBatch");
    return NextResponse.json({ success: true, data: cards });
  } catch (error) {
    console.error("Promotion cards fetch error:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch promotion cards" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireRole(adminRoles);
    await connectDB();
    const formData = await req.formData();
    
    const imageFile = formData.get("imageFile") as File;
    let imageUrl = "";
    if (imageFile && imageFile.size > 0) {
      imageUrl = await uploadBatchImage(imageFile);
    }

    const features = [
      formData.get("feature1"),
      formData.get("feature2"),
      formData.get("feature3"),
      formData.get("feature4"),
      formData.get("feature5"),
    ].filter((f): f is string => typeof f === "string" && f.length > 0);

    const title = formData.get("title") as string;
    const linkedBatch = formData.get("linkedBatch")?.toString() || "";
    const batch = linkedBatch
      ? await AcademicBatch.findById(linkedBatch).select("batchCode classLevel").lean()
      : null;
    const slug = buildPublicSlug({
      title,
      batchCode: batch?.batchCode,
      classLevel: batch?.classLevel,
      fallback: `batch-${Date.now()}`,
    });

    const payload = {
      title,
      slug: `${slug}-${Date.now()}`,
      image: imageUrl,
      badge: (formData.get("badge") as string) || "ভর্তি চলছে",
      features,
      overview: (formData.get("overview") as string)?.trim() || "",
      linkedBatch: linkedBatch || null,
      websiteVisible: formData.get("websiteVisible") === "on",
      featured: formData.get("featured") === "on",
      order: Number(formData.get("order") || 0),
    };

    const newCard = await PromotionCard.create(payload);
    return NextResponse.json({ success: true, data: newCard });
  } catch (error) {
    console.error("Promotion card creation error:", error);
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : "Failed to create promotion card" }, { status: 500 });
  }
}
