import { Schema, model, models } from "mongoose";
import "./BatchGroup";
import "./Subject";
import "./Teacher";

/**
 * SubjectBatch = one operational class slot: a specific subject being taught
 * to a specific BatchGroup, with its own teacher, seat cap and fee.
 *
 * Students enroll here — NOT into the BatchGroup directly — so two students
 * in the same BatchGroup can take a different mix of subjects.
 */
const SubjectBatchSchema = new Schema(
  {
    batchGroupId: {
      type: Schema.Types.ObjectId,
      ref: "BatchGroup",
      required: true,
    },
    subjectId: {
      type: Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },
    teacherId: {
      type: Schema.Types.ObjectId,
      ref: "Teacher",
      default: null,
    },
    maxSeats: {
      type: Number,
      required: true,
      min: 1,
      default: 30,
    },
    // Defaults to the Subject's baseMonthlyFee at creation time, can be
    // overridden per-slot (e.g. a smaller special-batch fee).
    monthlyFee: {
      type: Number,
      required: true,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// A subject should only have one active slot per batch group by default
// (additional sections are modeled as a *different* SubjectBatch, e.g. when
// rollover creates "Batch 2" for that subject).
SubjectBatchSchema.index({ batchGroupId: 1, subjectId: 1 });
SubjectBatchSchema.index({ subjectId: 1, isActive: 1 });

const SubjectBatch = models.SubjectBatch || model("SubjectBatch", SubjectBatchSchema);

export default SubjectBatch;
