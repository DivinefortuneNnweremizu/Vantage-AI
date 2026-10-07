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

export function isDevAuthEnabled(): boolean {
  return process.env.NODE_ENV !== "production" && process.env.DEV_AUTH === "true";
}
