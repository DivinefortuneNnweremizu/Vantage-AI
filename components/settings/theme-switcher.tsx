"use client";

import { useState, useTransition } from "react";
import { Monitor, Moon, Sun } from "lucide-react";

import { setThemePreference } from "@/features/settings/actions";
import type { ThemePreference } from "@/features/settings/theme";
import { SegmentedControl, type SegmentOption } from "@/components/ui/segmented-control";

const OPTIONS: ReadonlyArray<SegmentOption<ThemePreference>> = [
  { value: "light", label: "Light", icon: <Sun className="size-5" aria-hidden="true" /> },
  { value: "dark", label: "Dark", icon: <Moon className="size-5" aria-hidden="true" /> },
  { value: "system", label: "System", icon: <Monitor className="size-5" aria-hidden="true" /> },
];

interface ThemeSwitcherProps {
  initialTheme: ThemePreference;
}

export function ThemeSwitcher({ initialTheme }: ThemeSwitcherProps) {
  const [theme, setTheme] = useState<ThemePreference>(initialTheme);
  const [, startTransition] = useTransition();

  function handleChange(next: ThemePreference): void {
    setTheme(next);
    startTransition(() => {
      void setThemePreference(next);
    });
  }

  return <SegmentedControl label="Theme" value={theme} options={OPTIONS} onChange={handleChange} />;
}
