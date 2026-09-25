import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

import { DUE_KINDS, DUE_STATUSES } from "@/lib/academy/constants";

const ActorSchema = new Schema({ id: String, name: String }, { _id: false });

const DueLineSchema = new Schema(
  {
    subjectId: { type: Schema.Types.ObjectId, ref: "AcademySubject", default: null },
    subjectName: { type: String, default: "" },
    batchCode: { type: String, default: "" },
    fee: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    amount: { type: Number, default: 0 },
  },
  { _id: false }
);

// A bill. Tuition dues are one per student per month and keep a snapshot of
// the fees in force when they were created. Admission, exam and other dues
// are entered by hand.
const AcademyDueSchema = new Schema(
  {
    studentId: { type: Schema.Types.ObjectId, ref: "AcademyStudent", required: true },
    month: { type: String, required: true }, // "YYYY-MM"
    kind: { type: String, enum: DUE_KINDS, required: true },
    label: { type: String, default: "", trim: true },
    lines: { type: [DueLineSchema], default: [] },
    adjustment: { type: Number, default: 0 },
    adjustmentNote: { type: String, default: "", trim: true },
    amount: { type: Number, required: true, min: 0 },
    paid: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: DUE_STATUSES, default: "unpaid" },
    note: { type: String, default: "", trim: true },
    createdBy: { type: ActorSchema, default: null },
  },
  { collection: "academy_dues", timestamps: true }
);

AcademyDueSchema.index(
  { studentId: 1, month: 1 },
  { unique: true, partialFilterExpression: { kind: "tuition" } }
);
AcademyDueSchema.index({ studentId: 1, status: 1, month: 1 });
AcademyDueSchema.index({ month: 1, status: 1 });

export type AcademyDueDoc = InferSchemaType<typeof AcademyDueSchema>;

const AcademyDue =
  (models.AcademyDue as Model<AcademyDueDoc>) || model<AcademyDueDoc>("AcademyDue", AcademyDueSchema);

export function dueStatusFor(amount: number, paid: number): "unpaid" | "partial" | "paid" {
  if (paid <= 0) return amount <= 0 ? "paid" : "unpaid";
  if (paid >= amount) return "paid";
  return "partial";
}

export default AcademyDue;
