import { NextResponse } from "next/server";

import { getNavbarAuthUser } from "@/lib/auth-session";

export const dynamic = "force-dynamic";

/**
 * Who is signed in, for the public navbar. Reads the session cookie only
 * (no database), so public pages can stay cached and ask for this in the browser.
 */
export async function GET() {
  const user = await getNavbarAuthUser();
  return NextResponse.json(
    { user: user ? { id: user.id, name: user.name, email: user.email, role: user.role } : null },
    { headers: { "Cache-Control": "private, no-store" } }
  );
}
