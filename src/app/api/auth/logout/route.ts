import { getAuthCookieConfig } from "@/lib/auth";
import { withApiHandler } from "@/lib/api-handler";
import { successResponse } from "@/lib/api-response";

export const POST = withApiHandler(async () => {
  const response = successResponse(null, "Logged out successfully");
  const cookie = getAuthCookieConfig();

  response.cookies.set(cookie.name, "", {
    ...cookie.options,
    maxAge: 0,
  });

  return response;
});
