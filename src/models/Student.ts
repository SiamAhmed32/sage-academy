import { Schema, model, models } from "mongoose";

const StudentSchema = new Schema(
  {
    studentId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    admissionYear: {
      type: Number,
      required: true,
    },
    classLevel: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    serialNumber: {
      type: Number,
      required: true,
      min: 1,
    },
    nameBangla: {
      type: String,
      default: "",
      trim: true,
    },
    nameEnglish: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      default: "",
      trim: true,
    },
    whatsapp: {
      type: String,
      default: "",
      trim: true,
    },
    fatherName: {
      type: String,
      default: "",
      trim: true,
    },
    motherName: {
      type: String,
      default: "",
      trim: true,
    },
    guardianName: {
      type: String,
      default: "",
      trim: true,
    },
    guardianPhone: {
      type: String,
      default: "",
      trim: true,
    },
    presentAddress: {
      type: String,
      default: "",
      trim: true,
    },
    permanentAddress: {
      type: String,
      default: "",
      trim: true,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      default: "male",
    },
    version: {
      type: String,
      enum: ["bangla", "english", "other"],
      default: "bangla",
    },
    batch: {
      type: Schema.Types.ObjectId,
      ref: "AcademicBatch",
      default: null,
    },
    selectedSubjects: {
      type: [
        {
          subjectName: { type: String, required: true },
          baseFee: { type: Number, default: 0 },
          discountType: {
            type: String,
            enum: ["none", "amount", "percent", "custom"],
            default: "none",
          },
          discountValue: { type: Number, default: 0 },
          discountNote: { type: String, default: "", trim: true },
          monthlyFee: { type: Number, default: 0 },
        },
      ],
      default: [],
    },
    subjectHistory: {
      type: [
        {
          action: {
            type: String,
            enum: ["added", "removed", "updated"],
            required: true,
          },
          subjectName: { type: String, required: true, trim: true },
          baseFee: { type: Number, default: 0 },
          monthlyFee: { type: Number, default: 0 },
          effectiveMonth: { type: String, required: true, trim: true },
          effectiveYear: { type: Number, required: true },
          note: { type: String, default: "", trim: true },
          recordedAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
    schoolName: {
      type: String,
      default: "",
      trim: true,
    },
    section: {
      type: String,
      default: "",
      trim: true,
    },
    roll: {
      type: String,
      default: "",
      trim: true,
    },
    admissionDate: {
      type: Date,
      default: Date.now,
    },
    note: {
      type: String,
      default: "",
      trim: true,
    },
    image: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

StudentSchema.index({ admissionYear: 1, classLevel: 1, serialNumber: 1 }, { unique: true });
StudentSchema.index({ isActive: 1, studentId: 1 });
StudentSchema.index({ isActive: 1, nameEnglish: 1 });
StudentSchema.index({ isActive: 1, phone: 1 });
StudentSchema.index({ isActive: 1, whatsapp: 1 });
StudentSchema.index({ isActive: 1, classLevel: 1, nameEnglish: 1 });

const Student = models.Student || model("Student", StudentSchema);

export default Student;
