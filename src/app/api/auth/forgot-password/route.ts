import { NextRequest } from "next/server";
import { ZodError } from "zod";

import { throwAuthValidation } from "@/app/api/auth/shared";
import { withApiHandler } from "@/lib/api-handler";
import { successResponse } from "@/lib/api-response";
import { AppError, NotFoundError } from "@/lib/errors";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { forgotPasswordSchema } from "@/schemas/auth";
import { sendEmail } from "@/lib/email";

export const POST = withApiHandler(async (req: NextRequest) => {
  await connectDB();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  let validatedData;
  try {
    validatedData = forgotPasswordSchema.parse(body);
  } catch (error) {
    if (error instanceof ZodError) throwAuthValidation(error);
    throw error;
  }

  const email = validatedData.email.toLowerCase();
  console.log("Forgot password request for:", email);
  const user = await User.findOne({ email });

  if (!user) {
    console.log("User not found:", email);
    throw new NotFoundError("এই ইমেইল দিয়ে কোনো অ্যাকাউন্ট পাওয়া যায়নি");
  }

  console.log("User found, generating OTP...");
  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Set Expiry (5 minutes)
  user.otp = otp;
  user.otpExpires = new Date(Date.now() + 5 * 60 * 1000);
  await user.save();
  console.log("OTP saved to user.");

  // Send Email
  const message = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
      <h2 style="color: #6D0F12; text-align: center;">পাসওয়ার্ড রিসেট OTP</h2>
      <p style="text-align: center; font-size: 16px;">আপনার সেইজ অ্যাকাডেমির পাসওয়ার্ড রিসেট করার জন্য নিচের OTP কোডটি ব্যবহার করুন:</p>
      <div style="text-align: center; margin: 30px 0;">
        <span style="background-color: #f8f8f8; border: 1px dashed #6D0F12; color: #6D0F12; padding: 15px 30px; font-size: 32px; font-weight: bold; letter-spacing: 5px; border-radius: 8px; display: inline-block;">
          ${otp}
        </span>
      </div>
      <p style="color: #666; font-size: 14px; text-align: center;">কোডটি আগামী ৫ মিনিট পর্যন্ত কার্যকর থাকবে। আপনি যদি এই অনুরোধ না করে থাকেন, তবে এই ইমেইলটি ইগনোর করুন।</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="font-size: 12px; color: #999; text-align: center;">সেইজ অ্যাকাডেমি - বনশ্রী, ঢাকা</p>
    </div>
  `;

  try {
    await sendEmail({
      to: user.email,
      subject: "পাসওয়ার্ড রিসেট OTP - সেইজ অ্যাকাডেমি",
      html: message,
    });

    return successResponse({ email: user.email }, "আপনার ইমেইলে ৫ মিনিটের জন্য একটি OTP পাঠানো হয়েছে");
  } catch (error) {
    user.otp = null;
    user.otpExpires = null;
    await user.save();
    console.error("Email sending failed:", error);
    throw new AppError("ইমেইল পাঠানো সম্ভব হয়নি, পরে আবার চেষ্টা করুন", 500, "EMAIL_ERROR");
  }
});
