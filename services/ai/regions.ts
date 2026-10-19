/**
 * Where real AI analysis is switched off by default.
 *
 * Google's terms for the free Gemini tier say the free tier cannot be used for apps that serve people in
 * the European Economic Area, and they say the same for Switzerland and the United Kingdom. Visitors
 * there get a clearly labeled demo report instead.
 *
 * If you pay for the provider (so those terms no longer apply), set REAL_AI_BLOCKED_COUNTRIES=none.
 * To use another list, set it to country codes separated by commas, for example "DE,FR".
 */
const EEA = [
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU",
  "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE",
  // In the EEA but not in the EU.
  "IS", "LI", "NO",
];

const DEFAULT_BLOCKED = [...EEA, "CH", "GB"];

function blockedCountries(): string[] {
  const configured = process.env.REAL_AI_BLOCKED_COUNTRIES?.trim();
  // Empty counts as unset.
  if (!configured) return DEFAULT_BLOCKED;
  if (configured.toLowerCase() === "none") return [];
  return configured.split(",").map((code) => code.trim().toUpperCase()).filter(Boolean);
}

/** True when real AI should not be used for a visitor from this country. An unknown country is allowed. */
export function isRealAiBlocked(country: string | null): boolean {
  return country !== null && blockedCountries().includes(country);
}
