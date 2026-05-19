import { Schema, model, models, type Types } from "mongoose";

export type FreeClassLeadStatus =
  | "new"
  | "contacted"
  | "scheduled"
  | "attended"
  | "invalid"
  | "closed";

const FreeClassLeadSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    phone: { type: String, required: true, trim: true, maxlength: 15 },
    /** Class/year (guest or logged-in applicant). */
    classLabel: { type: String, trim: true, maxlength: 40, default: "" },
    subject: { type: String, required: true, trim: true, maxlength: 120 },
    status: {
      type: String,
      enum: ["new", "contacted", "scheduled", "attended", "invalid", "closed"],
      default: "new",
    },
    adminNote: { type: String, default: "", maxlength: 2000 },
    source: {
      type: String,
      enum: ["guest", "registered"],
      required: true,
    },
    userId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    ip: { type: String, trim: true, maxlength: 45, default: "" },
    userAgent: { type: String, trim: true, maxlength: 400, default: "" },
  },
  { timestamps: true }
);

FreeClassLeadSchema.index({ createdAt: -1 });
FreeClassLeadSchema.index({ status: 1, createdAt: -1 });
FreeClassLeadSchema.index({ phone: 1, createdAt: -1 });
FreeClassLeadSchema.index({ classLabel: 1 });
FreeClassLeadSchema.index({ source: 1 });

export type FreeClassLeadDoc = {
  _id: Types.ObjectId;
  name: string;
  phone: string;
  classLabel: string;
  subject: string;
  status: FreeClassLeadStatus;
  adminNote: string;
  source: "guest" | "registered";
  userId?: Types.ObjectId | null;
  ip?: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
};

const FreeClassLead = models.FreeClassLead || model("FreeClassLead", FreeClassLeadSchema);

export default FreeClassLead;
