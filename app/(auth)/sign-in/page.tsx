import type { Metadata } from "next";
import Link from "next/link";

import { AuthForm } from "@/components/auth/auth-form";
import { signInAction } from "@/features/auth/actions";
import { safeRedirectPath } from "@/features/auth/redirect";

export const metadata: Metadata = { title: "Log in" };

interface SignInPageProps {
  searchParams: Promise<{ next?: string; error?: string }>;
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const { next, error } = await searchParams;
  const safeNext = next ? safeRedirectPath(next) : undefined;

  return (
    <div className="flex flex-col gap-6 text-center">
      <div className="flex flex-col gap-2">
        <h1 className="cv01 text-2xl font-semibold text-fg-strong">Welcome back</h1>
        <p className="text-base text-fg-muted">Log in to get design feedback you can act on.</p>
      </div>
      {error === "auth_callback_failed" ? (
        <p role="alert" className="text-xs text-error-fg">
          We could not complete sign-in. Try again.
        </p>
      ) : null}
      <AuthForm mode="sign-in" action={signInAction} next={safeNext} />
      <p className="text-sm text-fg-muted">
        Don&apos;t have an account?{" "}
        <Link href="/sign-up" className="font-medium text-fg underline underline-offset-2 hover:text-accent">
          Sign up
        </Link>
      </p>
    </div>
  );
}
