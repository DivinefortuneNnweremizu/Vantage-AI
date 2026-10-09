"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { DEV_KNOWN_COOKIE, DEV_NAME_COOKIE, DEV_SESSION_COOKIE, encodeDevSession, isDevAuthEnabled, type DevSessionKind } from "@/features/auth/dev-auth";
import { getSessionUser } from "@/features/auth/get-current-user";
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

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

async function startDevSession(kind: DevSessionKind): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(DEV_SESSION_COOKIE, encodeDevSession(kind), { path: "/", sameSite: "lax", httpOnly: true });
  // Signing in means this browser has an account. Sign-ups are marked once onboarding is done.
  if (kind === "existing") markDevBrowserKnown(cookieStore);
  // A fresh sign-up starts without a name, so onboarding asks for it.
  cookieStore.delete(DEV_NAME_COOKIE);
}

function markDevBrowserKnown(cookieStore: Awaited<ReturnType<typeof cookies>>): void {
  cookieStore.set(DEV_KNOWN_COOKIE, "1", { path: "/", maxAge: ONE_YEAR_SECONDS, sameSite: "lax", httpOnly: true });
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

  const next = formData.get("next");
  const destination = typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : "/";

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
    const cookieStore = await cookies();
    cookieStore.set(DEV_NAME_COOKIE, parsed.data.fullName, { path: "/", maxAge: ONE_YEAR_SECONDS, sameSite: "lax", httpOnly: true });
    markDevBrowserKnown(cookieStore);
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
    const cookieStore = await cookies();
    cookieStore.delete(DEV_SESSION_COOKIE);
    cookieStore.delete(DEV_NAME_COOKIE);
    redirect("/sign-in");
  }

  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/sign-in");
}
