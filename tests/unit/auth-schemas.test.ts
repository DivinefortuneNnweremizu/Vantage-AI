import { describe, expect, it } from "vitest";

import { onboardingSchema, signInSchema, signUpSchema } from "@/features/auth/schemas";
import { parseTheme } from "@/features/settings/theme";

describe("auth schemas", () => {
  it("accepts a valid sign-in", () => {
    expect(signInSchema.safeParse({ email: "a@b.co", password: "x" }).success).toBe(true);
  });

  it("rejects an invalid email", () => {
    expect(signInSchema.safeParse({ email: "nope", password: "x" }).success).toBe(false);
  });

  it("requires a 10 character password to sign up", () => {
    const base = { email: "ada@example.com" };
    expect(signUpSchema.safeParse({ ...base, password: "short" }).success).toBe(false);
    expect(signUpSchema.safeParse({ ...base, password: "long-enough-password" }).success).toBe(true);
  });
});

describe("onboarding schema", () => {
  it("needs a name", () => {
    expect(onboardingSchema.safeParse({ fullName: "   " }).success).toBe(false);
    expect(onboardingSchema.safeParse({ fullName: "Ada Lovelace" }).success).toBe(true);
  });
});

describe("theme preference", () => {
  it("falls back to system for unknown values", () => {
    expect(parseTheme(undefined)).toBe("system");
    expect(parseTheme("purple")).toBe("system");
  });

  it("accepts light, dark and system", () => {
    expect(parseTheme("light")).toBe("light");
    expect(parseTheme("dark")).toBe("dark");
    expect(parseTheme("system")).toBe("system");
  });
});

describe("safeRedirectPath", () => {
  it("allows paths on this site", async () => {
    const { safeRedirectPath } = await import("@/features/auth/redirect");
    expect(safeRedirectPath("/library")).toBe("/library");
  });

  it("falls back for anything that could leave the site", async () => {
    const { safeRedirectPath } = await import("@/features/auth/redirect");
    for (const value of ["//evil.com", "https://evil.com", "library", "", null, undefined]) {
      expect(safeRedirectPath(value)).toBe("/");
    }
  });
});
