import "server-only";

import type { Model } from "mongoose";

import { connectDB } from "@/lib/mongodb";
import { assessmentPresetMatch, noExplanation } from "@/lib/grid/sources/assessments";
import type { GridTile } from "@/components/admin/grid/GridTiles";
import { getAdminClassLabel } from "@/constants/admin-display";
import Exam from "@/models/Exam";
import ModelTest from "@/models/ModelTest";
import QuizQuestion from "@/models/QuizQuestion";

async function assessmentTiles(model: Model<unknown>, allLabel: string): Promise<GridTile[]> {
  await connectDB();
  const [all, published, drafts, hidden, archived] = await Promise.all([
    model.countDocuments(assessmentPresetMatch("")),
    model.countDocuments(assessmentPresetMatch("published")),
    model.countDocuments(assessmentPresetMatch("draft")),
    model.countDocuments(assessmentPresetMatch("hidden")),
    model.countDocuments(assessmentPresetMatch("archived")),
  ]);
  return [
    { key: "all", label: allLabel, value: all, icon: "calendar", tone: "blue", preset: "", note: "Not archived" },
    { key: "published", label: "Published", value: published, icon: "check", tone: "green", preset: "published", note: "On the website" },
    { key: "draft", label: "Drafts", value: drafts, icon: "inbox", tone: "amber", preset: "draft" },
    { key: "hidden", label: "Hidden", value: hidden, icon: "inactive", tone: "purple", preset: "hidden" },
    { key: "archived", label: "Archived", value: archived, icon: "archive", tone: "zinc", preset: "archived" },
  ];
}

export async function examTiles(): Promise<GridTile[]> {
  return assessmentTiles(Exam as Model<unknown>, "All exams");
}

export async function modelTestTiles(): Promise<GridTile[]> {
  return assessmentTiles(ModelTest as Model<unknown>, "All model tests");
}

export async function quizQuestionTiles(): Promise<GridTile[]> {
  await connectDB();
  const [total, active, inactive, missing, byClass] = await Promise.all([
    QuizQuestion.countDocuments({}),
    QuizQuestion.countDocuments({ isActive: { $ne: false } }),
    QuizQuestion.countDocuments({ isActive: false }),
    QuizQuestion.countDocuments(noExplanation),
    QuizQuestion.aggregate<{ _id: number; n: number }>([
      { $match: { isActive: { $ne: false } } },
      { $group: { _id: "$classLevel", n: { $sum: 1 } } },
      { $sort: { n: -1, _id: 1 } },
    ]),
  ]);
  const top = byClass[0];
  return [
    { key: "all", label: "Total questions", value: total, icon: "book", tone: "blue", preset: "" },
    { key: "active", label: "Active", value: active, icon: "check", tone: "green", preset: "active", note: "Shown in the quiz" },
    { key: "inactive", label: "Inactive", value: inactive, icon: "inactive", tone: "zinc", preset: "inactive" },
    { key: "no-explanation", label: "No explanation", value: missing, icon: "alert", tone: "amber", preset: "no-explanation" },
    {
      key: "classes",
      label: "Classes covered",
      value: byClass.length,
      icon: "layers",
      tone: "purple",
      note: top ? `Most: ${getAdminClassLabel(top._id)} (${top.n})` : "No active questions",
    },
  ];
}
