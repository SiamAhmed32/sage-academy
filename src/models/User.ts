import { Schema, model, models } from "mongoose";

const UserSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 120,
    },
    phone: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      maxlength: 15,
    },
    linkedStudent: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      default: null,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },
    role: {
      type: String,
      enum: ["student", "guardian", "manager", "admin", "super_admin"],
      default: "student",
    },
    // Model refreshed to include super_admin
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
    resetPasswordToken: {
      type: String,
      default: null,
    },
    resetPasswordExpires: {
      type: Date,
      default: null,
    },
    otp: {
      type: String,
      default: null,
    },
    otpExpires: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

UserSchema.index({ role: 1, isActive: 1, createdAt: -1 });
UserSchema.index({ name: 1 });
UserSchema.index({ linkedStudent: 1 });

const User = models.User || model("User", UserSchema);

export default User;
