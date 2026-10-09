/**
 * Small helpers for calling our own API from the browser.
 * Every API response is { success: true, data } or { success: false, error: { code, message } }.
 */
export class ApiRequestError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "ApiRequestError";
    this.code = code;
  }
}

interface ApiFailureBody {
  success: false;
  error: { code: string; message: string };
}

interface ApiSuccessBody<T> {
  success: true;
  data: T;
}

export async function readApiResponse<T>(response: Response): Promise<T> {
  let body: ApiSuccessBody<T> | ApiFailureBody | null = null;
  try {
    body = (await response.json()) as ApiSuccessBody<T> | ApiFailureBody;
  } catch {
    // Not JSON. Fall through to the generic message.
  }

  if (body && body.success) {
    return body.data;
  }
  if (body && !body.success) {
    throw new ApiRequestError(body.error.code, body.error.message);
  }
  throw new ApiRequestError("INTERNAL_ERROR", "Something went wrong. Try again.");
}

export async function postJson<T>(url: string, payload: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return readApiResponse<T>(response);
}

export async function patchJson<T>(url: string, payload: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return readApiResponse<T>(response);
}

export async function deleteRequest<T>(url: string): Promise<T> {
  const response = await fetch(url, { method: "DELETE" });
  return readApiResponse<T>(response);
}

export interface UploadedAsset {
  id: string;
  order: number;
  width: number | null;
  height: number | null;
}

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const ACCEPTED_MIME_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;
export const ACCEPT_ATTRIBUTE = ACCEPTED_MIME_TYPES.join(",");

/** Checks a file in the browser for a faster, friendlier message. The server checks again. */
export function checkFileBeforeUpload(file: File): string | null {
  if (!(ACCEPTED_MIME_TYPES as readonly string[]).includes(file.type)) {
    return `${file.name} is not a PNG, JPG, or WebP image.`;
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return `${file.name} is larger than 10 MB.`;
  }
  return null;
}

export async function uploadAsset(sessionId: string, file: File, replaceAssetId?: string): Promise<UploadedAsset> {
  const form = new FormData();
  form.set("file", file);
  if (replaceAssetId) form.set("replaceAssetId", replaceAssetId);

  const response = await fetch(`/api/sessions/${sessionId}/assets`, { method: "POST", body: form });
  return readApiResponse<UploadedAsset>(response);
}

export function messageFor(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong. Try again.";
}
