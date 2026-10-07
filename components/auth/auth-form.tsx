"use client";

import { useActionState, useId } from "react";

import type { AuthFormState } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AuthFormProps {
  mode: "sign-in" | "sign-up";
  action: (previous: AuthFormState, formData: FormData) => Promise<AuthFormState>;
  next?: string;
}

const INITIAL_STATE: AuthFormState = { error: null, message: null };

export function AuthForm({ mode, action, next }: AuthFormProps) {
  const [state, formAction, isPending] = useActionState(action, INITIAL_STATE);
  const errorId = useId();
  const isSignUp = mode === "sign-up";

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      {next ? <input type="hidden" name="next" value={next} /> : null}

      {isSignUp ? (
        <div>
          <Label htmlFor="fullName">Name</Label>
          <Input id="fullName" name="fullName" autoComplete="name" required aria-describedby={state.error ? errorId : undefined} />
        </div>
      ) : null}

      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          aria-describedby={state.error ? errorId : undefined}
        />
      </div>

      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete={isSignUp ? "new-password" : "current-password"}
          required
          aria-describedby={state.error ? errorId : undefined}
        />
        {isSignUp ? <p className="mt-1 text-xs text-fg-subtle">Use at least 10 characters.</p> : null}
      </div>

      <div aria-live="polite" id={errorId}>
        {state.error ? <p className="text-xs text-error-fg">{state.error}</p> : null}
        {state.message ? <p className="text-sm text-success-fg">{state.message}</p> : null}
      </div>

      <Button type="submit" isLoading={isPending} className="w-full">
        {isSignUp ? "Create account" : "Sign in"}
      </Button>
    </form>
  );
}
