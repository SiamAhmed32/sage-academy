import { unstable_cache } from "next/cache";
import { cache } from "react";

import { getOptionalSessionFromCookies, type AuthUser } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

const loadActiveUser = unstable_cache(
  async (userId: string): Promise<AuthUser | null> => {
    await connectDB();
    const user = await User.findById(userId).select("name email phone role linkedStudent isActive").lean();
    if (!user || !user.isActive) return null;
    return {
      id: String(user._id),
      name: user.name,
      email: user.email,
      phone: user.phone ?? "",
      role: user.role,
      linkedStudent: user.linkedStudent ? String(user.linkedStudent) : null,
    };
  },
  ["auth-user-record"],
  { revalidate: 60 }
);

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

  return loadActiveUser(session.sub);
});
