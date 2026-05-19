import { redirect } from "next/navigation";

import { AuthPanel } from "@/components/auth/AuthPanel";
import { getCurrentAuthUser } from "@/lib/auth-session";

export default async function LoginPage() {
  const user = await getCurrentAuthUser();

  if (user) {
    redirect(["manager", "admin", "super_admin"].includes(user.role) ? "/admin" : "/student");
  }

  return <AuthPanel initialMode="login" />;
}
