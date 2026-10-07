import { Sparkles } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-4 py-12">
      <div className="flex items-center gap-2.5">
        <span className="flex size-10 items-center justify-center rounded-badge bg-action text-on-action">
          <Sparkles className="size-5" aria-hidden="true" />
        </span>
        <span className="cv01 text-2xl font-semibold text-fg-strong">Vantage</span>
      </div>
      <div className="w-full max-w-[400px] rounded-xl border border-line bg-surface p-6 shadow-xs">{children}</div>
    </main>
  );
}
