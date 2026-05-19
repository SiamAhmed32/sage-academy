import { getOptionalSessionFromCookies, type AuthUser } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export async function getCurrentAuthUser(): Promise<AuthUser | null> {
  const session = await getOptionalSessionFromCookies();

  if (!session) {
    return null;
  }

  await connectDB();
  const user = await User.findById(session.sub).lean();

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
}
