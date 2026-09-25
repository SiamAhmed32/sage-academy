import "server-only";

import type { Model } from "mongoose";

import type { GridTile } from "@/components/admin/grid/GridTiles";
import {
  admissionPresetMatch,
  assessmentPresetMatch,
  contactPresetMatch,
  freeClassPresetMatch,
  quizClassKey,
  quizPresetMatch,
} from "@/lib/grid/sources/leads";
import { connectDB } from "@/lib/mongodb";
import AdmissionRequest from "@/models/AdmissionRequest";
import AssessmentRegistration from "@/models/AssessmentRegistration";
import ContactRequest from "@/models/ContactRequest";
import FreeClassLead from "@/models/FreeClassLead";
import QuizSubmission from "@/models/QuizSubmission";

type AnyModel = Model<Record<string, unknown>>;

/** Count documents for each preset, using the same match the grid applies. */
function counter(model: unknown, match: (preset?: string) => Record<string, unknown>) {
  return (preset?: string, extra: Record<string, unknown> = {}) => (model as AnyModel).countDocuments({ ...match(preset), ...extra });
}

const todayNote = (count: number) => `${count} today`;

export async function admissionTiles(): Promise<GridTile[]> {
  await connectDB();
  const count = counter(AdmissionRequest, admissionPresetMatch);
  const today = admissionPresetMatch("today").createdAt;
  const [all, fresh, freshToday, followUp, closed, archived] = await Promise.all([
    count(""),
    count("new"),
    count("new", { createdAt: today }),
    count("follow-up"),
    count("closed"),
    count("archived"),
  ]);
  return [
    { key: "all", label: "Active applications", value: all, icon: "inbox", tone: "blue", preset: "" },
    { key: "new", label: "New", value: fresh, icon: "dot", tone: "brand", preset: "new", note: todayNote(freshToday) },
    { key: "follow-up", label: "In follow-up", value: followUp, icon: "clock", tone: "amber", preset: "follow-up", note: "Contacted or qualified" },
    { key: "closed", label: "Closed", value: closed, icon: "check", tone: "green", preset: "closed" },
    { key: "archived", label: "Archived", value: archived, icon: "archive", tone: "zinc", preset: "archived" },
  ];
}

export async function contactTiles(): Promise<GridTile[]> {
  await connectDB();
  const count = counter(ContactRequest, contactPresetMatch);
  const [all, today, fresh, contacted, closed, spam] = await Promise.all([
    count(""),
    count("today"),
    count("new"),
    count("contacted"),
    count("closed"),
    count("spam"),
  ]);
  return [
    { key: "all", label: "All messages", value: all, icon: "message", tone: "blue", preset: "", note: todayNote(today) },
    { key: "new", label: "New", value: fresh, icon: "dot", tone: "brand", preset: "new" },
    { key: "contacted", label: "Contacted", value: contacted, icon: "clock", tone: "amber", preset: "contacted" },
    { key: "closed", label: "Closed", value: closed, icon: "check", tone: "green", preset: "closed" },
    { key: "spam", label: "Spam", value: spam, icon: "alert", tone: "zinc", preset: "spam" },
  ];
}

export async function freeClassLeadTiles(): Promise<GridTile[]> {
  await connectDB();
  const count = counter(FreeClassLead, freeClassPresetMatch);
  const [all, today, fresh, contacted, scheduled, attended] = await Promise.all([
    count(""),
    count("today"),
    count("new"),
    count("contacted"),
    count("scheduled"),
    count("attended"),
  ]);
  return [
    { key: "all", label: "All leads", value: all, icon: "users", tone: "blue", preset: "", note: todayNote(today) },
    { key: "new", label: "New", value: fresh, icon: "dot", tone: "brand", preset: "new" },
    { key: "contacted", label: "Contacted", value: contacted, icon: "clock", tone: "amber", preset: "contacted" },
    { key: "scheduled", label: "Scheduled", value: scheduled, icon: "calendar", tone: "purple", preset: "scheduled" },
    { key: "attended", label: "Attended", value: attended, icon: "check", tone: "green", preset: "attended" },
  ];
}

export async function assessmentRegistrationTiles(): Promise<GridTile[]> {
  await connectDB();
  const count = counter(AssessmentRegistration, assessmentPresetMatch);
  const [all, week, fresh, contacted, confirmed, attended] = await Promise.all([
    count(""),
    count("week"),
    count("new"),
    count("contacted"),
    count("confirmed"),
    count("attended"),
  ]);
  return [
    { key: "all", label: "All registrations", value: all, icon: "book", tone: "blue", preset: "", note: `${week} in the last 7 days` },
    { key: "new", label: "New", value: fresh, icon: "dot", tone: "brand", preset: "new" },
    { key: "contacted", label: "Contacted", value: contacted, icon: "clock", tone: "amber", preset: "contacted" },
    { key: "confirmed", label: "Confirmed", value: confirmed, icon: "active", tone: "purple", preset: "confirmed" },
    { key: "attended", label: "Attended", value: attended, icon: "check", tone: "green", preset: "attended" },
  ];
}

export async function quizLeadTiles(): Promise<GridTile[]> {
  await connectDB();
  const count = counter(QuizSubmission, quizPresetMatch);
  const [all, today, fresh, contacted, qualified, whatsapp] = await Promise.all([
    count(""),
    count("today"),
    count("new"),
    count("contacted"),
    count("qualified"),
    count("whatsapp"),
  ]);
  return [
    { key: "all", label: "All quiz leads", value: all, icon: "users", tone: "blue", preset: "", note: todayNote(today) },
    { key: "new", label: "New", value: fresh, icon: "dot", tone: "brand", preset: "new" },
    { key: "contacted", label: "Contacted", value: contacted, icon: "clock", tone: "amber", preset: "contacted" },
    { key: "qualified", label: "Qualified", value: qualified, icon: "check", tone: "green", preset: "qualified" },
    { key: "whatsapp", label: "Asked for WhatsApp", value: whatsapp, icon: "message", tone: "purple", preset: "whatsapp" },
  ];
}

// ───────────── Filter options read from the data ─────────────

const cleanStrings = (values: unknown[]) =>
  (values as unknown[])
    .filter((value): value is string => typeof value === "string" && value.trim() !== "")
    .sort((a, b) => a.localeCompare(b, "en"));

export async function freeClassLeadClassLabels(): Promise<string[]> {
  await connectDB();
  return cleanStrings(await (FreeClassLead as AnyModel).distinct("classLabel"));
}

export async function assessmentRegistrationOptions(): Promise<{ assessmentTypes: string[]; classLabels: string[] }> {
  await connectDB();
  const [assessmentTypes, classLabels] = await Promise.all([
    (AssessmentRegistration as AnyModel).distinct("assessmentType"),
    (AssessmentRegistration as AnyModel).distinct("classLabel"),
  ]);
  return { assessmentTypes: cleanStrings(assessmentTypes), classLabels: cleanStrings(classLabels) };
}

/** Class levels present in quiz submissions, keyed the way the grid filters them. */
export async function quizClassOptions(): Promise<{ value: string; label: string }[]> {
  await connectDB();
  const levels = (await (QuizSubmission as AnyModel).distinct("classLevel"))
    .map(Number)
    .filter(Number.isFinite)
    .sort((a, b) => a - b);
  return levels.map((level) => ({ value: quizClassKey(level), label: `Class ${level}` }));
}
