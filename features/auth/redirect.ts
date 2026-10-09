/**
 * Returns `value` only when it is a path on this site, otherwise `fallback`.
 * Used for every "go back to where you were" redirect, so nobody can send a user to another site.
 */
export function safeRedirectPath(value: unknown, fallback = "/"): string {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//") ? value : fallback;
}
