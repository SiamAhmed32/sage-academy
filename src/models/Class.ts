import { Schema, model, models } from "mongoose";

/**
 * Class = an academic grade ("Class 6", "Class 7", ..., "SSC").
 * Independent entity — exists exactly once per grade, referenced by Subject,
 * BatchGroup and Student instead of being retyped everywhere.
 */
const ClassSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    orderIndex: {
      type: Number,
      required: true,
      default: 0,
    },
    // The numeric grade level the legacy Student/Payment/Routine system reads
    // as `classLevel` (1-12). Kept explicit and separate from `orderIndex`
    // (which only controls display order) so a class like "SSC" can still map
    // onto a real class number without guessing from the display name.
    legacyClassLevel: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

ClassSchema.index({ name: 1 }, { unique: true });
ClassSchema.index({ orderIndex: 1 });

const AcademicClass = models.Class || model("Class", ClassSchema);

export default AcademicClass;
