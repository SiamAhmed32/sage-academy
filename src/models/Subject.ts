import { Schema, model, models } from "mongoose";
import "./Class";

/**
 * Subject belongs to exactly one Class. Exists once per (class, subject) pair
 * instead of being retyped inside every batch.
 */
const SubjectSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      default: "",
      trim: true,
      uppercase: true,
    },
    classId: {
      type: Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },
    baseMonthlyFee: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// A subject name is unique within its class (e.g. "Physics" once per class),
// but the same name can exist under a different class.
SubjectSchema.index({ classId: 1, name: 1 }, { unique: true });
SubjectSchema.index({ classId: 1, isActive: 1 });

const Subject = models.Subject || model("Subject", SubjectSchema);

export default Subject;
