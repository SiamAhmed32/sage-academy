import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

import { UnauthorizedError } from "@/lib/errors";

const AUTH_COOKIE_NAME = "sage_auth_token";
const JWT_EXPIRY = "7d";

export type AuthRole = "student" | "guardian" | "manager" | "admin" | "super_admin";

export type JwtPayload = {
  sub: string;
  email: string;
  name: string;
  role: AuthRole;
};

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: AuthRole;
  linkedStudent?: string | null;
};

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }
  return secret;
}

export function signAuthToken(payload: JwtPayload) {
  return jwt.sign(payload, getJwtSecret(), {
    algorithm: "HS256",
    expiresIn: JWT_EXPIRY,
  });
}

export function verifyAuthToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, getJwtSecret()) as JwtPayload;
  } catch {
    throw new UnauthorizedError("Invalid or expired session");
  }
}

export function getAuthCookieConfig() {
  return {
    name: AUTH_COOKIE_NAME,
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    },
  };
}

export async function getSessionFromCookies() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) {
    throw new UnauthorizedError("Please login first");
  }
  return verifyAuthToken(token);
}

export async function getOptionalSessionFromCookies() {
  try {
    return await getSessionFromCookies();
  } catch {
    return null;
  }
}
