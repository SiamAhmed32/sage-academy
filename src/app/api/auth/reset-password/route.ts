import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";
import { z } from "zod";

import { withApiHandler } from "@/lib/api-handler";
import { successResponse } from "@/lib/api-response";
import { BadRequestError } from "@/lib/errors";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

const resetPasswordSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
  password: z.string().min(8),
});

export const POST = withApiHandler(async (req: NextRequest) => {
  await connectDB();

  const body = await req.json();
  const { email, otp, password } = resetPasswordSchema.parse(body);

  const user = await User.findOne({ 
    email: email.toLowerCase(),
    otp: otp,
    otpExpires: { $gt: Date.now() }
  });

  if (!user) {
    throw new BadRequestError("OTP সঠিক নয় অথবা এর মেয়াদ শেষ হয়ে গেছে");
  }

  // Hash new password
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(password, salt);

  // Clear OTP fields
  user.otp = null;
  user.otpExpires = null;
  await user.save();

  return successResponse(null, "পাসওয়ার্ড সফলভাবে পরিবর্তিত হয়েছে");
});
