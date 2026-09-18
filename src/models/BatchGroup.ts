import { Schema, model, models } from "mongoose";
import "./Class";

/**
 * BatchGroup = the umbrella cohort a student is admitted into:
 * one class + gender + medium + section number, e.g.
 * "Class 6 - Boys - Bangla - Batch 1".
 *
 * It does NOT hold subjects itself — those live as separate SubjectBatch
 * "slots" that reference this group, so a student can pick some subjects
 * from the group and skip others.
 */
const BatchGroupSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    classId: {
      type: Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },
    gender: {
      type: String,
      enum: ["MALE", "FEMALE", "COMBINED"],
      required: true,
    },
    medium: {
      type: String,
      enum: ["BANGLA", "ENGLISH"],
      required: true,
    },
    batchNumber: {
      type: Number,
      required: true,
      min: 1,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// One "Class X - gender - medium - batch N" combination should exist once.
BatchGroupSchema.index(
  { classId: 1, gender: 1, medium: 1, batchNumber: 1 },
  { unique: true }
);
BatchGroupSchema.index({ classId: 1, isArchived: 1 });

const BatchGroup = models.BatchGroup || model("BatchGroup", BatchGroupSchema);

export default BatchGroup;
