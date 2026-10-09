import { z } from "zod";

export const THEME_COOKIE = "vantage-theme";

export const themeSchema = z.enum(["light", "dark", "system"]);

export type ThemePreference = z.infer<typeof themeSchema>;

const DEFAULT_THEME: ThemePreference = "system";

export function parseTheme(value: string | undefined): ThemePreference {
  const parsed = themeSchema.safeParse(value);
  return parsed.success ? parsed.data : DEFAULT_THEME;
}
