import Link from "next/link";
import { Sparkles } from "lucide-react";

import { AuthShowcase } from "@/components/auth/auth-showcase";
import { isShowcaseMode } from "@/features/auth/dev-auth";

/**
 * Log in, Sign up, and onboarding. Like Linktree's sign-up: the form on the left, and on large screens
 * a dark panel on the right that shows what the product does.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh bg-surface lg:grid-cols-2">
      <main className="flex flex-col px-6 py-8 sm:px-12 lg:px-16 xl:px-24">
        <Link
          href="/"
          className="flex w-fit items-center gap-2.5 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <span className="flex size-10 items-center justify-center rounded-badge bg-night-500 text-white">
            <Sparkles className="size-5" aria-hidden="true" />
          </span>
          <span className="cv01 text-2xl font-semibold text-fg-strong">Vantage</span>
        </Link>

        <div className="flex flex-1 items-center justify-center py-12">
          <div className="w-full max-w-[420px]">{children}</div>
        </div>

        {isShowcaseMode() ? (
          <p className="text-xs text-fg-subtle">
            This is a showcase. Any email and password works, and your account lives only in this browser.
          </p>
        ) : (
          <p className="text-xs text-fg-subtle">Only you can open your designs and reports.</p>
        )}
      </main>

      <aside className="hidden lg:block">
        <AuthShowcase />
      </aside>
    </div>
  );
}
