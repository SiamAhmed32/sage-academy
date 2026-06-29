import { NextRequest } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { successResponse } from "@/lib/api-response";
import { NotFoundError } from "@/lib/errors";
import { connectDB } from "@/lib/mongodb";
import ExamAttempt from "@/models/ExamAttempt";
import ExamProgram from "@/models/ExamProgram";

type RouteContext = { params: Promise<Record<string, string>> };

export const GET = withApiHandler(async (req: NextRequest, context: RouteContext) => {
  await connectDB();
  const { slug } = await context.params;
  const limit = Math.min(100, Math.max(1, Number(req.nextUrl.searchParams.get("limit") || 50)));

  const program = await ExamProgram.findOne({ slug, status: "published", deliveryMode: "online" }).lean();
  if (!program) throw new NotFoundError("Exam not found");
  if (!program.showLeaderboard) {
    return successResponse({ items: [], showLeaderboard: false }, "Leaderboard disabled");
  }

  const attempts = await ExamAttempt.find({
    programId: program._id,
    status: "submitted",
  })
    .sort({ score: -1, durationSeconds: 1, submittedAt: 1 })
    .limit(limit)
    .select("name score totalMarks durationSeconds submittedAt")
    .lean();

  const items = attempts.map((row, index) => ({
    rank: index + 1,
    name: row.name,
    score: row.score,
    totalMarks: row.totalMarks,
    durationSeconds: row.durationSeconds,
    submittedAt: row.submittedAt,
  }));

  return successResponse({ items, showLeaderboard: true, title: program.title }, "Leaderboard fetched");
});
