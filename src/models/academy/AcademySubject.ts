import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

import { softDelete, softDeleteFields } from "@/lib/academy/soft-delete";

const ActorSchema = new Schema({ id: String, name: String }, { _id: false });

// Fees live only here. Each entry applies from `effectiveFrom` ("YYYY-MM") onward,
// so a change made today can start next month without touching old dues.
const FeeEntrySchema = new Schema(
  {
    effectiveFrom: { type: String, required: true },
    bangla: { type: Number, required: true, min: 0 },
    english: { type: Number, required: true, min: 0 },
    setBy: { type: ActorSchema, default: null },
    setAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const AcademySubjectSchema = new Schema(
  {
    ...softDeleteFields,
    classId: { type: Schema.Types.ObjectId, ref: "AcademyClass", required: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, default: "", trim: true, uppercase: true },
    fees: { type: [FeeEntrySchema], default: [] },
    isArchived: { type: Boolean, default: false },
  },
  { collection: "academy_subjects", timestamps: true }
);

softDelete(AcademySubjectSchema);
AcademySubjectSchema.index({ classId: 1, name: 1 }, { unique: true });

export type AcademySubjectDoc = InferSchemaType<typeof AcademySubjectSchema>;

const AcademySubject =
  (models.AcademySubject as Model<AcademySubjectDoc>) ||
  model<AcademySubjectDoc>("AcademySubject", AcademySubjectSchema);

export default AcademySubject;
