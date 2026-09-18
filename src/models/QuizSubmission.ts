import { Schema, model, models } from "mongoose";

const QuizSubmissionSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    classLevel: {
      type: Number,
      required: true,
    },
    answers: [
      {
        question: { type: Schema.Types.ObjectId, ref: "QuizQuestion" },
        selectedOptionIndex: Number,
        isCorrect: Boolean,
      },
    ],
    score: {
      type: Number,
      default: 0,
    },
    totalQuestions: {
      type: Number,
      default: 0,
    },
    whatsappRequested: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["new", "contacted", "invalid", "qualified"],
      default: "new",
    },
    adminNote: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

QuizSubmissionSchema.index({ createdAt: -1 });
QuizSubmissionSchema.index({ status: 1, createdAt: -1 });
QuizSubmissionSchema.index({ classLevel: 1, createdAt: -1 });
QuizSubmissionSchema.index({ whatsappRequested: 1, createdAt: -1 });
QuizSubmissionSchema.index({ score: -1, createdAt: -1 });

const QuizSubmission = models.QuizSubmission || model("QuizSubmission", QuizSubmissionSchema);

export default QuizSubmission;
