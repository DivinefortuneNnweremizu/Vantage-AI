import { z } from "zod";

const emailSchema = z.string().trim().min(1, "Enter your email.").email("Enter a valid email address.");

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password."),
});

/** Sign-up is just an email and a password. The name is asked for in onboarding, right after. */
export const signUpSchema = z.object({
  email: emailSchema,
  password: z
    .string()
    .min(10, "Use at least 10 characters.")
    .max(128, "Use 128 characters or fewer."),
});

export const onboardingSchema = z.object({
  fullName: z.string().trim().min(1, "Enter your name.").max(80, "Use 80 characters or fewer."),
});
