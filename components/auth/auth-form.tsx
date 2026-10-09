"use client";

import { useActionState, useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

import type { AuthFormState } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/cn";

interface AuthFormProps {
  mode: "sign-in" | "sign-up" | "onboarding";
  action: (previous: AuthFormState, formData: FormData) => Promise<AuthFormState>;
  next?: string;
}

const INITIAL_STATE: AuthFormState = { error: null, message: null };

/** Pill-shaped fields and one wide button, as in ChatGPT's dialog. Labels are there for screen readers. */
const pillInput = "min-h-12 rounded-full px-5 text-base shadow-none";

export function AuthForm({ mode, action, next }: AuthFormProps) {
  const [state, formAction, isPending] = useActionState(action, INITIAL_STATE);
  const [showPassword, setShowPassword] = useState(false);
  const errorId = useId();
  const describedBy = state.error ? errorId : undefined;

  return (
    <form action={formAction} className="flex flex-col gap-3" noValidate>
      {next ? <input type="hidden" name="next" value={next} /> : null}

      {mode === "onboarding" ? (
        <div>
          <Label htmlFor="fullName" className="sr-only">
            Full name
          </Label>
          <Input
            id="fullName"
            name="fullName"
            defaultValue={state.fullName}
            autoComplete="name"
            placeholder="Full name"
            className={pillInput}
            required
            autoFocus
            aria-describedby={describedBy}
          />
        </div>
      ) : (
        <>
          <div>
            <Label htmlFor="email" className="sr-only">
              Email address
            </Label>
            <Input
              id="email"
              name="email"
              defaultValue={state.email}
              type="email"
              autoComplete="email"
              placeholder="Email address"
              className={pillInput}
              required
              autoFocus
              aria-describedby={describedBy}
            />
          </div>

          <div className="relative">
            <Label htmlFor="password" className="sr-only">
              Password
            </Label>
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
              placeholder="Password"
              className={cn(pillInput, "pr-14")}
              required
              aria-describedby={describedBy}
            />
            <button
              type="button"
              onClick={() => setShowPassword((shown) => !shown)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              className="absolute top-1/2 right-2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full text-fg-muted hover:bg-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              {showPassword ? <EyeOff className="size-5" aria-hidden="true" /> : <Eye className="size-5" aria-hidden="true" />}
            </button>
          </div>
          {mode === "sign-up" ? <p className="px-2 text-xs text-fg-subtle">Use at least 10 characters.</p> : null}
        </>
      )}

      <div aria-live="polite" id={errorId} className="px-2 empty:hidden">
        {state.error ? <p className="text-xs text-error-fg">{state.error}</p> : null}
        {state.message ? <p className="text-sm text-success-fg">{state.message}</p> : null}
      </div>

      <Button type="submit" isLoading={isPending} size="lg" className="min-h-12 w-full rounded-full">
        Continue
      </Button>
    </form>
  );
}
