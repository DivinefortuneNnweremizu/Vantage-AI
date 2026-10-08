import type { Metadata } from "next";
import Link from "next/link";

import { AuthForm } from "@/components/auth/auth-form";
import { signUpAction } from "@/features/auth/actions";

export const metadata: Metadata = { title: "Sign up" };

export default function SignUpPage() {
  return (
    <div className="flex flex-col gap-6 text-center">
      <div className="flex flex-col gap-2">
        <h1 className="cv01 text-2xl font-semibold text-fg-strong">Create an account</h1>
        <p className="text-base text-fg-muted">Get principle-based feedback on your designs, and a place to track every iteration.</p>
      </div>
      <AuthForm mode="sign-up" action={signUpAction} />
      <p className="text-sm text-fg-muted">
        Already have an account?{" "}
        <Link href="/sign-in" className="font-medium text-fg underline underline-offset-2 hover:text-accent">
          Log in
        </Link>
      </p>
    </div>
  );
}
