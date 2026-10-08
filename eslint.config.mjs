import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) });

// Design system guardrails from .agents/rules/design-system.md.
// Arbitrary color values and the light-only grey scale are not allowed in components.
const ARBITRARY_COLOR = "\\b(?:bg|text|border|ring|outline|fill|stroke|from|to|via|divide|decoration)-\\[(?:#|rgb|hsl)";
const GREY_SCALE = "\\b(?:bg|text|border|ring|outline|fill|stroke|divide)-grey-\\d";

const designSystemRules = {
  "no-restricted-syntax": [
    "error",
    {
      selector: `Literal[value=/${ARBITRARY_COLOR}/]`,
      message: "Arbitrary color values are not allowed. Use a token utility. See design.md.",
    },
    {
      selector: `TemplateElement[value.raw=/${ARBITRARY_COLOR}/]`,
      message: "Arbitrary color values are not allowed. Use a token utility. See design.md.",
    },
    {
      selector: `Literal[value=/${GREY_SCALE}/]`,
      message: "Light-only grey scale classes break dark mode. Use theme-aware utilities such as text-fg-muted. See design.md.",
    },
    {
      selector: `TemplateElement[value.raw=/${GREY_SCALE}/]`,
      message: "Light-only grey scale classes break dark mode. Use theme-aware utilities such as text-fg-muted. See design.md.",
    },
  ],
};

const config = [
  { ignores: [".next/**", ".next-*/**", "node_modules/**", "next-env.d.ts", "tokens/design-tokens.css"] },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    // The token compiler is a plain Node CommonJS script.
    files: ["tokens/*.js"],
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },
  {
    files: ["app/**/*.{ts,tsx}", "components/**/*.{ts,tsx}", "features/**/*.{ts,tsx}"],
    rules: {
      ...designSystemRules,
      "@typescript-eslint/no-explicit-any": "error",
    },
  },
];

export default config;
