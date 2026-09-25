import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

import { DUE_KINDS, PAYMENT_METHODS, VERSIONS } from "@/lib/academy/constants";

const ActorSchema = new Schema({ id: String, name: String }, { _id: false });

const AllocationLineSchema = new Schema(
  {
    subjectName: String,
    batchCode: String,
    fee: Number,
    discount: Number,
    amount: Number,
  },
  { _id: false }
);

const AllocationSchema = new Schema(
  {
    dueId: { type: Schema.Types.ObjectId, ref: "AcademyDue", required: true },
    month: { type: String, required: true },
    kind: { type: String, enum: DUE_KINDS, required: true },
    label: { type: String, default: "" },
    dueAmount: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    amount: { type: Number, required: true }, // paid against this due by this receipt
    /** Taken off this bill by a one-time discount given with this receipt. */
    oneTimeDiscount: { type: Number, default: 0 },
    lines: { type: [AllocationLineSchema], default: [] },
  },
  { _id: false }
);

// A money receipt. Never edited: a mistake is voided and a new receipt issued.
const AcademyPaymentSchema = new Schema(
  {
    receiptNo: { type: String, required: true },
    studentId: { type: Schema.Types.ObjectId, ref: "AcademyStudent", required: true },
    amount: { type: Number, required: true, min: 1 },
    method: { type: String, enum: PAYMENT_METHODS, required: true },
    transactionId: { type: String, default: "", trim: true },
    paidAt: { type: Date, default: Date.now },
    note: { type: String, default: "", trim: true },
    allocations: { type: [AllocationSchema], default: [] },
    snapshot: {
      studentName: String,
      studentCode: String,
      className: String,
      batchCode: String,
      version: { type: String, enum: VERSIONS },
      guardianPhone: String,
    },
    discountTotal: { type: Number, default: 0 },
    /** One-time discount given at payment (not the subjects' monthly discounts). */
    oneTimeDiscount: { type: Number, default: 0 },
    oneTimeDiscountNote: { type: String, default: "", trim: true },
    dueAfter: { type: Number, default: 0 },
    receivedBy: { type: ActorSchema, required: true },
    status: { type: String, enum: ["valid", "void"], default: "valid" },
    voidReason: { type: String, default: "" },
    voidedBy: { type: ActorSchema, default: null },
    voidedAt: { type: Date, default: null },
  },
  { collection: "academy_payments", timestamps: true }
);

AcademyPaymentSchema.index({ receiptNo: 1 }, { unique: true });
AcademyPaymentSchema.index({ studentId: 1, paidAt: -1 });
AcademyPaymentSchema.index({ paidAt: -1, status: 1 });

export type AcademyPaymentDoc = InferSchemaType<typeof AcademyPaymentSchema>;

const AcademyPayment =
  (models.AcademyPayment as Model<AcademyPaymentDoc>) ||
  model<AcademyPaymentDoc>("AcademyPayment", AcademyPaymentSchema);

export default AcademyPayment;
