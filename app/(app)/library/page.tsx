import type { Metadata } from "next";
import Link from "next/link";

import { AssetImage } from "@/components/ui/asset-image";
import { Avatar } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import { requireCurrentUser } from "@/features/auth/get-current-user";
import { listLibrarySessions } from "@/features/sessions/queries";
import { formatRelative } from "@/lib/format-relative";

export const metadata: Metadata = { title: "Design Library" };

export default async function LibraryPage() {
  const user = await requireCurrentUser();
  const { items } = await listLibrarySessions(user.id);
  const displayName = user.fullName ?? user.email;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="cv01 text-2xl font-semibold text-fg-strong">Design Library</h1>

      {items.length === 0 ? (
        <div className="flex flex-col items-start gap-4 rounded-xl border border-line bg-surface p-6">
          <p className="text-base text-fg-muted">
            Your analyzed designs will live here. Start a new session to add one.
          </p>
          <Link href="/" className={buttonVariants({ variant: "primary" })}>
            Start a new session
          </Link>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((session) => (
            <li key={session.id}>
              <Link
                href={`/sessions/${session.id}`}
                className="group flex flex-col gap-3 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
              >
                <div className="relative aspect-[16/10] overflow-hidden rounded-xl border border-line bg-subtle">
                  {session.coverAssetId ? (
                    <AssetImage assetId={session.coverAssetId} size="thumb" alt="" className="size-full object-cover object-top" />
                  ) : null}
                  {/* The score and version on the card, so designs with the same name are easy to tell apart. */}
                  <div className="absolute right-3 bottom-3 flex items-center gap-1.5">
                    {session.version > 1 ? <span className="rounded-badge bg-night-950/85 px-2 py-1 text-xs font-semibold text-white">v{session.version}</span> : null}
                    {session.score !== null ? (
                      <span className="rounded-badge bg-night-950/85 px-2 py-1 text-xs font-semibold text-white">
                        <span className="sr-only">Score </span>
                        {session.score}
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Avatar name={displayName} imageUrl={user.avatarUrl} className="mt-0.5 size-8" />
                  <div className="flex min-w-0 flex-col">
                    <span className="line-clamp-2 text-base font-medium text-fg group-hover:text-accent">{session.title}</span>
                    <span className="text-sm text-fg-subtle">{formatRelative(session.updatedAt)}</span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
