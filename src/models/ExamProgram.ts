import { Schema, model, models } from "mongoose";

const ExamProgramSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    subtitle: { type: String, default: "", trim: true },
    image: { type: String, default: "", trim: true },
    description: { type: String, default: "", trim: true },
    deliveryMode: { type: String, enum: ["online", "offline"], required: true },
    offlineType: { type: String, enum: ["weekly", "monthly", null], default: null },
    accessType: { type: String, enum: ["public", "private"], default: "public" },
    isPaid: { type: Boolean, default: false },
    feeAmount: { type: Number, default: 0, min: 0 },
    classLevels: { type: [Number], default: [] },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    durationMinutes: { type: Number, default: 20, min: 1 },
    totalMarks: { type: Number, default: 25, min: 1 },
    correctMark: { type: Number, default: 1 },
    wrongMark: { type: Number, default: 0 },
    unansweredMark: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 1, min: 1 },
    instructions: { type: String, default: "", trim: true },
    markingRulesNote: { type: String, default: "", trim: true },
    venue: { type: String, default: "", trim: true },
    scheduleNote: { type: String, default: "", trim: true },
    examTime: { type: String, default: "", trim: true, maxlength: 120 },
    subjectSyllabus: { type: String, default: "", trim: true, maxlength: 8000 },
    subjectSyllabusItems: {
      type: [
        {
          name: { type: String, required: true, trim: true, maxlength: 120 },
          syllabus: { type: String, default: "", trim: true, maxlength: 3000 },
        },
      ],
      default: [],
    },
    enrollmentInfo: { type: String, default: "", trim: true, maxlength: 2000 },
    shuffleQuestions: { type: Boolean, default: true },
    showLeaderboard: { type: Boolean, default: true },
    status: { type: String, enum: ["draft", "published", "hidden", "archived"], default: "draft" },
    featured: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
    archivedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

ExamProgramSchema.index({ status: 1, deliveryMode: 1, offlineType: 1, startDate: 1, order: 1 });
ExamProgramSchema.index({ slug: 1 });

const ExamProgram = models.ExamProgram || model("ExamProgram", ExamProgramSchema);

export default ExamProgram;
