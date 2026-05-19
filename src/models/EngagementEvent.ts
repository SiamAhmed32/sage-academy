import { Schema, model, models } from "mongoose";

const EngagementEventSchema = new Schema(
  {
    eventType: {
      type: String,
      required: true,
      enum: ["admission_page_view", "admission_form_started", "cta_click"],
      index: true,
    },
    sessionId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    path: {
      type: String,
      default: "",
      trim: true,
    },
    label: {
      type: String,
      default: "",
      trim: true,
    },
    referrer: {
      type: String,
      default: "",
      trim: true,
    },
    contactEmail: {
      type: String,
      default: "",
      trim: true,
    },
    contactPhone: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

EngagementEventSchema.index({ createdAt: -1 });

const EngagementEvent =
  models.EngagementEvent || model("EngagementEvent", EngagementEventSchema);

export default EngagementEvent;
