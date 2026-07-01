import { Schema, model, models } from "mongoose";

const AcademicBatchSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    batchCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    overview: {
      type: String,
      default: "নিয়মিত ক্লাস, সাপ্তাহিক পরীক্ষা, প্রিন্টেড শিট এবং একাডেমিক মনিটরিংয়ের মাধ্যমে এই ব্যাচ সাজানো হয়েছে।",
      trim: true,
    },
    classLevel: {
      type: Number,
      required: true,
      min: 5,
      max: 12,
    },
    genderGroup: {
      type: String,
      enum: ["male", "female", "combined"],
      default: "male",
    },
    version: {
      type: String,
      enum: ["bangla", "english"],
      default: "bangla",
    },
    startTime: {
      type: String,
      default: "",
      trim: true,
    },
    endTime: {
      type: String,
      default: "",
      trim: true,
    },
    classDays: {
      type: [String],
      default: [],
    },
    subjects: {
      type: [
        {
          subjectName: {
            type: String,
            required: true,
            trim: true,
          },
          teacher: {
            type: Schema.Types.ObjectId,
            ref: "Teacher",
            default: null,
          },
          days: {
            type: [String],
            default: [],
          },
          startTime: {
            type: String,
            default: "",
            trim: true,
          },
          endTime: {
            type: String,
            default: "",
            trim: true,
          },
          monthlyFee: {
            type: Number,
            default: 0,
            min: 0,
          },
        },
      ],
      default: [],
    },
    routineNote: {
      type: String,
      default: "",
      trim: true,
    },
    examSchedule: {
      type: String,
      default: "",
      trim: true,
    },
    totalSeats: {
      type: Number,
      default: 0,
      min: 0,
    },
    availableSeats: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ["ভর্তি চলছে", "শীঘ্রই শুরু", "ভর্তি বন্ধ"],
      default: "ভর্তি চলছে",
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    archivedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const AcademicBatch = models.AcademicBatch || model("AcademicBatch", AcademicBatchSchema, "batches");

export default AcademicBatch;
