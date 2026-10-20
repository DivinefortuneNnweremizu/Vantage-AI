/**
 * Sign-in without Supabase ("guest sign-in"). It is on in two situations:
 *
 * 1. Local development: DEV_AUTH=true and NODE_ENV is not production. Everyone is one fixed demo user.
 *    This is impossible to enable in production: NODE_ENV=production always turns DEV_AUTH off.
 * 2. Showcase mode: SHOWCASE_MODE=true. A deliberate, separate opt-in that works in production, for
 *    showing the prototype without Supabase. Every browser gets its own private temporary account.
 *    Any email and password works, so this is NOT real security. Never use it for real people's data.
 */
export const DEV_USER = {
  id: "00000000-0000-4000-8000-000000000001",
  email: "demo@vantage.local",
  fullName: "Demo Designer",
  avatarUrl: null,
} as const;

/**
 * Dev sign-in is a real flow, so the Log in, Sign up, and onboarding screens can be tried.
 * Plain cookies stand in for a Supabase session:
 * - the session cookie says someone signed in. "existing" is a returning user, "new" is a fresh sign-up.
 *   It is tied to one run of the dev server, so every `npm run dev` starts signed out.
 * - the name cookie holds the name entered in onboarding.
 * - the known cookie lasts a year. It means this browser already has an account, so a signed-out visit
 *   goes to Log in. Without it the visitor is new and goes to Sign up, then onboarding.
 */
export const DEV_SESSION_COOKIE = "vantage-dev-session";
export const DEV_NAME_COOKIE = "vantage-dev-name";
export const DEV_KNOWN_COOKIE = "vantage-dev-known";
/** Showcase mode only: the id of this browser's own temporary account. */
export const DEV_USER_COOKIE = "vantage-dev-user";

export type DevSessionKind = "existing" | "new";

/** Changes on every start of the dev server (the launcher sets it). Sessions from earlier runs stop working. */
function devBootId(): string {
  return process.env.DEV_BOOT_ID || "local";
}

export function encodeDevSession(kind: DevSessionKind): string {
  return `${kind}.${devBootId()}`;
}

export function parseDevSession(value: string | undefined): DevSessionKind | null {
  if (!value) return null;
  if (value === `existing.${devBootId()}`) return "existing";
  if (value === `new.${devBootId()}`) return "new";
  return null;
}

/** True when the app is a showcase: fake sign-in with a separate temporary account per browser. */
export function isShowcaseMode(): boolean {
  return process.env.SHOWCASE_MODE === "true";
}

/** True when sign-in is the guest sign-in (local development, or showcase mode) instead of Supabase. */
export function isGuestAuthEnabled(): boolean {
  return isShowcaseMode() || (process.env.NODE_ENV !== "production" && process.env.DEV_AUTH === "true");
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidGuestId(value: string | undefined): value is string {
  return value !== undefined && UUID.test(value);
}

interface GuestSession {
  kind: DevSessionKind;
  name: string | null;
  /** The browser's own account id. Only set in showcase mode. */
  userId: string | null;
}

/** Who a guest sign-in is. A fresh sign-up has no name until onboarding saves one. */
export function guestIdentity(session: GuestSession): { id: string; email: string; fullName: string | null; avatarUrl: null } {
  if (isShowcaseMode() && session.userId) {
    return {
      id: session.userId,
      email: `guest-${session.userId.replaceAll("-", "").slice(0, 12)}@showcase.local`,
      fullName: session.name || (session.kind === "new" ? null : "Guest"),
      avatarUrl: null,
    };
  }
  return { ...DEV_USER, fullName: session.name || (session.kind === "new" ? null : DEV_USER.fullName) };
}
