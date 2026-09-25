import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const AcademyClassSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    level: { type: Number, required: true, min: 1, max: 12 },
    isArchived: { type: Boolean, default: false },
  },
  { collection: "academy_classes", timestamps: true }
);

AcademyClassSchema.index({ level: 1 }, { unique: true });

export type AcademyClassDoc = InferSchemaType<typeof AcademyClassSchema>;

const AcademyClass =
  (models.AcademyClass as Model<AcademyClassDoc>) ||
  model<AcademyClassDoc>("AcademyClass", AcademyClassSchema);

export default AcademyClass;
