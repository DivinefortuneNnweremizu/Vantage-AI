"use client";

import { Button } from "@/components/ui/button";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ reset }: ErrorPageProps) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="cv01 text-2xl font-semibold text-fg-strong">Something went wrong</h1>
      <p className="max-w-md text-base text-fg-muted">
        We hit a problem loading this page. Your work is safe. Try again.
      </p>
      <Button onClick={reset}>Try again</Button>
    </main>
  );
}
