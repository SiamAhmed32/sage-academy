import { Schema, model, models } from "mongoose";

const ExamQuestionSchema = new Schema(
  {
    programId: { type: Schema.Types.ObjectId, ref: "ExamProgram", required: true, index: true },
    questionText: { type: String, required: true, trim: true },
    image: { type: String, default: "", trim: true },
    options: {
      type: [
        {
          text: { type: String, required: true, trim: true },
        },
      ],
      validate: [(v: unknown[]) => v.length >= 2 && v.length <= 6, "2-6 options required"],
    },
    correctIndex: { type: Number, required: true, min: 0 },
    explanation: { type: String, default: "", trim: true },
    marks: { type: Number, default: 1, min: 0 },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

ExamQuestionSchema.index({ programId: 1, order: 1, isActive: 1 });

const ExamQuestion = models.ExamQuestion || model("ExamQuestion", ExamQuestionSchema);

export default ExamQuestion;
