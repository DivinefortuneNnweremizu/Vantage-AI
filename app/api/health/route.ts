import { ok } from "@/lib/api-response";

/** Uptime probe. Returns no user data. */
export function GET() {
  return ok({ status: "ok" });
}
