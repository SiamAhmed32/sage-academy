import { Schema, model, models } from "mongoose";

const PaymentProofSchema = new Schema(
  {
    url: { type: String, default: "" },
    previewUrl: { type: String, default: "" },
    publicId: { type: String, default: "" },
    originalName: { type: String, default: "" },
  },
  { _id: false }
);

const ExamEnrollmentSchema = new Schema(
  {
    programId: { type: Schema.Types.ObjectId, ref: "ExamProgram", required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: "Student", default: null },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    phone: { type: String, required: true, trim: true, maxlength: 15 },
    email: { type: String, default: "", trim: true, lowercase: true, maxlength: 160 },
    classLabel: { type: String, required: true, trim: true, maxlength: 40 },
    schoolName: { type: String, default: "", trim: true, maxlength: 160 },
    message: { type: String, default: "", trim: true, maxlength: 500 },
    feeAmount: { type: Number, default: 0, min: 0 },
    paymentStatus: {
      type: String,
      enum: ["not_required", "pending", "submitted", "verified", "rejected"],
      default: "not_required",
    },
    paymentMethod: { type: String, enum: ["bkash", "cash", "other", null], default: null },
    transactionId: { type: String, default: "", trim: true, maxlength: 40 },
    paymentProof: { type: PaymentProofSchema, default: null },
    verifiedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    verifiedAt: { type: Date, default: null },
    status: { type: String, enum: ["pending", "confirmed", "cancelled"], default: "pending" },
    attemptsUsed: { type: Number, default: 0, min: 0 },
    adminNote: { type: String, default: "", trim: true, maxlength: 2000 },
    ip: { type: String, default: "", trim: true, maxlength: 45 },
    userAgent: { type: String, default: "", trim: true, maxlength: 400 },
  },
  { timestamps: true }
);

ExamEnrollmentSchema.index({ programId: 1, phone: 1, createdAt: -1 });
ExamEnrollmentSchema.index({ paymentStatus: 1, status: 1, createdAt: -1 });

const ExamEnrollment = models.ExamEnrollment || model("ExamEnrollment", ExamEnrollmentSchema);

export default ExamEnrollment;
