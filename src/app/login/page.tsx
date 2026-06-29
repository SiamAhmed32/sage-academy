import { redirect } from "next/navigation";

import { AuthPanel } from "@/components/auth/AuthPanel";
import { getCurrentAuthUser } from "@/lib/auth-session";
import { sanitizeRedirectPath } from "@/lib/safe-redirect";

type Props = { searchParams: Promise<{ next?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const user = await getCurrentAuthUser();
  const { next } = await searchParams;
  const returnTo = sanitizeRedirectPath(next, "");

  if (user) {
    if (returnTo) redirect(returnTo);
    redirect(["manager", "admin", "super_admin"].includes(user.role) ? "/admin" : "/student");
  }

  return <AuthPanel initialMode="login" redirectTo={returnTo || undefined} />;
}
