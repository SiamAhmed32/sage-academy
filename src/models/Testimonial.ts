import { Schema, model, models } from "mongoose";

const TestimonialSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ["student", "guardian"],
      default: "student",
    },
    className: {
      type: String,
      default: "",
      trim: true,
    },
    review: {
      type: String,
      required: true,
      trim: true,
    },
    rating: {
      type: Number,
      default: 5,
      min: 1,
      max: 5,
    },
    image: {
      type: String,
      default: "",
      trim: true,
    },
    isFeatured: {
      type: Boolean,
      default: true,
    },
    source: {
      type: String,
      default: "admin",
      trim: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

TestimonialSchema.index({ role: 1, isFeatured: 1, order: 1, createdAt: -1 });
TestimonialSchema.index({ isFeatured: 1, createdAt: -1 });

const Testimonial = models.Testimonial || model("Testimonial", TestimonialSchema);

export default Testimonial;
