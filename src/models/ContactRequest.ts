import { Schema, model, models } from "mongoose";

const ContactRequestSchema = new Schema(
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
    message: {
      type: String,
      required: true,
      trim: true,
    },
    source: {
      type: String,
      default: "home-contact-section",
      trim: true,
    },
    status: {
      type: String,
      enum: ["new", "contacted", "closed", "spam"],
      default: "new",
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    adminNote: {
      type: String,
      default: "",
      trim: true,
    },
    utmSource: { type: String, default: "", trim: true },
    utmMedium: { type: String, default: "", trim: true },
    utmCampaign: { type: String, default: "", trim: true },
    utmContent: { type: String, default: "", trim: true },
    utmTerm: { type: String, default: "", trim: true },
    attributionReferrer: { type: String, default: "", trim: true },
    attributionLandingPath: { type: String, default: "", trim: true },
    attributionSubmitPath: { type: String, default: "", trim: true },
    attributionCapturedAt: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

const ContactRequest =
  models.ContactRequest || model("ContactRequest", ContactRequestSchema);

export default ContactRequest;
