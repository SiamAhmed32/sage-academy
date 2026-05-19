import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import QuizSubmission from "@/models/QuizSubmission";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    
    // Server-side score calculation (optional but safer)
    // For now, we trust the client or calculate here if we have questions
    
    const submission = await QuizSubmission.create(body);
    return NextResponse.json({ success: true, data: submission });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Submission failed" }, { status: 500 });
  }
}
