import { Schema, model, models } from "mongoose";

const PaymentSchema = new Schema(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    lineItems: {
      type: [
        {
          type: {
            type: String,
            enum: ["tuition", "admission", "previous_due", "advance", "other"],
            default: "tuition",
          },
          label: { type: String, default: "", trim: true },
          fee: { type: Number, default: 0, min: 0 },
          discount: { type: Number, default: 0, min: 0 },
          amount: { type: Number, default: 0, min: 0 },
          month: { type: String, default: "", trim: true },
          year: { type: Number, default: () => new Date().getFullYear() },
        },
      ],
      default: [],
    },
    transactions: {
      type: [
        {
          amount: { type: Number, required: true, min: 0 },
          status: {
            type: String,
            enum: ["active", "reversed"],
            default: "active",
          },
          kind: {
            type: String,
            enum: ["payment", "advance_applied"],
            default: "payment",
          },
          paymentMethod: {
            type: String,
            enum: ["cash", "bkash", "nagad", "rocket", "bank", "other"],
            default: "cash",
          },
          transactionId: { type: String, trim: true, default: "" },
          paymentDate: { type: Date, default: Date.now },
          receivedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            default: null,
          },
          note: { type: String, trim: true, default: "" },
          reversedAt: { type: Date, default: null },
          reversedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            default: null,
          },
          reversalReason: { type: String, trim: true, default: "" },
          lineItems: {
            type: [
              {
                type: {
                  type: String,
                  enum: ["tuition", "admission", "previous_due", "advance", "other"],
                  default: "tuition",
                },
                label: { type: String, default: "", trim: true },
                fee: { type: Number, default: 0, min: 0 },
                discount: { type: Number, default: 0, min: 0 },
                amount: { type: Number, default: 0, min: 0 },
                paidAmount: { type: Number, default: 0, min: 0 },
                month: { type: String, default: "", trim: true },
                year: { type: Number, default: () => new Date().getFullYear() },
              },
            ],
            default: [],
          },
          signedProof: {
            url: { type: String, default: "" },
            previewUrl: { type: String, default: "" },
            publicId: { type: String, default: "" },
            resourceType: { type: String, default: "" },
            format: { type: String, default: "" },
            originalName: { type: String, default: "" },
            uploadedAt: { type: Date, default: null },
          },
        },
      ],
      default: [],
    },
    expectedAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    dueAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    paymentDate: {
      type: Date,
      default: Date.now,
    },
    month: {
      type: String,
      required: true, // e.g., "January", "February"
    },
    monthNumber: {
      type: Number,
      min: 1,
      max: 12,
      default: 1,
    },
    year: {
      type: Number,
      required: true,
      default: () => new Date().getFullYear(),
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "bkash", "nagad", "rocket", "bank", "other"],
      default: "cash",
    },
    transactionId: {
      type: String,
      trim: true,
      default: "",
    },
    receivedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    status: {
      type: String,
      enum: ["unpaid", "partial", "paid", "waived", "cancelled", "completed", "pending"],
      default: "unpaid",
    },
    note: {
      type: String,
      trim: true,
      default: "",
    },
    signedProof: {
      url: { type: String, default: "" },
      previewUrl: { type: String, default: "" },
      publicId: { type: String, default: "" },
      resourceType: { type: String, default: "" },
      format: { type: String, default: "" },
      originalName: { type: String, default: "" },
      uploadedAt: { type: Date, default: null },
    },
  },
  { timestamps: true }
);

PaymentSchema.index(
  { student: 1, year: 1, monthNumber: 1 },
  { unique: true, partialFilterExpression: { monthNumber: { $type: "number" } } }
);
PaymentSchema.index({ year: -1, monthNumber: -1, dueAmount: 1 });
PaymentSchema.index({ year: -1, monthNumber: -1, amount: 1 });
PaymentSchema.index({ paymentMethod: 1, year: -1, monthNumber: -1 });
PaymentSchema.index({ createdAt: -1 });

const Payment = models.Payment || model("Payment", PaymentSchema);

export default Payment;
