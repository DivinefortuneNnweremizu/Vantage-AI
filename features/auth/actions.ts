"use server";

import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { isDevAuthEnabled } from "@/features/auth/dev-auth";
import { endDevSession, saveDevName, startDevSession } from "@/features/auth/dev-session";
import { getSessionUser } from "@/features/auth/get-current-user";
import { safeRedirectPath } from "@/features/auth/redirect";
import { onboardingSchema, signInSchema, signUpSchema } from "@/features/auth/schemas";

export interface AuthFormState {
  error: string | null;
  message: string | null;
  /** What was typed, so a failed submit does not clear the field. Passwords are never sent back. */
  email?: string;
  fullName?: string;
}

function textField(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

const GENERIC_AUTH_ERROR = "We could not sign you in. Check your email and password and try again.";

export async function signInAction(_previous: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? GENERIC_AUTH_ERROR, message: null, email: textField(formData, "email") };
  }

  const destination = safeRedirectPath(formData.get("next"));

  // Dev sign-in: any valid details continue as the demo user.
  if (isDevAuthEnabled()) {
    await startDevSession("existing");
    redirect(destination);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { error: GENERIC_AUTH_ERROR, message: null, email: textField(formData, "email") };
  }

  redirect(destination);
}

export async function signUpAction(_previous: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = signUpSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form and try again.", message: null, email: textField(formData, "email") };
  }

  if (isDevAuthEnabled()) {
    await startDevSession("new");
    redirect("/welcome");
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/auth/callback`,
    },
  });

  if (error) {
    return { error: "We could not create your account. Try a different email or a stronger password.", message: null, email: textField(formData, "email") };
  }

  if (data.session) {
    redirect("/welcome");
  }

  return { error: null, message: "Check your email to confirm your account, then sign in." };
}

/** Onboarding: saves the name the product greets the user with, then opens New Session. */
export async function completeOnboardingAction(_previous: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = onboardingSchema.safeParse({ fullName: formData.get("fullName") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Enter your name.", message: null, fullName: textField(formData, "fullName") };
  }

  const user = await getSessionUser();
  if (!user) redirect("/sign-in");

  // Dev sign-in has no Supabase account. The name is kept in a cookie.
  if (isDevAuthEnabled()) {
    await saveDevName(parsed.data.fullName);
    redirect("/");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ data: { full_name: parsed.data.fullName } });
  if (error) return { error: "We could not save your name. Try again.", message: null, fullName: textField(formData, "fullName") };
  await prisma.user.update({ where: { id: user.id }, data: { fullName: parsed.data.fullName } });

  redirect("/");
}

export async function signOutAction(): Promise<void> {
  if (isDevAuthEnabled()) {
    await endDevSession();
  } else {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }
  redirect("/sign-in");
}
