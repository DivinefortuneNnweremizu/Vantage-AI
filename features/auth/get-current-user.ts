import { cookies } from "next/headers";
import { cache } from "react";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DEV_NAME_COOKIE, DEV_SESSION_COOKIE, DEV_USER, isDevAuthEnabled, parseDevSession } from "@/features/auth/dev-auth";
import { ensureUserRecords } from "@/features/auth/ensure-user-records";

export interface CurrentUser {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
}

/**
 * Returns the verified signed-in user, or null.
 * Identity always comes from the server-verified session, never from the client.
 *
 * Wrapped in `cache` so the layout, the page, and route code share one lookup per request.
 * Database rows are created only the first time a user is seen.
 */
export const getSessionUser = cache(async (): Promise<CurrentUser | null> => {
  let identity: CurrentUser;

  if (isDevAuthEnabled()) {
    const cookieStore = await cookies();
    const session = parseDevSession(cookieStore.get(DEV_SESSION_COOKIE)?.value);
    if (!session) return null;
    // A fresh sign-up has no name until onboarding saves one.
    const name = cookieStore.get(DEV_NAME_COOKIE)?.value;
    identity = { ...DEV_USER, fullName: name || (session === "new" ? null : DEV_USER.fullName) };
  } else {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !user.email) {
      return null;
    }

    identity = {
      id: user.id,
      email: user.email,
      fullName: typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null,
      avatarUrl: typeof user.user_metadata?.avatar_url === "string" ? user.user_metadata.avatar_url : null,
    };
  }

  const existing = await prisma.user.findUnique({ where: { id: identity.id }, select: { id: true } });
  if (!existing) {
    await ensureUserRecords(identity);
  }

  return identity;
});

/** For pages and layouts. Redirects to sign-in when there is no session. */
export async function requireCurrentUser(): Promise<CurrentUser> {
  const user = await getSessionUser();
  if (!user) {
    redirect("/sign-in");
  }
  return user;
}
