import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";

import {
  DEV_KNOWN_COOKIE,
  DEV_NAME_COOKIE,
  DEV_SESSION_COOKIE,
  DEV_USER_COOKIE,
  encodeDevSession,
  isShowcaseMode,
  isValidGuestId,
  parseDevSession,
  type DevSessionKind,
} from "@/features/auth/dev-auth";

/**
 * The guest sign-in (local development, or showcase mode). Everything that touches its cookies lives here,
 * so the real (Supabase) code paths never need to know how it works. See dev-auth.ts.
 */
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;
// Secure in production, so the cookies only travel over https.
const SESSION_COOKIE_OPTIONS = { path: "/", sameSite: "lax", httpOnly: true, secure: process.env.NODE_ENV === "production" } as const;
const LASTING_COOKIE_OPTIONS = { ...SESSION_COOKIE_OPTIONS, maxAge: ONE_YEAR_SECONDS } as const;

export async function readDevSession(): Promise<{ kind: DevSessionKind; name: string | null; userId: string | null } | null> {
  const cookieStore = await cookies();
  const kind = parseDevSession(cookieStore.get(DEV_SESSION_COOKIE)?.value);
  if (!kind) return null;
  const userCookie = cookieStore.get(DEV_USER_COOKIE)?.value;
  return {
    kind,
    name: cookieStore.get(DEV_NAME_COOKIE)?.value || null,
    userId: isValidGuestId(userCookie) ? userCookie : null,
  };
}

/** "existing" is a returning user. "new" is a fresh sign-up, who has no name until onboarding. */
export async function startDevSession(kind: DevSessionKind): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(DEV_SESSION_COOKIE, encodeDevSession(kind), SESSION_COOKIE_OPTIONS);
  // Showcase mode: each browser gets its own account, and keeps it when it logs out and back in.
  if (isShowcaseMode() && !isValidGuestId(cookieStore.get(DEV_USER_COOKIE)?.value)) {
    cookieStore.set(DEV_USER_COOKIE, randomUUID(), LASTING_COOKIE_OPTIONS);
  }
  if (kind === "existing") {
    // Logging in means this browser has an account. A sign-up is marked once onboarding is done.
    cookieStore.set(DEV_KNOWN_COOKIE, "1", LASTING_COOKIE_OPTIONS);
  } else {
    cookieStore.delete(DEV_NAME_COOKIE);
  }
}

/** Onboarding is done: remember the name, and that this browser now has an account. */
export async function saveDevName(fullName: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(DEV_NAME_COOKIE, fullName, LASTING_COOKIE_OPTIONS);
  cookieStore.set(DEV_KNOWN_COOKIE, "1", LASTING_COOKIE_OPTIONS);
}

/** Logging out ends the session. The account (known browser, name) stays. */
export async function endDevSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(DEV_SESSION_COOKIE);
}
