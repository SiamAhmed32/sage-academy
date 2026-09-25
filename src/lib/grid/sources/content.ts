import "server-only";

import type { PipelineStage } from "mongoose";

import { runGridAggregate, runGridFind, type GridField } from "@/lib/grid/query";
import type { GridSource } from "@/lib/grid/registry";
import { canManageUsers, staffRoles } from "@/lib/rbac";
import AcademicBatch from "@/models/AcademicBatch";
import Notice from "@/models/Notice";
import PromotionCard from "@/models/PromotionCard";
import Teacher from "@/models/Teacher";
import Testimonial from "@/models/Testimonial";
import User from "@/models/User";

const id = (value: unknown) => (value == null ? "" : String(value));
const iso = (value: unknown) => (value ? new Date(value as string).toISOString() : "");
const str = (value: unknown) => (typeof value === "string" ? value : value == null ? "" : String(value));
const dhakaToday = () => new Date(`${new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dhaka" }).format(new Date())}T00:00:00+06:00`);

/** Stored "Admission open" value of the website batch / promotion card status enum. */
export const ADMISSION_OPEN = "ভর্তি চলছে"; // admin-language-allow: persisted enum value

// ───────────── Teachers ─────────────

const teacherFields: Record<string, GridField> = {
  name: { path: "name", type: "text" },
  subject: { path: "subject", type: "set" },
  designation: { path: "designation", type: "text" },
  experience: { path: "experience", type: "text" },
  quote: { path: "quote", type: "text" },
  isFeatured: { path: "isFeatured", type: "boolean" },
  order: { path: "order", type: "number" },
  createdAt: { path: "createdAt", type: "date" },
};

const noPhoto = { $or: [{ image: "" }, { image: null }, { image: { $exists: false } }] };

type TeacherLean = {
  _id: unknown;
  name?: string;
  subject?: string;
  designation?: string;
  experience?: string;
  quote?: string;
  image?: string;
  isFeatured?: boolean;
  order?: number;
  createdAt?: Date;
};

export const teachersSource: GridSource = {
  access: "staff",
  run: async (request) => {
    const base =
      request.preset === "featured"
        ? { isFeatured: true }
        : request.preset === "regular"
          ? { isFeatured: { $ne: true } }
          : request.preset === "no-photo"
            ? noPhoto
            : {};
    return runGridFind({
      model: Teacher,
      request,
      fields: teacherFields,
      searchPaths: ["name", "subject", "designation"],
      base,
      defaultSort: { order: 1, name: 1 },
      select: "name subject designation experience quote image isFeatured order createdAt",
      toRows: async (docs) => {
        const { teacherTeaching } = await import("@/lib/academy/queries");
        const teaching = await teacherTeaching();
        return (docs as TeacherLean[]).map((doc) => {
          const work = teaching.get(id(doc._id));
          return {
          id: id(doc._id),
          batchCount: new Set(work?.batches.map((item) => item.batchId) ?? []).size,
          teaches: [...new Set(work?.batches.map((item) => item.subjectName) ?? [])].join(", "),
          weeklyClasses: work?.weekly ?? 0,
          name: str(doc.name),
          subject: str(doc.subject),
          designation: str(doc.designation),
          experience: str(doc.experience),
          quote: str(doc.quote),
          image: str(doc.image),
          isFeatured: Boolean(doc.isFeatured),
          order: Number(doc.order) || 0,
          createdAt: iso(doc.createdAt),
          };
        });
      },
    });
  },
};

// ───────────── Users ─────────────

const userFields: Record<string, GridField> = {
  name: { path: "name", type: "text" },
  email: { path: "email", type: "text" },
  phone: { path: "phone", type: "text" },
  role: { path: "role", type: "set" },
  isActive: { path: "isActive", type: "boolean" },
  lastLoginAt: { path: "lastLoginAt", type: "date" },
  createdAt: { path: "createdAt", type: "date" },
};

type UserLean = {
  _id: unknown;
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  isActive?: boolean;
  lastLoginAt?: Date | null;
  createdAt?: Date;
};

export const usersSource: GridSource = {
  access: "staff",
  run: async (request, user) => {
    const base =
      request.preset === "staff"
        ? { role: { $in: staffRoles } }
        : request.preset === "students"
          ? { role: "student" }
          : request.preset === "guardians"
            ? { role: "guardian" }
            : request.preset === "active"
              ? { isActive: true }
              : request.preset === "inactive"
                ? { isActive: false }
                : {};
    const canEdit = canManageUsers(user.role);
    return runGridFind({
      model: User,
      request,
      fields: userFields,
      searchPaths: ["name", "email", "phone"],
      base,
      defaultSort: { createdAt: -1 },
      // Only safe columns: never the password, OTP or reset token fields.
      select: "name email phone role isActive lastLoginAt createdAt",
      toRows: (docs) =>
        (docs as UserLean[]).map((doc) => {
          const role = str(doc.role) || "student";
          return {
            id: id(doc._id),
            name: str(doc.name),
            email: str(doc.email),
            phone: str(doc.phone),
            role,
            isActive: doc.isActive !== false,
            lastLoginAt: iso(doc.lastLoginAt),
            createdAt: iso(doc.createdAt),
            isSelf: id(doc._id) === user.id,
            editable: canEdit && !(role === "super_admin" && user.role !== "super_admin"),
          };
        }),
    });
  },
};

// ───────────── Notices ─────────────

const noticeFields: Record<string, GridField> = {
  title: { path: "title", type: "text" },
  type: { path: "type", type: "set" },
  // Class level is matched as text: set filters send strings.
  classLevel: { path: "classKey", type: "set" },
  batchCode: { path: "batchCode", type: "text" },
  topic: { path: "topic", type: "text" },
  examDate: { path: "examDate", type: "date" },
  publishedAt: { path: "publishedAt", type: "date" },
  status: { path: "status", type: "set" },
};

export const noticesSource: GridSource = {
  access: "staff",
  run: async (request) => {
    const presetMatch: Record<string, unknown> =
      request.preset === "published"
        ? { isPublished: true }
        : request.preset === "draft"
          ? { isPublished: false }
          : request.preset === "exam"
            ? { type: "exam" }
            : request.preset === "upcoming"
              ? { examDate: { $gte: dhakaToday() } }
              : {};
    const prepare: PipelineStage[] = [
      { $match: presetMatch },
      { $lookup: { from: "academy_batches", localField: "batch", foreignField: "_id", as: "batchDoc" } },
      {
        $addFields: {
          batchCode: { $ifNull: [{ $first: "$batchDoc.code" }, ""] },
          batchClassLevel: { $ifNull: [{ $first: "$batchDoc.classLevel" }, null] },
          classKey: { $ifNull: [{ $toString: "$classLevel" }, ""] },
          status: { $cond: ["$isPublished", "published", "draft"] },
        },
      },
      { $project: { batchDoc: 0 } },
    ];
    return runGridAggregate({
      model: Notice as never,
      request,
      fields: noticeFields,
      searchPaths: ["title", "topic", "details", "batchCode"],
      prepare,
      defaultSort: { publishedAt: -1, createdAt: -1 },
      toRows: (docs) =>
        docs.map((doc) => ({
          id: id(doc._id),
          title: str(doc.title),
          type: str(doc.type) || "general",
          audience: str(doc.audience) || "all",
          classLevel: doc.classLevel == null ? null : Number(doc.classLevel),
          batchId: id(doc.batch),
          batchCode: str(doc.batchCode),
          batchClassLevel: doc.batchClassLevel == null ? null : Number(doc.batchClassLevel),
          topic: str(doc.topic),
          details: str(doc.details),
          isPublished: Boolean(doc.isPublished),
          status: str(doc.status),
          examDate: iso(doc.examDate),
          publishedAt: iso(doc.publishedAt),
        })),
    });
  },
};

// ───────────── Promotion cards ─────────────

const promotionFields: Record<string, GridField> = {
  title: { path: "title", type: "text" },
  badge: { path: "badge", type: "set" },
  batchLabel: { path: "batchLabel", type: "text" },
  visibility: { path: "visibility", type: "set" },
  featured: { path: "featured", type: "boolean" },
  order: { path: "order", type: "number" },
  createdAt: { path: "createdAt", type: "date" },
};

export const promotionCardsSource: GridSource = {
  access: "staff",
  run: async (request) => {
    const live = { isArchived: { $ne: true } };
    const presetMatch: Record<string, unknown> =
      request.preset === "archived"
        ? { isArchived: true }
        : request.preset === "visible"
          ? { ...live, websiteVisible: true }
          : request.preset === "hidden"
            ? { ...live, websiteVisible: false }
            : request.preset === "featured"
              ? { ...live, featured: true }
              : request.preset === "unlinked"
                ? { ...live, linkedBatch: null, academyBatch: null }
                : live;
    const prepare: PipelineStage[] = [
      { $match: presetMatch },
      { $lookup: { from: "academy_batches", localField: "academyBatch", foreignField: "_id", as: "newBatch" } },
      // Old website batches live in the "batches" collection.
      { $lookup: { from: "batches", localField: "linkedBatch", foreignField: "_id", as: "oldBatch" } },
      {
        $addFields: {
          newBatchId: { $first: "$newBatch._id" },
          newBatchCode: { $first: "$newBatch.code" },
          oldBatchId: { $first: "$oldBatch._id" },
          oldBatchTitle: { $first: "$oldBatch.title" },
          oldBatchCode: { $first: "$oldBatch.batchCode" },
        },
      },
      {
        $addFields: {
          batchLabel: { $ifNull: ["$newBatchCode", { $ifNull: ["$oldBatchTitle", ""] }] },
          visibility: {
            $cond: [{ $eq: ["$isArchived", true] }, "archived", { $cond: [{ $eq: ["$websiteVisible", false] }, "hidden", "visible"] }],
          },
        },
      },
      { $project: { newBatch: 0, oldBatch: 0 } },
    ];
    return runGridAggregate({
      model: PromotionCard as never,
      request,
      fields: promotionFields,
      searchPaths: ["title", "overview", "features", "batchLabel", "oldBatchCode"],
      prepare,
      defaultSort: { order: 1, createdAt: -1 },
      toRows: (docs) =>
        docs.map((doc) => {
          const isNew = Boolean(doc.newBatchId);
          const hasOld = Boolean(doc.oldBatchId);
          return {
            id: id(doc._id),
            title: str(doc.title) || "Untitled card",
            image: str(doc.image),
            badge: str(doc.badge) || ADMISSION_OPEN,
            features: Array.isArray(doc.features) ? (doc.features as unknown[]).map(str).filter(Boolean) : [],
            overview: str(doc.overview),
            // The edit form's batch select holds new batches as "academy:<id>".
            linkedBatch: isNew ? `academy:${id(doc.newBatchId)}` : hasOld ? id(doc.oldBatchId) : "",
            batchLabel: str(doc.batchLabel),
            batchSub: isNew ? "New batch" : hasOld ? str(doc.oldBatchCode) || "Old website batch" : "",
            visibility: str(doc.visibility),
            websiteVisible: doc.websiteVisible !== false,
            featured: Boolean(doc.featured),
            order: Number(doc.order) || 0,
            isArchived: Boolean(doc.isArchived),
            createdAt: iso(doc.createdAt),
          };
        }),
    });
  },
};

// ───────────── Testimonials ─────────────

const testimonialFields: Record<string, GridField> = {
  name: { path: "name", type: "text" },
  role: { path: "role", type: "set" },
  className: { path: "className", type: "text" },
  review: { path: "review", type: "text" },
  rating: { path: "rating", type: "number" },
  isFeatured: { path: "isFeatured", type: "boolean" },
  order: { path: "order", type: "number" },
  source: { path: "source", type: "text" },
  createdAt: { path: "createdAt", type: "date" },
};

type TestimonialLean = {
  _id: unknown;
  name?: string;
  role?: string;
  className?: string;
  review?: string;
  rating?: number;
  image?: string;
  isFeatured?: boolean;
  order?: number;
  source?: string;
  createdAt?: Date;
};

export const testimonialsSource: GridSource = {
  access: "staff",
  run: async (request) => {
    const base =
      request.preset === "published"
        ? { isFeatured: true }
        : request.preset === "unpublished"
          ? { isFeatured: false }
          : request.preset === "students"
            ? { role: "student" }
            : request.preset === "guardians"
              ? { role: "guardian" }
              : {};
    return runGridFind({
      model: Testimonial,
      request,
      fields: testimonialFields,
      searchPaths: ["name", "className", "review"],
      base,
      defaultSort: { order: 1, createdAt: -1 },
      select: "name role className review rating image isFeatured order source createdAt",
      toRows: (docs) =>
        (docs as TestimonialLean[]).map((doc) => ({
          id: id(doc._id),
          name: str(doc.name),
          role: doc.role === "guardian" ? "guardian" : "student",
          className: str(doc.className),
          review: str(doc.review),
          rating: Number(doc.rating) || 5,
          image: str(doc.image),
          isFeatured: doc.isFeatured !== false,
          order: Number(doc.order) || 0,
          source: str(doc.source),
          createdAt: iso(doc.createdAt),
        })),
    });
  },
};

// ───────────── Website batches (old AcademicBatch) ─────────────

const websiteBatchFields: Record<string, GridField> = {
  title: { path: "title", type: "text" },
  batchCode: { path: "batchCode", type: "text" },
  // Class level is matched as text: set filters send strings.
  classLevel: { path: "classKey", type: "set" },
  genderGroup: { path: "genderGroup", type: "set" },
  version: { path: "version", type: "set" },
  subjectCount: { path: "subjectCount", type: "number" },
  subjectNames: { path: "subjectNames", type: "text" },
  totalSeats: { path: "totalSeats", type: "number" },
  availableSeats: { path: "availableSeats", type: "number" },
  routineNote: { path: "routineNote", type: "text" },
  status: { path: "status", type: "set" },
  isActive: { path: "isActive", type: "boolean" },
  createdAt: { path: "createdAt", type: "date" },
};

type WebsiteBatchSubject = {
  subjectName?: string;
  teacher?: unknown;
  days?: string[];
  startTime?: string;
  endTime?: string;
  monthlyFee?: number;
};

/** Row shape for the website batches grid (also used to open a new batch's schedule). */
export function serializeWebsiteBatch(doc: Record<string, unknown>) {
  const subjects = (Array.isArray(doc.subjects) ? doc.subjects : []) as WebsiteBatchSubject[];
  return {
    id: id(doc._id),
    title: str(doc.title),
    batchCode: str(doc.batchCode),
    classLevel: Number(doc.classLevel) || 0,
    genderGroup: (str(doc.genderGroup) || "male") as "male" | "female" | "combined",
    version: (str(doc.version) || "bangla") as "bangla" | "english",
    subjects: subjects.map((subject) => ({
      subjectName: str(subject.subjectName),
      teacher: subject.teacher ? id(subject.teacher) : null,
      days: Array.isArray(subject.days) ? subject.days.map(str) : [],
      startTime: str(subject.startTime),
      endTime: str(subject.endTime),
      monthlyFee: Number(subject.monthlyFee) || 0,
    })),
    subjectCount: subjects.length,
    subjectNames: subjects.map((subject) => str(subject.subjectName)).filter(Boolean).join(", "),
    routineNote: str(doc.routineNote),
    examSchedule: str(doc.examSchedule),
    totalSeats: Number(doc.totalSeats) || 0,
    availableSeats: Number(doc.availableSeats) || 0,
    status: str(doc.status),
    isActive: doc.isActive !== false,
    isArchived: Boolean(doc.isArchived),
    createdAt: iso(doc.createdAt),
  };
}

export const websiteBatchesSource: GridSource = {
  access: "staff",
  run: async (request) => {
    const live = { isArchived: { $ne: true } };
    const presetMatch: Record<string, unknown> =
      request.preset === "archived"
        ? { isArchived: true }
        : request.preset === "active"
          ? { ...live, isActive: true }
          : request.preset === "inactive"
            ? { ...live, isActive: false }
            : request.preset === "open"
              ? { ...live, status: ADMISSION_OPEN }
              : request.preset === "no-subjects"
                ? { ...live, $or: [{ subjects: { $size: 0 } }, { subjects: { $exists: false } }] }
                : live;
    const prepare: PipelineStage[] = [
      { $match: presetMatch },
      {
        $addFields: {
          classKey: { $ifNull: [{ $toString: "$classLevel" }, ""] },
          subjectCount: { $size: { $ifNull: ["$subjects", []] } },
          subjectNames: {
            $reduce: {
              input: { $ifNull: ["$subjects.subjectName", []] },
              initialValue: "",
              in: { $cond: [{ $eq: ["$$value", ""] }, "$$this", { $concat: ["$$value", ", ", "$$this"] }] },
            },
          },
        },
      },
    ];
    return runGridAggregate({
      model: AcademicBatch as never,
      request,
      fields: websiteBatchFields,
      searchPaths: ["title", "batchCode", "subjectNames", "routineNote"],
      prepare,
      defaultSort: { createdAt: -1 },
      toRows: (docs) => docs.map((doc) => serializeWebsiteBatch(doc)),
    });
  },
};
