/**
 * The visitor's country, as a two-letter ISO code, or null when it is not known.
 *
 * Vercel adds this header to every request, based on the visitor's IP address. It is a best guess:
 * someone on a VPN can appear to be elsewhere. It is missing when running locally.
 */
const COUNTRY_HEADER = "x-vercel-ip-country";

export function visitorCountry(headers: { get(name: string): string | null }): string | null {
  const value = headers.get(COUNTRY_HEADER)?.trim().toUpperCase();
  return value && /^[A-Z]{2}$/.test(value) ? value : null;
}
