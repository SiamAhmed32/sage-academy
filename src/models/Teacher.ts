import { Schema, model, models } from "mongoose";

const TeacherSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    designation: {
      type: String,
      default: "",
      trim: true,
    },
    experience: {
      type: String,
      default: "",
      trim: true,
    },
    quote: {
      type: String,
      default: "",
      trim: true,
    },
    image: {
      type: String,
      default: "",
      trim: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Teacher = models.Teacher || model("Teacher", TeacherSchema);

export default Teacher;
