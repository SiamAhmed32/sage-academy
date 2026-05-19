import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import QuizQuestion from "@/models/QuizQuestion";
import mongoose from "mongoose";

/** DB-backed quiz list must not be statically cached at build time. */
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ class: string }> }
) {
  try {
    const { class: classParam } = await context.params;
    const classLevel = parseInt(String(classParam ?? "").trim(), 10);

    if (!Number.isFinite(classLevel) || classLevel < 5 || classLevel > 12) {
      return NextResponse.json(
        { success: false, message: "সঠিক শ্রেণী নির্বাচন করুন (৫–১২)।", data: [] },
        { status: 400 }
      );
    }

    await connectDB();
    const dbName = mongoose.connection.name;

    const baseFilter = {
      classLevel,
      /** Treat missing isActive as visible (older docs). */
      isActive: { $ne: false },
    };

    let questions = await QuizQuestion.find(baseFilter).sort({ order: 1, createdAt: 1 }).lean();

    // Legacy: class stored as string "6"
    if (!questions.length) {
      questions = await QuizQuestion.find({
        classLevel: String(classLevel),
        isActive: { $ne: false },
      })
        .sort({ order: 1, createdAt: 1 })
        .lean();
    }

    const payload = questions.map((q) => ({
      ...q,
      _id: q._id?.toString(),
    }));

    return NextResponse.json({
      success: true,
      data: payload,
      _debug:
        process.env.NODE_ENV === "development"
          ? { db: dbName, classLevel, count: payload.length }
          : undefined,
    });
  } catch (error) {
    console.error("[Quiz API Error]:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch questions", data: [] },
      { status: 500 }
    );
  }
}
