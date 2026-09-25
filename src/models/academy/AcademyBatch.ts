import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

import { BATCH_GENDERS, VERSIONS, WEEK_DAYS } from "@/lib/academy/constants";

const BatchSubjectSchema = new Schema(
  {
    subjectId: { type: Schema.Types.ObjectId, ref: "AcademySubject", required: true },
    teacherId: { type: Schema.Types.ObjectId, ref: "Teacher", default: null },
  },
  { _id: false }
);

const RoutineSlotSchema = new Schema({
  subjectId: { type: Schema.Types.ObjectId, ref: "AcademySubject", required: true },
  day: { type: String, enum: WEEK_DAYS, required: true },
  start: { type: String, required: true },
  end: { type: String, required: true },
  room: { type: String, default: "", trim: true },
});

const AcademyBatchSchema = new Schema(
  {
    code: { type: String, required: true, trim: true },
    year: { type: Number, required: true },
    classId: { type: Schema.Types.ObjectId, ref: "AcademyClass", required: true },
    classLevel: { type: Number, required: true },
    gender: { type: String, enum: BATCH_GENDERS, required: true },
    version: { type: String, enum: VERSIONS, required: true },
    sequence: { type: Number, required: true },
    capacity: { type: Number, required: true, min: 1 },
    subjects: { type: [BatchSubjectSchema], default: [] },
    routine: { type: [RoutineSlotSchema], default: [] },
    note: { type: String, default: "", trim: true },
    status: { type: String, enum: ["active", "archived"], default: "active" },
  },
  { collection: "academy_batches", timestamps: true }
);

AcademyBatchSchema.index({ code: 1 }, { unique: true });
AcademyBatchSchema.index({ classId: 1, gender: 1, version: 1, sequence: 1 });
AcademyBatchSchema.index({ status: 1, year: 1 });

export type AcademyBatchDoc = InferSchemaType<typeof AcademyBatchSchema>;

const AcademyBatch =
  (models.AcademyBatch as Model<AcademyBatchDoc>) ||
  model<AcademyBatchDoc>("AcademyBatch", AcademyBatchSchema);

export default AcademyBatch;
