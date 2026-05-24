import { z } from "zod";

import { isValidBdMobileNormalized, normalizeBangladeshPhone } from "@/lib/bd-phone";
import { leadAttributionSchema } from "@/schemas/lead-attribution";

const optionalText = (max: number) =>
  z.string().trim().max(max, "Value is too long").optional();

const phoneSchema = (label: string) => z
  .string()
  .trim()
  .transform(normalizeBangladeshPhone)
  .refine((val) => val === "" || isValidBdMobileNormalized(val), {
    message: `${label} সঠিক নয়। ০১ দিয়ে শুরু হওয়া ১১ ডিজিটের বাংলাদেশি মোবাইল নম্বর দিন।`,
  });

const optionalDate = z.preprocess(
  (value) => (value === "" || value === null || value === undefined ? null : value),
  z.coerce.date().nullable().optional()
);

const uploadedFormSchema = z.object({
  url: z.string().trim().url("Uploaded file URL is invalid"),
  publicId: z.string().trim().min(1, "Uploaded file public id is required"),
  resourceType: z.string().trim().min(1, "Uploaded file type is required"),
  originalName: z.string().trim().min(1, "Uploaded file name is required"),
  format: z.string().trim().optional().default(""),
  bytes: z.number().nonnegative(),
});

export const admissionRequestBaseSchema = z.object({
  studentName: optionalText(120).default(""),
  nameBangla: optionalText(120).default(""),
  guardianName: optionalText(120).default(""),
  fatherName: optionalText(120).default(""),
  motherName: optionalText(120).default(""),
  phone: phoneSchema("অভিভাবকের ফোন নম্বর").default(""),
  studentWhatsapp: phoneSchema("হোয়াটসঅ্যাপ নম্বর").default(""),
  email: z.string().trim().email("Email is invalid").optional().or(z.literal("")).default(""),
  className: optionalText(80).default(""),
  schoolName: optionalText(160).default(""),
  section: optionalText(40).default(""),
  classRoll: optionalText(40).default(""),
  studentDateOfBirth: optionalDate.default(null),
  studentGender: z.enum(["male", "female", "other", ""]).optional().default(""),
  preferredBatch: optionalText(120).default(""),
  academicVersion: z.enum(["bangla", "english", "other"]).optional().default("bangla"),
  interestedSubjects: optionalText(500).default(""),
  admissionDate: optionalDate.default(null),
  presentAddress: optionalText(500).default(""),
  permanentAddress: optionalText(500).default(""),
  message: optionalText(1000).default(""),
  source: optionalText(80).default("admission-page"),
  status: z
    .enum(["new", "contacted", "qualified", "closed", "spam"])
    .optional()
    .default("new"),
  isRead: z.boolean().optional().default(false),
  adminNote: optionalText(800).default(""),
  uploadedForm: uploadedFormSchema.optional().nullable().default(null),
})
  .merge(leadAttributionSchema);

export const createAdmissionRequestSchema = admissionRequestBaseSchema.refine(
  (data) => {
    // If a file is uploaded, validation is loose
    if (data.uploadedForm) return true;
    
    // Otherwise, these are strictly required
    return !!(
      data.studentName.trim() &&
      data.phone.trim() &&
      data.className.trim()
    );
  },
  {
    message: "দয়া করে নাম, মোবাইল নম্বর এবং শ্রেণী প্রদান করুন",
  }
);

export const updateAdmissionRequestSchema = admissionRequestBaseSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required for update",
  });

export type AdmissionRequestPayload = z.infer<typeof createAdmissionRequestSchema>;
export type AdmissionRequestUpdatePayload = z.infer<typeof updateAdmissionRequestSchema>;
