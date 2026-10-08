import { Sparkles } from "lucide-react";

/** Sign-in, sign-up, and onboarding. One quiet centered card on the page background, like ChatGPT's dialog. */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 bg-canvas px-4 py-12">
      <div className="flex items-center gap-2.5">
        <span className="flex size-10 items-center justify-center rounded-badge bg-action text-on-action">
          <Sparkles className="size-5" aria-hidden="true" />
        </span>
        <span className="cv01 text-2xl font-semibold text-fg-strong">Vantage</span>
      </div>
      <div className="w-full max-w-[440px] rounded-3xl border border-line bg-surface px-6 py-8 shadow-md sm:px-8">{children}</div>
    </main>
  );
}
