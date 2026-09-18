import { Schema, model, models } from "mongoose";

const QuizQuestionSchema = new Schema(
  {
    classLevel: {
      type: Number,
      required: true,
      min: 5,
      max: 12,
    },
    questionText: {
      type: String,
      required: true,
      trim: true,
    },
    options: [
      {
        text: { type: String, required: true },
        isCorrect: { type: Boolean, default: false },
      },
    ],
    explanation: {
      type: String,
      default: "",
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true, collection: "quizquestions" }
);

QuizQuestionSchema.index({ classLevel: 1, isActive: 1, order: 1, createdAt: -1 });
QuizQuestionSchema.index({ isActive: 1, createdAt: -1 });

const QuizQuestion = models.QuizQuestion || model("QuizQuestion", QuizQuestionSchema);

export default QuizQuestion;
