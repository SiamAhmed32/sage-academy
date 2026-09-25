import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const ActorSchema = new Schema({ id: String, name: String }, { _id: false });

// Who did what, and when. The main safeguard for discounts, which any
// admin-panel user may give.
const AcademyActivitySchema = new Schema(
  {
    action: { type: String, required: true },
    message: { type: String, required: true },
    studentId: { type: Schema.Types.ObjectId, ref: "AcademyStudent", default: null },
    batchId: { type: Schema.Types.ObjectId, ref: "AcademyBatch", default: null },
    subjectId: { type: Schema.Types.ObjectId, ref: "AcademySubject", default: null },
    by: { type: ActorSchema, required: true },
  },
  { collection: "academy_activity", timestamps: { createdAt: true, updatedAt: false } }
);

AcademyActivitySchema.index({ studentId: 1, createdAt: -1 });
AcademyActivitySchema.index({ createdAt: -1 });

export type AcademyActivityDoc = InferSchemaType<typeof AcademyActivitySchema>;

const AcademyActivity =
  (models.AcademyActivity as Model<AcademyActivityDoc>) ||
  model<AcademyActivityDoc>("AcademyActivity", AcademyActivitySchema);

export default AcademyActivity;
