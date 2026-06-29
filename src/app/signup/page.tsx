import { redirect } from "next/navigation";

import { AuthPanel } from "@/components/auth/AuthPanel";
import { getCurrentAuthUser } from "@/lib/auth-session";
import { sanitizeRedirectPath } from "@/lib/safe-redirect";

type Props = { searchParams: Promise<{ next?: string }> };

export default async function SignupPage({ searchParams }: Props) {
  const user = await getCurrentAuthUser();
  const { next } = await searchParams;
  const returnTo = sanitizeRedirectPath(next, "");

  if (user) {
    redirect(returnTo || "/");
  }

  return <AuthPanel initialMode="signup" redirectTo={returnTo || undefined} />;
}
