import { Schema, model, models } from "mongoose";

const ExamAttemptSchema = new Schema(
  {
    programId: { type: Schema.Types.ObjectId, ref: "ExamProgram", required: true, index: true },
    enrollmentId: { type: Schema.Types.ObjectId, ref: "ExamEnrollment", required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: "Student", default: null },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    startedAt: { type: Date, required: true },
    expiresAt: { type: Date, required: true },
    submittedAt: { type: Date, default: null },
    status: { type: String, enum: ["in_progress", "submitted", "expired"], default: "in_progress" },
    answers: {
      type: [
        {
          questionId: { type: Schema.Types.ObjectId, ref: "ExamQuestion", required: true },
          selectedIndex: { type: Number, default: null },
          isCorrect: { type: Boolean, default: null },
          marksAwarded: { type: Number, default: 0 },
        },
      ],
      default: [],
    },
    score: { type: Number, default: 0 },
    totalMarks: { type: Number, default: 0 },
    durationSeconds: { type: Number, default: 0 },
    ip: { type: String, default: "", trim: true, maxlength: 45 },
    userAgent: { type: String, default: "", trim: true, maxlength: 400 },
  },
  { timestamps: true }
);

ExamAttemptSchema.index({ programId: 1, status: 1, score: -1, submittedAt: 1 });
ExamAttemptSchema.index({ enrollmentId: 1, createdAt: -1 });

const ExamAttempt = models.ExamAttempt || model("ExamAttempt", ExamAttemptSchema);

export default ExamAttempt;
