import { Schema, deleteModel, model, models } from "mongoose";

const FeeSchema = new Schema(
  {
    classLevel: { type: Number, min: 4, max: 12 },
    label: { type: String, required: true, trim: true },
    sageStudentFee: { type: Number, default: 0, min: 0 },
    outsideStudentFee: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const RoutineEntrySchema = new Schema(
  {
    day: { type: String, required: true, trim: true },
    time: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const ClassInfoSchema = new Schema(
  {
    classLevel: { type: Number, required: true, min: 4, max: 12 },
    subjects: { type: [String], default: [] },
    routine: { type: [RoutineEntrySchema], default: [] },
  },
  { _id: false }
);

const ExamSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    image: { type: String, default: "", trim: true },
    examType: { type: String, enum: ["Weekly Test", "Class Test", "Half Yearly", "Pre-Test", "Final", "Board Prep", "Regular Exam"], default: "Regular Exam" },
    classLevels: { type: [Number], required: true, default: [] },
    version: { type: String, enum: ["bangla", "english", "both"], default: "both" },
    schoolFocus: { type: [String], default: [] },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    routineTitle: { type: String, default: "", trim: true },
    routineSubtitle: { type: String, default: "", trim: true },
    scheduleNote: { type: String, default: "", trim: true },
    fees: { type: [FeeSchema], default: [] },
    classSpecificInfo: { type: [ClassInfoSchema], default: [] },
    features: { type: [String], required: true, default: [] },
    status: { type: String, enum: ["draft", "published", "hidden", "archived"], default: "draft" },
    featured: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
    archivedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

ExamSchema.index({ status: 1, featured: 1, endDate: 1, order: 1 });

if (process.env.NODE_ENV !== "production" && models.Exam) {
  deleteModel("Exam");
}

const Exam = models.Exam || model("Exam", ExamSchema);

export default Exam;
