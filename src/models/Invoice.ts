import { Schema, model, models } from "mongoose";

/**
 * Invoice = one billing-cycle bill for a student, generated from the sum of
 * their ACTIVE Enrollment rows at generation time. InvoiceItem is embedded
 * (one line per SubjectBatch billed), since items never exist without an
 * invoice.
 */
const InvoiceItemSchema = new Schema(
  {
    enrollmentId: {
      type: Schema.Types.ObjectId,
      ref: "Enrollment",
      required: true,
    },
    subjectBatchId: {
      type: Schema.Types.ObjectId,
      ref: "SubjectBatch",
      required: true,
    },
    subjectName: {
      type: String,
      required: true,
      trim: true,
    },
    fee: {
      type: Number,
      required: true,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const InvoiceSchema = new Schema(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    billingCycle: {
      // e.g. "2026-09"
      type: String,
      required: true,
      trim: true,
    },
    items: {
      type: [InvoiceItemSchema],
      default: [],
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    status: {
      type: String,
      enum: ["UNPAID", "PARTIALLY_PAID", "PAID", "VOID"],
      default: "UNPAID",
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

InvoiceSchema.index({ studentId: 1, billingCycle: 1 }, { unique: true });
InvoiceSchema.index({ billingCycle: 1, status: 1 });

const Invoice = models.Invoice || model("Invoice", InvoiceSchema);

export default Invoice;
