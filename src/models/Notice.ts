import { Schema, model, models } from "mongoose";

const NoticeSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 140 },
    type: {
      type: String,
      enum: ["general", "class", "batch", "exam", "payment"],
      default: "general",
    },
    audience: {
      type: String,
      enum: ["all", "class", "batch", "student"],
      default: "all",
    },
    classLevel: { type: Number, min: 1, max: 12, default: null },
    batch: { type: Schema.Types.ObjectId, ref: "AcademicBatch", default: null },
    student: { type: Schema.Types.ObjectId, ref: "Student", default: null },
    topic: { type: String, default: "", trim: true, maxlength: 160 },
    examDate: { type: Date, default: null },
    details: { type: String, default: "", trim: true, maxlength: 1200 },
    isPublished: { type: Boolean, default: true },
    publishedAt: { type: Date, default: Date.now },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

NoticeSchema.index({ isPublished: 1, audience: 1, publishedAt: -1 });
NoticeSchema.index({ classLevel: 1, isPublished: 1, publishedAt: -1 });
NoticeSchema.index({ batch: 1, isPublished: 1, publishedAt: -1 });
NoticeSchema.index({ student: 1, isPublished: 1, publishedAt: -1 });

const Notice = models.Notice || model("Notice", NoticeSchema);

export default Notice;
