import { describe, expect, it } from "vitest";

import { fail, ok } from "@/lib/api-response";

describe("api responses", () => {
  it("wraps success data in the standard envelope", async () => {
    const response = ok({ id: "abc" }, 201);
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ success: true, data: { id: "abc" } });
  });

  it("maps error codes to HTTP statuses", async () => {
    const cases = [
      ["BAD_REQUEST", 400],
      ["UNAUTHORIZED", 401],
      ["FORBIDDEN", 403],
      ["NOT_FOUND", 404],
      ["CONFLICT", 409],
      ["VALIDATION_ERROR", 422],
      ["RATE_LIMITED", 429],
      ["INTERNAL_ERROR", 500],
    ] as const;

    for (const [code, status] of cases) {
      const response = fail(code, "message");
      expect(response.status).toBe(status);
      expect(await response.json()).toEqual({ success: false, error: { code, message: "message" } });
    }
  });
});
