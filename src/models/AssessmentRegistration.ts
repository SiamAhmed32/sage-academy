import { Schema, model, models } from "mongoose";

const AssessmentRegistrationSchema = new Schema(
  {
    assessmentKind: { type: String, enum: ["modelTest", "exam"], required: true },
    assessmentId: { type: Schema.Types.ObjectId, required: true, refPath: "assessmentModel" },
    assessmentModel: { type: String, required: true, enum: ["ModelTest", "Exam"] },
    assessmentTitle: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    phone: { type: String, required: true, trim: true, maxlength: 15 },
    classLabel: { type: String, required: true, trim: true, maxlength: 40 },
    version: { type: String, enum: ["bangla", "english", "both"], required: true },
    schoolName: { type: String, default: "", trim: true, maxlength: 160 },
    selectedSubjects: { type: [String], required: true, default: [] },
    applicantType: { type: String, enum: ["sage", "outside"], required: true },
    message: { type: String, default: "", trim: true, maxlength: 1000 },
    status: {
      type: String,
      enum: ["new", "contacted", "confirmed", "attended", "cancelled", "invalid"],
      default: "new",
    },
    adminNote: { type: String, default: "", trim: true, maxlength: 2000 },
    ip: { type: String, default: "", trim: true, maxlength: 45 },
    userAgent: { type: String, default: "", trim: true, maxlength: 400 },
  },
  { timestamps: true }
);

AssessmentRegistrationSchema.index({ assessmentKind: 1, assessmentId: 1, createdAt: -1 });
AssessmentRegistrationSchema.index({ phone: 1, assessmentKind: 1, assessmentId: 1, createdAt: -1 });
AssessmentRegistrationSchema.index({ status: 1, createdAt: -1 });
AssessmentRegistrationSchema.index({ classLabel: 1, createdAt: -1 });
AssessmentRegistrationSchema.index({ schoolName: 1, createdAt: -1 });

const AssessmentRegistration =
  models.AssessmentRegistration || model("AssessmentRegistration", AssessmentRegistrationSchema);

export default AssessmentRegistration;
