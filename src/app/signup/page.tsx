import { redirect } from "next/navigation";

import { AuthPanel } from "@/components/auth/AuthPanel";
import { getCurrentAuthUser } from "@/lib/auth-session";

export default async function SignupPage() {
  const user = await getCurrentAuthUser();

  if (user) {
    redirect("/");
  }

  return <AuthPanel initialMode="signup" />;
}
