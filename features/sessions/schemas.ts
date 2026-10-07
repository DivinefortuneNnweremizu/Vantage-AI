import { z } from "zod";

export const pageScopeSchema = z.enum(["SINGLE_PAGE", "JOURNEY"]);
export const platformSchema = z.enum(["APP", "WEB"]);

export const createSessionSchema = z.object({
  pageScope: pageScopeSchema,
  platform: platformSchema,
});

export const updateSessionSchema = z
  .object({
    title: z.string().trim().min(1, "Enter a title.").max(80, "Use 80 characters or fewer.").optional(),
    goal: z.string().trim().max(600, "Use 600 characters or fewer.").optional(),
  })
  .refine((value) => value.title !== undefined || value.goal !== undefined, {
    message: "Nothing to update.",
  });

export const uuidSchema = z.string().uuid();

export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type UpdateSessionInput = z.infer<typeof updateSessionSchema>;
