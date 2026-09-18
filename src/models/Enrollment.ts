import { Schema, model, models } from "mongoose";
import "./SubjectBatch";

/**
 * Enrollment = the junction table between a Student and a SubjectBatch.
 * This is the subject-level "seat" record — a student who takes 2 of 3
 * available subjects in their BatchGroup has exactly 2 Enrollment rows.
 */
const EnrollmentSchema = new Schema(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    subjectBatchId: {
      type: Schema.Types.ObjectId,
      ref: "SubjectBatch",
      required: true,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "DROPPED", "COMPLETED"],
      default: "ACTIVE",
    },
    enrolledAt: {
      type: Date,
      default: Date.now,
    },
    droppedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// A student can only hold one enrollment row per subject-batch slot.
EnrollmentSchema.index({ studentId: 1, subjectBatchId: 1 }, { unique: true });
EnrollmentSchema.index({ subjectBatchId: 1, status: 1 });
EnrollmentSchema.index({ studentId: 1, status: 1 });

const Enrollment = models.Enrollment || model("Enrollment", EnrollmentSchema);

export default Enrollment;
