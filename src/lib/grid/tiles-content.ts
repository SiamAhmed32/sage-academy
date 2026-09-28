import "server-only";

import { unstable_cache } from "next/cache";

import { connectDB } from "@/lib/mongodb";
import { ADMISSION_OPEN } from "@/lib/grid/sources/content";
import { staffRoles } from "@/lib/rbac";
import type { GridTile } from "@/components/admin/grid/GridTiles";
import AcademicBatch from "@/models/AcademicBatch";
import Notice from "@/models/Notice";
import PromotionCard from "@/models/PromotionCard";
import Teacher from "@/models/Teacher";
import Testimonial from "@/models/Testimonial";
import User from "@/models/User";

const dhakaToday = () => new Date(`${new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dhaka" }).format(new Date())}T00:00:00+06:00`);

async function loadTeacherTiles(): Promise<GridTile[]> {
  await connectDB();
  const [all, featured, noPhoto, subjects] = await Promise.all([
    Teacher.countDocuments({}),
    Teacher.countDocuments({ isFeatured: true }),
    Teacher.countDocuments({ $or: [{ image: "" }, { image: null }, { image: { $exists: false } }] }),
    Teacher.distinct("subject"),
  ]);
  return [
    { key: "all", label: "All teachers", value: all, icon: "teacher", tone: "blue", preset: "" },
    { key: "featured", label: "Featured", value: featured, icon: "check", tone: "green", preset: "featured", note: "Shown on the homepage" },
    { key: "regular", label: "Not featured", value: all - featured, icon: "dot", tone: "zinc", preset: "regular" },
    { key: "no-photo", label: "No photo", value: noPhoto, icon: "alert", tone: "amber", preset: "no-photo" },
    { key: "subjects", label: "Subjects", value: subjects.filter(Boolean).length, icon: "book", tone: "purple" },
  ];
}

export const teacherTiles = unstable_cache(loadTeacherTiles, ["admin-teacher-tiles"], { revalidate: 20 });

export async function userTiles(): Promise<GridTile[]> {
  await connectDB();
  const [all, staff, students, guardians, inactive] = await Promise.all([
    User.countDocuments({}),
    User.countDocuments({ role: { $in: staffRoles } }),
    User.countDocuments({ role: "student" }),
    User.countDocuments({ role: "guardian" }),
    User.countDocuments({ isActive: false }),
  ]);
  return [
    { key: "all", label: "All users", value: all, icon: "users", tone: "blue", preset: "" },
    { key: "staff", label: "Staff", value: staff, icon: "active", tone: "brand", preset: "staff", note: "Managers and admins" },
    { key: "students", label: "Students", value: students, icon: "teacher", tone: "green", preset: "students" },
    { key: "guardians", label: "Guardians", value: guardians, icon: "users", tone: "purple", preset: "guardians" },
    { key: "inactive", label: "Inactive", value: inactive, icon: "inactive", tone: "zinc", preset: "inactive" },
  ];
}

export async function noticeTiles(): Promise<GridTile[]> {
  await connectDB();
  const [all, published, drafts, exam, upcoming] = await Promise.all([
    Notice.countDocuments({}),
    Notice.countDocuments({ isPublished: true }),
    Notice.countDocuments({ isPublished: false }),
    Notice.countDocuments({ type: "exam" }),
    Notice.countDocuments({ examDate: { $gte: dhakaToday() } }),
  ]);
  return [
    { key: "all", label: "All notices", value: all, icon: "message", tone: "blue", preset: "" },
    { key: "published", label: "Published", value: published, icon: "check", tone: "green", preset: "published" },
    { key: "draft", label: "Drafts", value: drafts, icon: "inbox", tone: "amber", preset: "draft" },
    { key: "exam", label: "Exam notices", value: exam, icon: "book", tone: "purple", preset: "exam" },
    { key: "upcoming", label: "Upcoming exams", value: upcoming, icon: "calendar", tone: "red", preset: "upcoming" },
  ];
}

export async function promotionCardTiles(): Promise<GridTile[]> {
  await connectDB();
  const live = { isArchived: { $ne: true } };
  const [active, visible, featured, hidden, archived] = await Promise.all([
    PromotionCard.countDocuments(live),
    PromotionCard.countDocuments({ ...live, websiteVisible: true }),
    PromotionCard.countDocuments({ ...live, featured: true }),
    PromotionCard.countDocuments({ ...live, websiteVisible: false }),
    PromotionCard.countDocuments({ isArchived: true }),
  ]);
  return [
    { key: "active", label: "Active cards", value: active, icon: "layers", tone: "blue", preset: "" },
    { key: "visible", label: "On the website", value: visible, icon: "check", tone: "green", preset: "visible" },
    { key: "featured", label: "Featured", value: featured, icon: "active", tone: "brand", preset: "featured", note: "Homepage" },
    { key: "hidden", label: "Hidden", value: hidden, icon: "inactive", tone: "amber", preset: "hidden" },
    { key: "archived", label: "Archived", value: archived, icon: "archive", tone: "zinc", preset: "archived" },
  ];
}

export async function testimonialTiles(): Promise<GridTile[]> {
  await connectDB();
  const [all, published, unpublished, guardians, rating] = await Promise.all([
    Testimonial.countDocuments({}),
    Testimonial.countDocuments({ isFeatured: true }),
    Testimonial.countDocuments({ isFeatured: false }),
    Testimonial.countDocuments({ role: "guardian" }),
    Testimonial.aggregate<{ avg: number; n: number }>([
      { $match: { isFeatured: true } },
      { $group: { _id: null, avg: { $avg: "$rating" }, n: { $sum: 1 } } },
    ]).then((rows) => rows[0] ?? { avg: 0, n: 0 }),
  ]);
  return [
    { key: "all", label: "All testimonials", value: all, icon: "message", tone: "blue", preset: "" },
    { key: "published", label: "Published", value: published, icon: "check", tone: "green", preset: "published" },
    { key: "unpublished", label: "Unpublished", value: unpublished, icon: "inactive", tone: "amber", preset: "unpublished" },
    { key: "guardians", label: "From guardians", value: guardians, icon: "users", tone: "purple", preset: "guardians" },
    {
      key: "rating",
      label: "Average rating",
      value: rating.n ? `${rating.avg.toFixed(1)} / 5` : "—",
      icon: "active",
      tone: "brand",
      note: `${rating.n} published`,
    },
  ];
}

export async function websiteBatchTiles(): Promise<GridTile[]> {
  await connectDB();
  const live = { isArchived: { $ne: true } };
  const [active, open, inactive, archived, seats] = await Promise.all([
    AcademicBatch.countDocuments(live),
    AcademicBatch.countDocuments({ ...live, status: ADMISSION_OPEN }),
    AcademicBatch.countDocuments({ ...live, isActive: false }),
    AcademicBatch.countDocuments({ isArchived: true }),
    AcademicBatch.aggregate<{ total: number; available: number }>([
      { $match: { ...live, isActive: true } },
      { $group: { _id: null, total: { $sum: "$totalSeats" }, available: { $sum: "$availableSeats" } } },
    ]).then((rows) => rows[0] ?? { total: 0, available: 0 }),
  ]);
  return [
    { key: "all", label: "Website batches", value: active, icon: "batches", tone: "blue", preset: "" },
    { key: "open", label: "Admission open", value: open, icon: "check", tone: "green", preset: "open" },
    {
      key: "seats",
      label: "Seats available",
      value: `${seats.available}/${seats.total}`,
      icon: "users",
      tone: "purple",
      note: "Active batches",
    },
    { key: "inactive", label: "Inactive", value: inactive, icon: "inactive", tone: "amber", preset: "inactive" },
    { key: "archived", label: "Archived", value: archived, icon: "archive", tone: "zinc", preset: "archived" },
  ];
}
