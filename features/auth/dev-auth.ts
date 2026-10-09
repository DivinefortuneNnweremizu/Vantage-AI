/**
 * Local development sign-in.
 *
 * When DEV_AUTH=true and the app is NOT running in production, every request is treated as
 * a fixed demo user. This lets the product run end to end before Supabase is connected.
 *
 * It is impossible to enable in production: NODE_ENV=production always disables it.
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

export function isDevAuthEnabled(): boolean {
  return process.env.NODE_ENV !== "production" && process.env.DEV_AUTH === "true";
}
