import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";

import "@fontsource/open-sauce-two/400.css";
import "@fontsource/open-sauce-two/500.css";
import "@fontsource/open-sauce-two/600.css";
import "./globals.css";

import { THEME_COOKIE, parseTheme } from "@/features/settings/theme";

export const metadata: Metadata = {
  title: {
    default: "Vantage AI",
    template: "%s | Vantage AI",
  },
  description: "Principle-based design critique on demand.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F9FAFB" },
    { media: "(prefers-color-scheme: dark)", color: "#131314" },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const theme = parseTheme(cookieStore.get(THEME_COOKIE)?.value);
  // "system" sets no attribute, so the prefers-color-scheme rule applies.
  const dataTheme = theme === "system" ? undefined : theme;

  return (
    <html lang="en" data-theme={dataTheme}>
      <body>{children}</body>
    </html>
  );
}
