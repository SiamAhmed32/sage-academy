import { z } from "zod";

import { bdPhoneSchema } from "@/lib/bd-phone";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password is too long")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");

export const signupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(80, "Name is too long"),
  email: z.string().trim().email("Please provide a valid email").max(120),
  phone: bdPhoneSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(1, "ইমেইল অথবা ফোন নম্বর প্রয়োজন")
    .max(120),
  password: z.string().min(1, "পাসওয়ার্ড প্রয়োজন"),
  /** Required on second step when server returns PHONE_REQUIRED */
  phone: z.string().trim().optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("সঠিক ইমেইল দিন").max(120),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
