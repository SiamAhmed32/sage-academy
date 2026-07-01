import { cache } from "react";

import { getOptionalSessionFromCookies, type AuthUser } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export const getNavbarAuthUser = cache(async (): Promise<AuthUser | null> => {
  const session = await getOptionalSessionFromCookies();

  if (!session) {
    return null;
  }

  return {
    id: session.sub,
    name: session.name,
    email: session.email,
    phone: "",
    role: session.role,
    linkedStudent: null,
  };
});

export const getCurrentAuthUser = cache(async (): Promise<AuthUser | null> => {
  const session = await getOptionalSessionFromCookies();

  if (!session) {
    return null;
  }

  await connectDB();
  const user = await User.findById(session.sub).select("name email phone role linkedStudent isActive").lean();

  if (!user || !user.isActive) {
    return null;
  }

  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    phone: user.phone ?? "",
    role: user.role,
    linkedStudent: user.linkedStudent?.toString() ?? null,
  };
});
