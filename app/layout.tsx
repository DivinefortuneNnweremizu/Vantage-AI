import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";

import "@fontsource/open-sauce-two/400.css";
import "@fontsource/open-sauce-two/500.css";
import "@fontsource/open-sauce-two/600.css";
import "./globals.css";

import { THEME_COOKIE, parseTheme } from "@/features/settings/theme";

// Link previews need absolute image addresses, so they are built from the public address of the site.
const siteUrl =
  process.env.NEXT_PUBLIC_APP_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");

const DESCRIPTION = "Principle-based design critique on demand. Know exactly what to fix in your design.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Vantage AI",
    template: "%s | Vantage AI",
  },
  description: DESCRIPTION,
  openGraph: { siteName: "Vantage AI", title: "Vantage AI", description: DESCRIPTION, type: "website" },
  twitter: { card: "summary_large_image", title: "Vantage AI", description: DESCRIPTION },
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
