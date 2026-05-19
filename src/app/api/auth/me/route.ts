import { getAuthCookieConfig, getSessionFromCookies } from "@/lib/auth";
import { withApiHandler } from "@/lib/api-handler";
import { successResponse } from "@/lib/api-response";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export const GET = withApiHandler(async () => {
  const cookie = getAuthCookieConfig();
  const session = await getSessionFromCookies();

  await connectDB();
  const user = await User.findById(session.sub).lean();

  if (!user || !user.isActive) {
    const response = successResponse({ user: null }, "Session resolved");
    response.cookies.set(cookie.name, "", {
      ...cookie.options,
      maxAge: 0,
    });
    return response;
  }

  return successResponse(
    {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone ?? "",
        role: user.role,
      },
    },
    "Session resolved"
  );
});
