"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getAuthCookieConfig } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { revalidatePromotionCardPublicPages, revalidateTeacherPublicPages, revalidateTestimonialPublicPages } from "@/lib/revalidate-public";
import {
  adminRoles,
  requireRole,
  staffRoles,
} from "@/lib/rbac";
import AdmissionRequest from "@/models/AdmissionRequest";
import ContactRequest from "@/models/ContactRequest";
import AcademicBatch from "@/models/AcademicBatch";
import Teacher from "@/models/Teacher";
import Testimonial from "@/models/Testimonial";
import User from "@/models/User";
import Student from "@/models/Student";
import Payment from "@/models/Payment";
import QuizQuestion from "@/models/QuizQuestion";
import QuizSubmission from "@/models/QuizSubmission";
import FreeClassLead from "@/models/FreeClassLead";
import { uploadStudentImage } from "@/lib/upload-student-image";
import { uploadPaymentProof } from "@/lib/upload-payment-proof";
import { buildStudentId, getNextStudentSerial } from "@/lib/student-id";
import { monthNameFromNumber, monthNumberFromName } from "@/lib/month-utils";
import { normalizeBangladeshPhone } from "@/lib/bd-phone";
import {
  billExpectedAmount,
  billStatus,
  appliedTransactionTotal,
  ensureMonthlyBillsForMonth,
  isBillingMonthOpen,
  isStudentEligibleForBilling,
  type BillingLineItem,
} from "@/lib/billing";
import {
  DUPLICATE_STUDENT_MESSAGE,
  findActiveDuplicateStudent,
} from "@/lib/student-duplicate";
import { createAcademicBatchSchema } from "@/schemas/academic-batch";
import { uploadBatchImage } from "@/lib/upload-batch-image";

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export type StudentSaveResult =
  | { ok: true }
  | { ok: false; message: string };

async function validateStudentBatchClass(batchId: string, classLevel: number): Promise<StudentSaveResult> {
  if (!batchId) {
    return { ok: false, message: "Select a batch for this student." };
  }

  const batch = await AcademicBatch.findById(batchId).select("title classLevel").lean<{
    title?: string;
    classLevel?: number;
  }>();

  if (!batch) {
    return { ok: false, message: "Selected batch was not found. Please choose another batch." };
  }

  if (Number(batch.classLevel) !== Number(classLevel)) {
    return {
      ok: false,
      message: `${batch.title || "Selected batch"} is for class ${batch.classLevel}. Select a class ${classLevel} batch for this student.`,
    };
  }

  return { ok: true };
}

function bool(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

function numberValue(formData: FormData, key: string) {
  const value = Number(text(formData, key));
  return Number.isFinite(value) ? value : 0;
}

function phoneCandidates(...values: string[]) {
  const candidates = values.flatMap((value) => {
    const normalized = value ? normalizeBangladeshPhone(value) : "";
    const intl = normalized.startsWith("0") ? `+880${normalized.slice(1)}` : "";
    const plainIntl = intl.replace("+", "");
    return [value, normalized, intl, plainIntl];
  });

  return [...new Set(candidates.map((item) => item.trim()).filter(Boolean))];
}

async function linkPortalUserByStudentContacts(studentId: unknown, ...phones: string[]) {
  const candidates = phoneCandidates(...phones);
  if (!candidates.length) return;

  await User.updateMany(
    {
      role: { $in: ["student", "guardian"] },
      isActive: true,
      phone: { $in: candidates },
      $or: [
        { linkedStudent: null },
        { linkedStudent: { $exists: false } },
        { linkedStudent: studentId },
      ],
    },
    { $set: { linkedStudent: studentId } }
  );
}

type StudentSubjectPayload = {
  subjectName: string;
  baseFee?: number;
  discountType?: "none" | "amount" | "percent" | "custom";
  discountValue?: number;
  discountNote?: string;
  monthlyFee: number;
};

type SubjectHistoryEntry = {
  action: "added" | "removed" | "updated";
  subjectName: string;
  baseFee: number;
  monthlyFee: number;
  effectiveMonth: string;
  effectiveYear: number;
  note: string;
  recordedAt: Date;
};

function validDiscountType(value: unknown): StudentSubjectPayload["discountType"] {
  return ["amount", "percent", "custom"].includes(String(value))
    ? (value as StudentSubjectPayload["discountType"])
    : "none";
}

function parseStudentSubjects(formData: FormData): StudentSubjectPayload[] {
  const json = text(formData, "selectedSubjectsJson");
  if (json) {
    try {
      const rows = JSON.parse(json);
      if (Array.isArray(rows)) {
        return rows
          .map((row) => {
            const item = row as Record<string, unknown>;
            const subjectName = String(item.subjectName ?? "").trim();
            const baseFee = Math.max(0, Number(item.baseFee) || 0);
            const monthlyFee = Math.max(0, Number(item.monthlyFee) || 0);
            return {
              subjectName,
              baseFee,
              discountType: validDiscountType(item.discountType),
              discountValue: Math.max(0, Number(item.discountValue) || 0),
              discountNote: String(item.discountNote ?? "").trim(),
              monthlyFee,
            };
          })
          .filter((item) => item.subjectName);
      }
    } catch {
      // Fall through to legacy selectedSubjects values.
    }
  }

  return formData.getAll("selectedSubjects").map((val) => {
    const [subjectName, monthlyFeeRaw] = String(val).split(":");
    const monthlyFee = Number(monthlyFeeRaw) || 0;
    return {
      subjectName,
      baseFee: monthlyFee,
      discountType: "none",
      discountValue: 0,
      discountNote: "",
      monthlyFee,
    };
  });
}

function currentMonthName() {
  return new Date().toLocaleString("en-US", { month: "long" });
}

function subjectFingerprint(subject: StudentSubjectPayload) {
  return [
    subject.baseFee || 0,
    subject.discountType || "none",
    subject.discountValue || 0,
    subject.discountNote || "",
    subject.monthlyFee || 0,
  ].join("|");
}

function subjectHistory(
  previous: StudentSubjectPayload[],
  next: StudentSubjectPayload[],
  formData: FormData
): SubjectHistoryEntry[] {
  const effectiveMonth = text(formData, "subjectChangeMonth") || currentMonthName();
  const effectiveYear = numberValue(formData, "subjectChangeYear") || new Date().getFullYear();
  const note = text(formData, "subjectChangeNote");
  const oldMap = new Map(previous.map((subject) => [subject.subjectName, subject]));
  const nextMap = new Map(next.map((subject) => [subject.subjectName, subject]));
  const entries: SubjectHistoryEntry[] = [];
  next.forEach((subject) => {
    const old = oldMap.get(subject.subjectName);
    const action = !old ? "added" : subjectFingerprint(old) !== subjectFingerprint(subject) ? "updated" : null;
    if (action) entries.push(historyEntry(action, subject, effectiveMonth, effectiveYear, note));
  });
  previous.forEach((subject) => {
    if (!nextMap.has(subject.subjectName)) entries.push(historyEntry("removed", subject, effectiveMonth, effectiveYear, note));
  });
  return entries;
}

function historyEntry(
  action: SubjectHistoryEntry["action"],
  subject: StudentSubjectPayload,
  effectiveMonth: string,
  effectiveYear: number,
  note: string
): SubjectHistoryEntry {
  return {
    action,
    subjectName: subject.subjectName,
    baseFee: subject.baseFee || subject.monthlyFee || 0,
    monthlyFee: subject.monthlyFee || 0,
    effectiveMonth,
    effectiveYear,
    note,
    recordedAt: new Date(),
  };
}

function paymentTuitionItems(formData: FormData, month: string, year: number, fallbackFee: number) {
  const json = text(formData, "tuitionItemsJson");
  try {
    const rows = JSON.parse(json);
    if (Array.isArray(rows) && rows.length) {
      return rows.map((row) => {
        const item = row as Record<string, unknown>;
        const fee = Math.max(0, Number(item.baseFee ?? item.monthlyFee) || 0);
        const amount = Math.max(0, Number(item.monthlyFee) || 0);
        return {
          type: "tuition",
          label: String(item.subjectName || "Tuition Fee"),
          fee,
          discount: Math.max(0, fee - amount),
          amount,
          month,
          year,
        };
      });
    }
  } catch {
    // Legacy forms fall back to one tuition row.
  }
  return [{ type: "tuition", label: "Tuition Fee", fee: fallbackFee, discount: 0, amount: fallbackFee, month, year }];
}

function paidLineItems(formData: FormData, month: string, year: number, fallbackAmount: number) {
  const json = text(formData, "paidItemsJson");
  try {
    const rows = JSON.parse(json);
    if (Array.isArray(rows) && rows.length) {
      return rows
        .map((row) => {
          const item = row as Record<string, unknown>;
          const amount = Math.max(0, Number(item.amount) || 0);
          const paidAmount = Math.max(0, Number(item.paidAmount ?? amount) || 0);

          return {
            type: ["tuition", "admission", "previous_due", "advance", "other"].includes(String(item.type))
              ? String(item.type)
              : "tuition",
            label: String(item.label || item.subjectName || "Payment"),
            fee: Math.max(0, Number(item.fee ?? amount) || 0),
            discount: Math.max(0, Number(item.discount) || 0),
            amount,
            paidAmount,
            month,
            year,
          };
        })
        .filter((item) => item.paidAmount > 0) as BillingLineItem[];
    }
  } catch {
    // Fallback below.
  }

  return [{
    type: "tuition",
    label: "Monthly Payment",
    fee: fallbackAmount,
    discount: 0,
    amount: fallbackAmount,
    paidAmount: fallbackAmount,
    month,
    year,
  }] satisfies BillingLineItem[];
}

function splitList(value: string) {
  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function listValue(formData: FormData, key: string) {
  const values = formData.getAll(key).filter((value): value is string => typeof value === "string");
  return values.length ? values.map((value) => value.trim()).filter(Boolean) : splitList(text(formData, key));
}

function buildSlug(value: string, fallback: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || fallback;
}

export async function createBatchAction(formData: FormData) {
  const imageFile = formData.get("imageFile");
  const uploadedImage =
    imageFile instanceof File && imageFile.size > 0 ? await uploadBatchImage(imageFile) : "";
  await requireRole(adminRoles);
  await connectDB();

  const classLevel = numberValue(formData, "classLevel");
  const genderGroup = text(formData, "genderGroup") || "combined";
  const version = text(formData, "version") || "bangla";
  const startTime = text(formData, "startTime");
  const endTime = text(formData, "endTime");
  const shift = text(formData, "shift") || [startTime, endTime].filter(Boolean).join(" - ") || "সময় নির্ধারিত হবে";
  const fallbackSlug = `class-${classLevel || "general"}-${genderGroup}-${version}`;
  const baseSlug = buildSlug(text(formData, "title"), fallbackSlug);
  const slugExists = await AcademicBatch.countDocuments({ slug: baseSlug });
  const features = listValue(formData, "features");

  const payload = createAcademicBatchSchema.parse({
    title: text(formData, "title"),
    slug: slugExists ? `${baseSlug}-${slugExists + 1}` : baseSlug,
    image: uploadedImage || text(formData, "image"),
    shift,
    classLevel,
    genderGroup,
    version,
    startTime,
    endTime,
    classDays: listValue(formData, "classDays"),
    routineNote: text(formData, "routineNote"),
    examSchedule: text(formData, "examSchedule"),
    features: features.length
      ? features
      : ["নিয়মিত ক্লাস", "সাপ্তাহিক পরীক্ষা", "ডাউট সলভিং সাপোর্ট"],
    overview: text(formData, "overview"),
    duration: text(formData, "duration"),
    totalClasses: numberValue(formData, "totalClasses"),
    seats: numberValue(formData, "seats"),
    instructor: null,
    status: text(formData, "status") || "ভর্তি চলছে",
    isActive: bool(formData, "isActive"),
    order: numberValue(formData, "order"),
  });

  await AcademicBatch.create(payload);
  revalidatePath("/admin/batches");
  revalidatePromotionCardPublicPages();
  redirect("/admin/batches");
}

export async function updateAdmissionRequestAction(formData: FormData) {
  await requireRole(staffRoles);
  await connectDB();
  await AdmissionRequest.findByIdAndUpdate(text(formData, "id"), {
    status: text(formData, "status"),
    adminNote: text(formData, "adminNote"),
    isRead: true,
  });
  revalidatePath("/admin/admissions");
}

export async function updateContactRequestAction(formData: FormData) {
  await requireRole(staffRoles);
  await connectDB();
  await ContactRequest.findByIdAndUpdate(text(formData, "id"), {
    status: text(formData, "status"),
    adminNote: text(formData, "adminNote"),
    isRead: true,
  });
  revalidatePath("/admin/contacts");
}

export async function deleteContactRequestAction(formData: FormData) {
  await requireRole(adminRoles);
  await connectDB();
  await ContactRequest.findByIdAndDelete(text(formData, "id"));
  revalidatePath("/admin/contacts");
}

export async function updateAcademicBatchVisibilityAction(formData: FormData) {
  await requireRole(adminRoles);
  await connectDB();
  await AcademicBatch.findByIdAndUpdate(text(formData, "id"), {
    status: text(formData, "status"),
    isActive: bool(formData, "isActive"),
  });
  revalidatePath("/admin/batches");
}

export async function updateAcademicBatchAction(formData: FormData) {
  await requireRole(adminRoles);
  await connectDB();

  const batchId = text(formData, "id");
  const features = listValue(formData, "features");

  await AcademicBatch.findByIdAndUpdate(
    batchId,
    {
      title: text(formData, "title"),
      image: text(formData, "image"),
      shift: text(formData, "shift"),
      classLevel: numberValue(formData, "classLevel"),
      genderGroup: text(formData, "genderGroup") || "combined",
      version: text(formData, "version") || "bangla",
      startTime: text(formData, "startTime"),
      endTime: text(formData, "endTime"),
      classDays: listValue(formData, "classDays"),
      routineNote: text(formData, "routineNote"),
      examSchedule: text(formData, "examSchedule"),
      features,
      overview: text(formData, "overview"),
      duration: text(formData, "duration"),
      totalClasses: numberValue(formData, "totalClasses"),
      seats: numberValue(formData, "seats"),
      status: text(formData, "status") || "ভর্তি চলছে",
      isActive: bool(formData, "isActive"),
      order: numberValue(formData, "order"),
    },
    { runValidators: true }
  );

  revalidatePath("/admin/batches");
  revalidatePromotionCardPublicPages();
  redirect("/admin/batches");
}

export async function archiveAcademicBatchAction(formData: FormData) {
  await requireRole(adminRoles);
  await connectDB();

  const batchId = text(formData, "id");
  await AcademicBatch.findByIdAndUpdate(batchId, {
    isActive: false,
    isArchived: true,
    archivedAt: new Date(),
    status: "আর্কাইভড",
  });

  revalidatePath("/admin/batches");
  revalidatePromotionCardPublicPages();
  redirect("/admin/batches");
}

export async function restoreAcademicBatchAction(formData: FormData) {
  await requireRole(adminRoles);
  await connectDB();

  await AcademicBatch.findByIdAndUpdate(text(formData, "id"), {
    isActive: true,
    isArchived: false,
    websiteVisible: true,
    archivedAt: null,
    status: "ভর্তি চলছে",
  });

  revalidatePath("/admin/batches");
  revalidatePromotionCardPublicPages();
}

export async function updateTeacherVisibilityAction(formData: FormData) {
  await requireRole(adminRoles);
  await connectDB();
  await Teacher.findByIdAndUpdate(text(formData, "id"), {
    isFeatured: bool(formData, "isFeatured"),
  });
  revalidatePath("/admin/teachers");
  revalidateTeacherPublicPages();
}

export async function submitTeacherOrderFormAction(formData: FormData): Promise<void> {
  await updateTeacherOrderAction(formData);
}

export async function updateTeacherOrderAction(formData: FormData) {
  await requireRole(adminRoles);
  await connectDB();
  const id = text(formData, "id");
  const order = numberValue(formData, "order");

  // Check for duplicate order
  const duplicate = await Teacher.findOne({ order, _id: { $ne: id } });
  if (duplicate) {
    // In server actions, we usually throw or return an error object.
    // However, since this is a Server Action called via 'action' prop, 
    // we might need a different way to show toast.
    // For now, I'll just return and we can handle it in the UI if needed,
    // but the requirement says "give a toast".
    // I'll implement a check in the API too.
    return { ok: false, message: "এই সিরিয়াল নম্বরটি অন্য একজন শিক্ষকের জন্য ইতিমধ্যে ব্যবহৃত হয়েছে।" };
  }

  await Teacher.findByIdAndUpdate(id, { order });
  revalidatePath("/admin/teachers");
  revalidateTeacherPublicPages();
  return { ok: true };
}

export async function updateTestimonialVisibilityAction(formData: FormData) {
  await requireRole(adminRoles);
  await connectDB();
  await Testimonial.findByIdAndUpdate(text(formData, "id"), {
    isFeatured: bool(formData, "isFeatured"),
  });
  revalidatePath("/admin/testimonials");
  revalidateTestimonialPublicPages();
}

export async function createStudentAction(
  formData: FormData
): Promise<StudentSaveResult> {
  await requireRole(adminRoles);
  await connectDB();

  const admissionYear = Number(text(formData, "admissionYear"));
  const classLevel = Number(text(formData, "classLevel"));
  const batchId = text(formData, "batch");
  const schoolName = text(formData, "schoolName");
  const roll = text(formData, "roll");

  const batchCheck = await validateStudentBatchClass(batchId, classLevel);
  if (!batchCheck.ok) return batchCheck;

  const dup = await findActiveDuplicateStudent({
    classLevel,
    schoolName,
    roll,
  });
  if (dup) {
    return { ok: false, message: DUPLICATE_STUDENT_MESSAGE };
  }

  const serialNumber = await getNextStudentSerial(admissionYear, classLevel);
  const selectedSubjects = parseStudentSubjects(formData);

  const student = await Student.create({
    studentId: buildStudentId(admissionYear, classLevel, serialNumber),
    admissionYear,
    classLevel,
    serialNumber,
    nameEnglish: text(formData, "nameEnglish"),
    nameBangla: text(formData, "nameBangla"),
    whatsapp: text(formData, "whatsapp"),
    fatherName: text(formData, "fatherName"),
    motherName: text(formData, "motherName"),
    guardianName: text(formData, "guardianName"),
    guardianPhone: text(formData, "guardianPhone"),
    gender: text(formData, "gender"),
    version: text(formData, "version"),
    batch: batchId,
    schoolName,
    section: text(formData, "section"),
    roll,
    presentAddress: text(formData, "presentAddress"),
    permanentAddress: text(formData, "permanentAddress"),
    admissionDate: text(formData, "admissionDate") || new Date(),
    note: text(formData, "note"),
    selectedSubjects,
    subjectHistory: subjectHistory([], selectedSubjects, formData),
  });

  const imageFile = formData.get("image") as File;
  if (imageFile && imageFile.size > 0) {
    const uploadRes = await uploadStudentImage(imageFile);
    student.image = uploadRes;
    await student.save();
  }

  await linkPortalUserByStudentContacts(student._id, student.whatsapp, student.guardianPhone, student.phone);

  revalidatePath("/admin/students");
  return { ok: true };
}

export async function updateStudentAction(
  formData: FormData
): Promise<StudentSaveResult> {
  await requireRole(adminRoles);
  await connectDB();

  const id = text(formData, "id");
  const student = await Student.findById(id);
  if (!student) throw new Error("Student not found");

  const admissionYear = Number(text(formData, "admissionYear"));
  const classLevel = Number(text(formData, "classLevel"));
  const batchId = text(formData, "batch");
  const schoolName = text(formData, "schoolName");
  const roll = text(formData, "roll");

  const batchCheck = await validateStudentBatchClass(batchId, classLevel);
  if (!batchCheck.ok) return batchCheck;

  const dup = await findActiveDuplicateStudent({
    classLevel,
    schoolName,
    roll,
    excludeStudentId: id,
  });
  if (dup) {
    return { ok: false, message: DUPLICATE_STUDENT_MESSAGE };
  }

  const selectedSubjects = parseStudentSubjects(formData);
  const previousSubjects = JSON.parse(JSON.stringify(student.selectedSubjects || []));
  const changes = subjectHistory(previousSubjects, selectedSubjects, formData);
  const updates: Record<string, unknown> = {
    admissionYear,
    classLevel,
    nameEnglish: text(formData, "nameEnglish"),
    nameBangla: text(formData, "nameBangla"),
    whatsapp: text(formData, "whatsapp"),
    fatherName: text(formData, "fatherName"),
    motherName: text(formData, "motherName"),
    guardianName: text(formData, "guardianName"),
    guardianPhone: text(formData, "guardianPhone"),
    gender: text(formData, "gender"),
    version: text(formData, "version"),
    batch: batchId,
    schoolName,
    section: text(formData, "section"),
    roll,
    presentAddress: text(formData, "presentAddress"),
    permanentAddress: text(formData, "permanentAddress"),
    admissionDate: text(formData, "admissionDate") || new Date(),
    note: text(formData, "note"),
    selectedSubjects,
  };
  if (changes.length) {
    updates.$push = { subjectHistory: { $each: changes } };
  }

  // Recalculate Student ID if class or year changed
  if (student.admissionYear !== admissionYear || student.classLevel !== classLevel) {
    const serialNumber = await getNextStudentSerial(admissionYear, classLevel);
    updates.serialNumber = serialNumber;
    updates.studentId = buildStudentId(admissionYear, classLevel, serialNumber);
  }

  const imageFile = formData.get("image") as File;
  if (imageFile && imageFile.size > 0) {
    updates.image = await uploadStudentImage(imageFile);
  }

  const updatedStudent = await Student.findByIdAndUpdate(id, updates, { new: true });
  if (updatedStudent) {
    await linkPortalUserByStudentContacts(
      updatedStudent._id,
      updatedStudent.whatsapp,
      updatedStudent.guardianPhone,
      updatedStudent.phone
    );
  }

  revalidatePath("/admin/students");
  revalidatePath(`/admin/students/${id}`);
  return { ok: true };
}

export async function archiveStudentAction(formData: FormData) {
  await requireRole(adminRoles);
  await connectDB();
  const id = formData.get("id");
  await Student.findByIdAndUpdate(id, { isActive: false });
  revalidatePath("/admin/students");
}

export async function restoreStudentAction(formData: FormData) {
  await requireRole(adminRoles);
  await connectDB();
  const id = formData.get("id");
  await Student.findByIdAndUpdate(id, { isActive: true });
  revalidatePath("/admin/students");
}

export async function deleteStudentAction(formData: FormData) {
  await requireRole(adminRoles);
  await connectDB();
  await Student.findByIdAndDelete(formData.get("id"));
  revalidatePath("/admin/students");
}

export async function logoutAction() {
  const cookie = getAuthCookieConfig();
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  cookieStore.set(cookie.name, "", { ...cookie.options, maxAge: 0 });
  redirect("/login");
}

export async function recordPaymentAction(formData: FormData) {
  const user = await requireRole(staffRoles);
  await connectDB();

  const studentId = text(formData, "studentId");
  const amount = numberValue(formData, "amount");
  const month = text(formData, "month");
  const monthNumber = monthNumberFromName(month);
  if (!monthNumber) return { ok: false, message: "Invalid payment month" };
  const year = numberValue(formData, "year");
  const student = await Student.findById(studentId).select("admissionDate").lean();
  if (!student) return { ok: false, message: "Student not found" };
  if (!isStudentEligibleForBilling(student, monthNumber, year)) {
    return { ok: false, message: "Payment month cannot be before the student's admission month." };
  }
  if (!isBillingMonthOpen(monthNumber, year)) {
    return { ok: false, message: "Future month payments are not open yet." };
  }
  const paymentMethod = text(formData, "paymentMethod");
  const tuitionFee = numberValue(formData, "tuitionFee");
  const admissionFee = numberValue(formData, "admissionFee");
  const admissionDiscount = numberValue(formData, "admissionDiscount");
  const admissionAmount = Math.max(0, admissionFee - admissionDiscount);
  const tuitionItems = paymentTuitionItems(formData, month, year, tuitionFee);
  let lineItems = [
    ...tuitionItems,
    admissionFee > 0
      ? {
        type: "admission",
        label: "Admission Fee",
        fee: admissionFee,
        discount: admissionDiscount,
        amount: admissionAmount,
        month,
        year,
      }
      : null,
  ].filter(Boolean) as BillingLineItem[];
  let expectedAmount = billExpectedAmount(lineItems);
  const transactionItems = paidLineItems(formData, month, year, amount);

  try {
    let payment = await Payment.findOne({
      student: studentId,
      year,
      $or: [
        { monthNumber },
        { month, monthNumber: { $exists: false } },
      ],
    });

    if (!payment) {
      payment = new Payment({
        student: studentId,
        amount: 0,
        lineItems,
        expectedAmount,
        dueAmount: expectedAmount,
        month,
        monthNumber,
        year,
        paymentMethod,
        status: "unpaid",
        transactions: [],
      });
    } else {
      const nextLabels = new Set(lineItems.map((item) => item.label));
      const preservedItems = (payment.lineItems || [])
        .filter((item: BillingLineItem) => item.type !== "tuition" && !nextLabels.has(item.label));
      lineItems = [...lineItems, ...preservedItems];
      expectedAmount = billExpectedAmount(lineItems);
    }

    const existingTransactions = payment.transactions?.length
      ? payment.transactions
      : payment.amount > 0
        ? [{
            amount: payment.amount,
            paymentMethod: payment.paymentMethod,
            paymentDate: payment.paymentDate || payment.createdAt || new Date(),
            receivedBy: payment.receivedBy || user.id,
            lineItems: payment.lineItems?.length ? payment.lineItems : lineItems,
        }]
        : [];

    const paidByLabel = new Map<string, number>();
    existingTransactions
      .filter((transaction: { status?: string }) => transaction.status !== "reversed")
      .forEach((transaction: { lineItems?: Array<{ label?: string; paidAmount?: number; amount?: number }> }) => {
        (transaction.lineItems || []).forEach((item) => {
          const label = String(item.label || "");
          paidByLabel.set(label, (paidByLabel.get(label) || 0) + Math.max(0, Number(item.paidAmount ?? item.amount) || 0));
        });
      });
    const expectedByLabel = new Map(lineItems.map((item) => [item.label, item.amount]));
    for (const item of transactionItems) {
      const label = item.label;
      if (item.type === "advance") continue;
      const alreadyPaid = paidByLabel.get(label) || 0;
      const expectedForItem = expectedByLabel.get(label) ?? item.amount;
      const remaining = Math.max(0, expectedForItem - alreadyPaid);
      if ((item.paidAmount || 0) > remaining) {
        return { ok: false, message: `${label} remaining due is ${remaining}. Please adjust the installment amount.` };
      }
    }

    payment.transactions = existingTransactions;
    payment.transactions.push({
      amount,
      status: "active",
      paymentMethod,
      paymentDate: new Date(),
      receivedBy: user.id,
      lineItems: transactionItems,
    });

    const paidAmount = appliedTransactionTotal(payment.transactions);
    payment.amount = paidAmount;
    payment.lineItems = lineItems;
    payment.expectedAmount = expectedAmount;
    payment.dueAmount = Math.max(0, expectedAmount - paidAmount);
    payment.month = month;
    payment.monthNumber = monthNumber;
    payment.year = year;
    payment.paymentMethod = paymentMethod;
    payment.receivedBy = user.id;
    payment.status = billStatus(paidAmount, expectedAmount);
    payment.paymentDate = new Date();
    await payment.save();

    const populatedPayment = await Payment.findById(payment._id)
      .populate("student", "nameEnglish studentId")
      .populate("receivedBy", "name")
      .populate("transactions.receivedBy", "name")
      .lean();

    revalidatePath("/admin/payments");
    revalidatePath(`/admin/students/${studentId}`);
    revalidatePath(`/admin/students/${studentId}/payments`);
    return { ok: true, data: JSON.parse(JSON.stringify(populatedPayment)) };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Failed to record payment" };
  }
}

export async function reversePaymentTransactionAction(formData: FormData) {
  const user = await requireRole(staffRoles);
  await connectDB();

  const paymentId = text(formData, "paymentId");
  const transactionId = text(formData, "transactionId");
  const reason = text(formData, "reason") || "Payment entry correction";

  try {
    const payment = await Payment.findById(paymentId);
    if (!payment) return { ok: false, message: "Payment record not found" };
    const transaction = payment.transactions?.id(transactionId);
    if (!transaction) return { ok: false, message: "Transaction not found" };
    if (transaction.status === "reversed") return { ok: false, message: "Transaction is already reversed" };

    transaction.status = "reversed";
    transaction.reversedAt = new Date();
    transaction.reversedBy = user.id;
    transaction.reversalReason = reason;

    const paidAmount = appliedTransactionTotal(payment.transactions);
    const expectedAmount = Number(payment.expectedAmount || 0);
    payment.amount = paidAmount;
    payment.dueAmount = Math.max(0, expectedAmount - paidAmount);
    payment.status = billStatus(paidAmount, expectedAmount);
    await payment.save();

    const populatedPayment = await Payment.findById(payment._id)
      .populate("student", "nameEnglish studentId")
      .populate("receivedBy", "name")
      .populate("transactions.receivedBy", "name")
      .populate("transactions.reversedBy", "name")
      .lean();

    revalidatePath("/admin/payments");
    revalidatePath(`/admin/students/${payment.student}`);
    revalidatePath(`/admin/students/${payment.student}/payments`);
    return { ok: true, data: JSON.parse(JSON.stringify(populatedPayment)) };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Failed to reverse receipt" };
  }
}

export async function updatePaymentAmountAction(formData: FormData) {
  await requireRole(staffRoles);
  await connectDB();
  const paymentId = text(formData, "paymentId");
  const amount = numberValue(formData, "amount");
  const paymentMethod = text(formData, "paymentMethod");

  try {
    const existing = await Payment.findById(paymentId);
    if (!existing) return { ok: false, message: "Payment record not found" };
    const expected = Number(existing.expectedAmount || existing.amount || 0);
    const dueAmount = Math.max(0, expected - amount);
    existing.amount = amount;
    existing.dueAmount = dueAmount;
    existing.status = amount <= 0 ? "unpaid" : dueAmount > 0 ? "partial" : "paid";
    if (paymentMethod) existing.paymentMethod = paymentMethod;
    await existing.save();

    const payment = await Payment.findById(paymentId)
      .populate("student", "nameEnglish studentId")
      .populate("receivedBy", "name")
      .lean();
    revalidatePath("/admin/payments");
    revalidatePath(`/admin/students/${existing.student}`);
    return { ok: true, data: JSON.parse(JSON.stringify(payment)) };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Failed to update payment" };
  }
}

export async function generateMonthlyBillsAction(formData: FormData) {
  await requireRole(staffRoles);
  await connectDB();

  const month = text(formData, "month");
  const monthNumber = monthNumberFromName(month);
  const year = numberValue(formData, "year") || new Date().getFullYear();

  if (!monthNumber) return { ok: false, message: "Invalid billing month" };

  try {
    const result = await ensureMonthlyBillsForMonth(monthNumber, year);
    revalidatePath("/admin/payments");
    revalidatePath("/admin/students");
    return { ok: true, data: { ...result, month: monthNameFromNumber(monthNumber), year } };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Could not generate monthly bills" };
  }
}

export async function uploadPaymentProofAction(formData: FormData) {
  await requireRole(staffRoles);
  await connectDB();
  const paymentId = text(formData, "paymentId");
  const file = formData.get("proof") as File;
  if (!file || file.size <= 0) return { ok: false, message: "Select a signed proof file first" };

  try {
    const existingPayment = await Payment.findById(paymentId).select("amount student transactions").lean();
    if (!existingPayment) return { ok: false, message: "Payment record not found" };
    const hasReceipt = (existingPayment.transactions || [])
      .some((transaction: { status?: string; kind?: string; amount?: number }) => (
        transaction.status !== "reversed" &&
        transaction.kind !== "advance_applied" &&
        Number(transaction.amount || 0) > 0
      ));
    if (!hasReceipt) {
      return { ok: false, message: "Proof can only be uploaded after a payment is recorded" };
    }

    const proof = await uploadPaymentProof(file);
    const payment = await Payment.findByIdAndUpdate(
      paymentId,
      { signedProof: { ...proof, uploadedAt: new Date() } },
      { new: true }
    ).populate("student", "nameEnglish studentId").populate("receivedBy", "name").lean();
    if (!payment) return { ok: false, message: "Payment record not found" };
    revalidatePath("/admin/payments");
    revalidatePath(`/admin/students/${payment.student?._id || ""}`);
    revalidatePath(`/admin/students/${payment.student?._id || ""}/payments`);
    return { ok: true, data: JSON.parse(JSON.stringify(payment)) };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Proof upload failed" };
  }
}

export async function saveQuizQuestionAction(data: Record<string, unknown> & { id?: string }) {
  await requireRole(adminRoles);
  await connectDB();
  const { id, ...payload } = data;
  try {
    let q;
    if (id) {
      q = await QuizQuestion.findByIdAndUpdate(id, payload, { new: true }).lean();
    } else {
      q = await QuizQuestion.create(payload);
    }
    return { ok: true, data: JSON.parse(JSON.stringify(q)) };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Failed to save question" };
  }
}

export async function deleteQuizQuestionAction(id: string) {
  await requireRole(adminRoles);
  await connectDB();
  try {
    await QuizQuestion.findByIdAndDelete(id);
    return { ok: true };
  } catch {
    return { ok: false, message: "Failed to delete" };
  }
}

export async function updateQuizSubmissionAction(formData: FormData) {
  await requireRole(staffRoles);
  await connectDB();
  const id = formData.get("id");
  const status = formData.get("status");
  const adminNote = formData.get("adminNote");

  await QuizSubmission.findByIdAndUpdate(id, { status, adminNote });
  revalidatePath("/admin/quiz-leads");
}

export async function updateFreeClassLeadAction(formData: FormData) {
  await requireRole(staffRoles);
  await connectDB();
  const id = text(formData, "id");
  const patch: Record<string, string> = {};
  if (formData.has("status")) patch.status = text(formData, "status");
  if (formData.has("adminNote")) patch.adminNote = text(formData, "adminNote");
  await FreeClassLead.findByIdAndUpdate(id, patch);
  revalidatePath("/admin/free-class-leads");
  revalidatePath("/admin");
}
