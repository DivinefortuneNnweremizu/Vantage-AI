import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="cv01 text-2xl font-semibold text-fg-strong">We could not find that page</h1>
      <p className="max-w-md text-base text-fg-muted">
        It may have moved, or it may belong to another account. Head back and start a new session.
      </p>
      <Link href="/" className={buttonVariants({ variant: "primary" })}>
        Go to New Session
      </Link>
    </main>
  );
}
