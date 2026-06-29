import { Schema, model, models } from "mongoose";

const NotFoundHitSchema = new Schema(
  {
    path: { type: String, required: true, trim: true, maxlength: 300, index: true },
    referrer: { type: String, default: "", trim: true, maxlength: 600 },
  },
  { timestamps: true }
);

NotFoundHitSchema.index({ createdAt: -1 });

const NotFoundHit = models.NotFoundHit || model("NotFoundHit", NotFoundHitSchema);

export default NotFoundHit;
