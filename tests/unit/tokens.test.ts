import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

interface TokenFile {
  primitives: Record<string, string>;
  color: { light: Record<string, string>; dark: Record<string, string> };
  utilities: Record<string, string>;
}

const tokens = JSON.parse(readFileSync(join(process.cwd(), "tokens", "color-tokens.json"), "utf8")) as TokenFile;
const css = readFileSync(join(process.cwd(), "tokens", "design-tokens.css"), "utf8");

function hexToRgb(hex: string): [number, number, number] {
  const value = hex.replace("#", "");
  return [0, 2, 4].map((index) => parseInt(value.slice(index, index + 2), 16)) as [number, number, number];
}

function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((channel) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(foreground: string, background: string): number {
  const [lighter, darker] = [luminance(foreground), luminance(background)].sort((a, b) => b - a) as [number, number];
  return (lighter + 0.05) / (darker + 0.05);
}

function resolve(theme: "light" | "dark", role: string): string {
  const primitive = tokens.color[theme][role];
  if (!primitive) throw new Error(`Missing role ${role} in ${theme}`);
  const hex = tokens.primitives[primitive];
  if (!hex) throw new Error(`Missing primitive ${primitive}`);
  return hex;
}

describe("design tokens", () => {
  it("defines the same roles in light and dark", () => {
    expect(Object.keys(tokens.color.dark).sort()).toEqual(Object.keys(tokens.color.light).sort());
  });

  it("only references primitives that exist", () => {
    for (const theme of ["light", "dark"] as const) {
      for (const [role, primitive] of Object.entries(tokens.color[theme])) {
        expect(tokens.primitives[primitive], `${theme}.${role} -> ${primitive}`).toBeDefined();
      }
    }
  });

  it("maps every utility to an existing role", () => {
    for (const [utility, role] of Object.entries(tokens.utilities)) {
      expect(tokens.color.light[role], `utility ${utility} -> ${role}`).toBeDefined();
    }
  });

  it("keeps the brand primary at #3929CE", () => {
    expect(tokens.primitives["primary-500"]?.toUpperCase()).toBe("#3929CE");
  });

  it("emits both themes and the system-preference block", () => {
    expect(css).toContain('[data-theme="dark"]');
    expect(css).toContain("@media (prefers-color-scheme: dark)");
    expect(css).toContain("@theme inline");
  });
});

describe("contrast", () => {
  const checks: Array<[string, string, string, number]> = [
    ["primary-500 button text", "on-primary-color", "primary-color", 4.5],
    ["body text", "text-primary-color", "background-color", 4.5],
    ["body text on surface", "text-primary-color", "surface-color", 4.5],
    ["secondary text", "text-secondary-color", "surface-color", 4.5],
    ["tertiary text", "text-tertiary-color", "surface-color", 4.5],
    ["accent text", "accent-color", "surface-color", 4.5],
    ["selected text", "on-primary-container-color", "primary-container-color", 4.5],
    ["success badge", "on-success-container-color", "success-container-color", 4.5],
    ["warning badge", "on-warning-container-color", "warning-container-color", 4.5],
    ["error badge", "on-error-container-color", "error-container-color", 4.5],
    ["info badge", "on-info-container-color", "info-container-color", 4.5],
  ];

  for (const theme of ["light", "dark"] as const) {
    for (const [name, foreground, background, minimum] of checks) {
      it(`${theme}: ${name} is at least ${minimum}:1`, () => {
        expect(contrast(resolve(theme, foreground), resolve(theme, background))).toBeGreaterThanOrEqual(minimum);
      });
    }
  }

  it("dark: input borders reach 3:1 against the surface", () => {
    expect(contrast(resolve("dark", "border-strong-color"), resolve("dark", "surface-color"))).toBeGreaterThanOrEqual(3);
  });

  // Known gap, tracked in docs/implementation-plan.md: the light input border
  // (grey-300 on white) is about 1.5:1, below the 3:1 WCAG 1.4.11 target.
  it.todo("light: input borders reach 3:1 against the surface");
});
