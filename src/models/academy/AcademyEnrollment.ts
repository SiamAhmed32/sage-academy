import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

import { DISCOUNT_TYPES } from "@/lib/academy/constants";

const ActorSchema = new Schema({ id: String, name: String }, { _id: false });

const HistorySchema = new Schema(
  {
    action: { type: String, required: true }, // enrolled | transferred | discount | dropped
    fromBatchId: { type: Schema.Types.ObjectId, ref: "AcademyBatch", default: null },
    toBatchId: { type: Schema.Types.ObjectId, ref: "AcademyBatch", default: null },
    note: { type: String, default: "" },
    at: { type: Date, default: Date.now },
    by: { type: ActorSchema, default: null },
  },
  { _id: false }
);

// One row per student per subject. The batch can change (subject transfer);
// the subject and fee version never do.
const AcademyEnrollmentSchema = new Schema(
  {
    studentId: { type: Schema.Types.ObjectId, ref: "AcademyStudent", required: true },
    subjectId: { type: Schema.Types.ObjectId, ref: "AcademySubject", required: true },
    batchId: { type: Schema.Types.ObjectId, ref: "AcademyBatch", required: true },
    discountType: { type: String, enum: DISCOUNT_TYPES, default: "none" },
    discountValue: { type: Number, default: 0, min: 0 },
    discountNote: { type: String, default: "", trim: true },
    startMonth: { type: String, required: true }, // first billed month, "YYYY-MM"
    endMonth: { type: String, default: null }, // last billed month once dropped
    status: { type: String, enum: ["active", "dropped"], default: "active" },
    history: { type: [HistorySchema], default: [] },
  },
  { collection: "academy_enrollments", timestamps: true }
);

AcademyEnrollmentSchema.index(
  { studentId: 1, subjectId: 1 },
  { unique: true, partialFilterExpression: { status: "active" } }
);
AcademyEnrollmentSchema.index({ batchId: 1, status: 1 });
AcademyEnrollmentSchema.index({ studentId: 1, status: 1 });
AcademyEnrollmentSchema.index({ subjectId: 1, status: 1 });

export type AcademyEnrollmentDoc = InferSchemaType<typeof AcademyEnrollmentSchema>;

const AcademyEnrollment =
  (models.AcademyEnrollment as Model<AcademyEnrollmentDoc>) ||
  model<AcademyEnrollmentDoc>("AcademyEnrollment", AcademyEnrollmentSchema);

export default AcademyEnrollment;
