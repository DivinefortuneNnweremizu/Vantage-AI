import type { ApiErrorCode } from "@/lib/api-response";

/**
 * An error whose message is safe to show to the user.
 * Anything that is not an AppError is treated as an internal failure and hidden behind a generic message.
 */
export class AppError extends Error {
  readonly code: ApiErrorCode;

  constructor(code: ApiErrorCode, message: string) {
    super(message);
    this.name = "AppError";
    this.code = code;
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
