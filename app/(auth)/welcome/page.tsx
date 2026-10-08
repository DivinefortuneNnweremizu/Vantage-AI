import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth/auth-form";
import { completeOnboardingAction } from "@/features/auth/actions";
import { requireCurrentUser } from "@/features/auth/get-current-user";

export const metadata: Metadata = { title: "Welcome" };

/** Onboarding. One question, then straight to New Session. */
export default async function WelcomePage() {
  const user = await requireCurrentUser();
  if (user.fullName) redirect("/");

  return (
    <div className="flex flex-col gap-6 text-center">
      <div className="flex flex-col gap-2">
        <h1 className="cv01 text-2xl font-semibold text-fg-strong">What should we call you?</h1>
        <p className="text-base text-fg-muted">We use your name to greet you. You can change it later.</p>
      </div>
      <AuthForm mode="onboarding" action={completeOnboardingAction} />
    </div>
  );
}
