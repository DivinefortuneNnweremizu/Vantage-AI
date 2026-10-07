"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { THEME_COOKIE, themeSchema, type ThemePreference } from "@/features/settings/theme";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

/** Stores the theme choice in a cookie so the server renders the right theme with no flash. */
export async function setThemePreference(value: ThemePreference): Promise<void> {
  const theme = themeSchema.parse(value);
  const cookieStore = await cookies();
  cookieStore.set(THEME_COOKIE, theme, {
    path: "/",
    maxAge: ONE_YEAR_SECONDS,
    sameSite: "lax",
    httpOnly: false,
  });
  revalidatePath("/", "layout");
}
