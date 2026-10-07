import type { Metadata } from "next";
import Link from "next/link";

import { AuthForm } from "@/components/auth/auth-form";
import { signUpAction } from "@/features/auth/actions";

export const metadata: Metadata = { title: "Create account" };

export default function SignUpPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="cv01 text-xl font-semibold">Create your account</h1>
      <AuthForm mode="sign-up" action={signUpAction} />
      <p className="text-sm text-fg-muted">
        Already have an account?{" "}
        <Link href="/sign-in" className="font-medium text-fg underline underline-offset-2 hover:text-accent">
          Sign in
        </Link>
      </p>
    </div>
  );
}
