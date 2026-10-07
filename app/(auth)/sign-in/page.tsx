import type { Metadata } from "next";
import Link from "next/link";

import { AuthForm } from "@/components/auth/auth-form";
import { signInAction } from "@/features/auth/actions";

export const metadata: Metadata = { title: "Sign in" };

interface SignInPageProps {
  searchParams: Promise<{ next?: string; error?: string }>;
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const { next, error } = await searchParams;
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : undefined;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="cv01 text-xl font-semibold">Welcome back</h1>
      {error === "auth_callback_failed" ? (
        <p role="alert" className="text-xs text-error-fg">
          We could not complete sign-in. Try again.
        </p>
      ) : null}
      <AuthForm mode="sign-in" action={signInAction} next={safeNext} />
      <p className="text-sm text-fg-muted">
        New to Vantage?{" "}
        <Link href="/sign-up" className="font-medium text-fg underline underline-offset-2 hover:text-accent">
          Create an account
        </Link>
      </p>
    </div>
  );
}
