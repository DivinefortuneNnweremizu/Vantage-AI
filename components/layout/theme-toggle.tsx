"use client";

import { useSyncExternalStore, useTransition } from "react";
import { Moon, Sun } from "lucide-react";

import { setThemePreference } from "@/features/settings/actions";
import type { ThemePreference } from "@/features/settings/theme";
import { IconButton } from "@/components/ui/icon-button";

type EffectiveTheme = "light" | "dark";

const THEME_CHANGED = "vantage-theme-changed";
const DARK_QUERY = "(prefers-color-scheme: dark)";

function subscribe(onChange: () => void): () => void {
  const media = window.matchMedia(DARK_QUERY);
  media.addEventListener("change", onChange);
  window.addEventListener(THEME_CHANGED, onChange);
  return () => {
    media.removeEventListener("change", onChange);
    window.removeEventListener(THEME_CHANGED, onChange);
  };
}

/** The theme the user is actually seeing: an explicit choice wins, otherwise the device setting. */
function readEffectiveTheme(): EffectiveTheme {
  const explicit = document.documentElement.dataset.theme;
  if (explicit === "light" || explicit === "dark") return explicit;
  return window.matchMedia(DARK_QUERY).matches ? "dark" : "light";
}

interface ThemeToggleProps {
  /** The saved choice, used for the first server render so the icon is right before hydration. */
  initialTheme: ThemePreference;
}

/** One icon button in the header. It switches between light and dark and remembers the choice. */
export function ThemeToggle({ initialTheme }: ThemeToggleProps) {
  const [, startTransition] = useTransition();
  const effective = useSyncExternalStore(
    subscribe,
    readEffectiveTheme,
    (): EffectiveTheme => (initialTheme === "dark" ? "dark" : "light"),
  );

  function toggle(): void {
    const next: EffectiveTheme = effective === "dark" ? "light" : "dark";
    // Switch right away, then save. The server render agrees once the cookie is set.
    document.documentElement.dataset.theme = next;
    window.dispatchEvent(new Event(THEME_CHANGED));
    startTransition(() => {
      void setThemePreference(next);
    });
  }

  const isDark = effective === "dark";
  return (
    <IconButton tone="filled" aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"} onClick={toggle}>
      {isDark ? <Sun className="size-5" aria-hidden="true" /> : <Moon className="size-5" aria-hidden="true" />}
    </IconButton>
  );
}
