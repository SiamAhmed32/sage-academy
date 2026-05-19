import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";
import { ZodError } from "zod";

import { throwAuthValidation } from "@/app/api/auth/shared";
import { signAuthToken, getAuthCookieConfig } from "@/lib/auth";
import { withApiHandler } from "@/lib/api-handler";
import { successResponse } from "@/lib/api-response";
import { ConflictError } from "@/lib/errors";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { signupSchema } from "@/schemas/auth";

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
    validatedData = signupSchema.parse(body);
  } catch (error) {
    if (error instanceof ZodError) throwAuthValidation(error);
    throw error;
  }

  const email = validatedData.email.toLowerCase();
  const phone = validatedData.phone;

  const existingUser = await User.findOne({
    $or: [{ email }, { phone }],
  }).lean();

  if (existingUser) {
    if (existingUser.email === email) {
      throw new ConflictError("এই ইমেইল দিয়ে ইতোমধ্যে একটি অ্যাকাউন্ট আছে");
    }
    if (existingUser.phone === phone) {
      throw new ConflictError("এই ফোন নম্বর দিয়ে ইতোমধ্যে একটি অ্যাকাউন্ট আছে");
    }
  }

  const hashedPassword = await bcrypt.hash(validatedData.password, 12);

  const user = await User.create({
    name: validatedData.name,
    email,
    phone,
    password: hashedPassword,
  });

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
    "Account created successfully",
    201
  );

  const cookie = getAuthCookieConfig();
  response.cookies.set(cookie.name, token, cookie.options);
  return response;
});
