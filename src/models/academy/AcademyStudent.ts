import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

import { STUDENT_GENDERS, VERSIONS } from "@/lib/academy/constants";

const ActorSchema = new Schema({ id: String, name: String }, { _id: false });

const AcademyStudentSchema = new Schema(
  {
    studentId: { type: String, required: true, trim: true },
    admissionYear: { type: Number, required: true },
    serial: { type: Number, required: true },
    name: { type: String, required: true, trim: true },
    nameBangla: { type: String, default: "", trim: true },
    gender: { type: String, enum: STUDENT_GENDERS, required: true },
    version: { type: String, enum: VERSIONS, required: true },
    classId: { type: Schema.Types.ObjectId, ref: "AcademyClass", required: true },
    homeBatchId: { type: Schema.Types.ObjectId, ref: "AcademyBatch", required: true },
    phone: { type: String, default: "", trim: true },
    whatsapp: { type: String, default: "", trim: true },
    guardianName: { type: String, default: "", trim: true },
    guardianRelation: { type: String, default: "", trim: true },
    guardianPhone: { type: String, required: true, trim: true },
    fatherName: { type: String, default: "", trim: true },
    motherName: { type: String, default: "", trim: true },
    schoolName: { type: String, default: "", trim: true },
    dateOfBirth: { type: Date, default: null },
    address: { type: String, default: "", trim: true },
    admissionDate: { type: Date, default: Date.now },
    note: { type: String, default: "", trim: true },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    admissionRequestId: { type: Schema.Types.ObjectId, ref: "AdmissionRequest", default: null },
    createdBy: { type: ActorSchema, default: null },
  },
  { collection: "academy_students", timestamps: true }
);

AcademyStudentSchema.index({ studentId: 1 }, { unique: true });
AcademyStudentSchema.index({ admissionYear: 1, serial: 1 }, { unique: true });
AcademyStudentSchema.index({ status: 1, classId: 1 });
AcademyStudentSchema.index({ homeBatchId: 1 });
AcademyStudentSchema.index({ guardianPhone: 1 });

export type AcademyStudentDoc = InferSchemaType<typeof AcademyStudentSchema>;

const AcademyStudent =
  (models.AcademyStudent as Model<AcademyStudentDoc>) ||
  model<AcademyStudentDoc>("AcademyStudent", AcademyStudentSchema);

export default AcademyStudent;
