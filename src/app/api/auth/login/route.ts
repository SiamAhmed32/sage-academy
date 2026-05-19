import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";
import { ZodError } from "zod";

import { throwAuthValidation } from "@/app/api/auth/shared";
import { getAuthCookieConfig, signAuthToken } from "@/lib/auth";
import { bdPhoneSchema, normalizeBangladeshPhone, userHasValidBdPhone } from "@/lib/bd-phone";
import { withApiHandler } from "@/lib/api-handler";
import { successResponse } from "@/lib/api-response";
import { ConflictError, ForbiddenError, PhoneRequiredError, UnauthorizedError } from "@/lib/errors";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { loginSchema } from "@/schemas/auth";

function isEmailLike(s: string) {
  return s.includes("@");
}

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
    validatedData = loginSchema.parse(body);
  } catch (error) {
    if (error instanceof ZodError) throwAuthValidation(error);
    throw error;
  }

  const identifier = validatedData.identifier.trim();
  const lowerEmail = identifier.toLowerCase();

  let user = null as InstanceType<typeof User> | null;

  if (isEmailLike(identifier)) {
    user = await User.findOne({ email: lowerEmail }).select("+password");
  } else {
    let normalizedPhone: string;
    try {
      normalizedPhone = bdPhoneSchema.parse(identifier);
    } catch {
      throw new UnauthorizedError("ভুল ইমেইল/ফোন অথবা পাসওয়ার্ড");
    }
    user = await User.findOne({ phone: normalizedPhone }).select("+password");
  }

  if (!user || !user.password) {
    throw new UnauthorizedError("ভুল ইমেইল/ফোন অথবা পাসওয়ার্ড");
  }

  if (!user.isActive) {
    throw new ForbiddenError("আপনার অ্যাকাউন্টটি বর্তমানে নিষ্ক্রিয় আছে");
  }

  const validPassword = await bcrypt.compare(validatedData.password, user.password);
  if (!validPassword) {
    throw new UnauthorizedError("ভুল ইমেইল/ফোন অথবা পাসওয়ার্ড");
  }

  if (!userHasValidBdPhone(user.phone)) {
    const raw = validatedData.phone;
    if (!raw || !String(raw).trim()) {
      throw new PhoneRequiredError();
    }
    let normalizedLoginPhone: string;
    try {
      normalizedLoginPhone = bdPhoneSchema.parse(raw);
    } catch {
      throw new PhoneRequiredError("সঠিক মোবাইল নম্বর দিন (০১… অথবা +৮৮০১…)।");
    }

    const taken = await User.findOne({
      phone: normalizedLoginPhone,
      _id: { $ne: user._id },
    }).lean();

    if (taken) {
      throw new ConflictError("এই মোবাইল নম্বর অন্য অ্যাকাউন্টে ব্যবহৃত হয়েছে");
    }

    user.phone = normalizedLoginPhone;
  } else {
    const stored = normalizeBangladeshPhone(String(user.phone));
    if (stored !== user.phone) {
      user.phone = stored;
    }
  }

  user.lastLoginAt = new Date();
  await user.save();

  const token = signAuthToken({
    sub: user._id.toString(),
    email: user.email,
    name: user.name,
    role: user.role,
  });

  const response = successResponse(
    {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone ?? "",
        role: user.role,
      },
    },
    "Logged in successfully"
  );

  const cookie = getAuthCookieConfig();
  response.cookies.set(cookie.name, token, cookie.options);
  return response;
});
