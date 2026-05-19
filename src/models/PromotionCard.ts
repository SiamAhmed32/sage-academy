import { Schema, model, models } from "mongoose";
import "./AcademicBatch";

const PromotionCardSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    image: {
      type: String,
      required: true,
      trim: true,
    },
    badge: {
      type: String,
      default: "ভর্তি চলছে",
      trim: true,
    },
    features: {
      type: [String],
      required: true,
      validate: [
        (val: string[]) => val.length === 5,
        "Promotion card must have exactly 5 features",
      ],
    },
    overview: {
      type: String,
      trim: true,
      default: "",
    },
    linkedBatch: {
      type: Schema.Types.ObjectId,
      ref: "AcademicBatch",
      default: null,
    },
    websiteVisible: {
      type: Boolean,
      default: true,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    order: {
      type: Number,
      default: 0,
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

const PromotionCard = models.PromotionCard || model("PromotionCard", PromotionCardSchema);

export default PromotionCard;
