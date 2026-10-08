"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Palette, Radar, Sparkles, X } from "lucide-react";

import type { CurrentUser } from "@/features/auth/get-current-user";
import type { SessionListItem } from "@/features/sessions/queries";
import { ProfileMenu } from "@/components/layout/profile-menu";
import { IconButton } from "@/components/ui/icon-button";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/cn";

interface SidebarProps {
  user: CurrentUser;
  recentSessions: SessionListItem[];
  onNavigate: () => void;
  onClose: () => void;
}

const navBase =
  "flex w-full items-center gap-3 rounded-sm border px-4 py-3 text-sm transition-colors " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";
const navActive = "border-selected bg-selected font-medium text-on-selected";
const navIdle = "border-transparent text-fg hover:bg-hover";

interface NavLinkProps {
  href: string;
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onNavigate: () => void;
}

function NavLink({ href, label, icon, isActive, onNavigate }: NavLinkProps) {
  return (
    <li>
      <Link
        href={href}
        onClick={onNavigate}
        aria-current={isActive ? "page" : undefined}
        className={cn(navBase, isActive ? navActive : navIdle)}
      >
        {icon}
        {label}
      </Link>
    </li>
  );
}

export function Sidebar({ user, recentSessions, onNavigate, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col justify-between gap-6 overflow-y-auto pt-6 pb-6">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between px-6 py-2">
          <Link href="/" onClick={onNavigate} className="flex items-center gap-2.5 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
            <span className="flex size-10 items-center justify-center rounded-badge bg-action text-on-action">
              <Sparkles className="size-5" aria-hidden="true" />
            </span>
            <span className="cv01 text-2xl font-semibold text-fg-strong">Vantage</span>
          </Link>
          <IconButton tone="inline" aria-label="Close menu" onClick={onClose} className="lg:hidden">
            <X className="size-5" aria-hidden="true" />
          </IconButton>
        </div>

        <nav aria-label="Primary" className="px-2">
          <ul className="flex flex-col gap-1">
            <NavLink
              href="/"
              label="New Session"
              icon={<Radar className="size-5 shrink-0" aria-hidden="true" />}
              isActive={pathname === "/"}
              onNavigate={onNavigate}
            />
            <NavLink
              href="/library"
              label="Design Library"
              icon={<Palette className="size-5 shrink-0" aria-hidden="true" />}
              isActive={pathname.startsWith("/library")}
              onNavigate={onNavigate}
            />
          </ul>
        </nav>

        <div className="mx-6 h-px bg-divider" />

        <nav aria-label="Previous sessions" className="px-2">
          <h2 className="px-4 pb-2 text-xs font-medium tracking-wide text-fg-subtle uppercase">Previous Sessions</h2>
          {recentSessions.length === 0 ? (
            <p className="px-4 text-sm text-fg-muted">Your analyzed designs will appear here.</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {recentSessions.map((session) => {
                const href = `/sessions/${session.id}`;
                const isActive = pathname.startsWith(href);
                return (
                  <li key={session.id}>
                    <Link
                      href={href}
                      onClick={onNavigate}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "block truncate rounded-sm border px-4 py-2 text-sm transition-colors " +
                          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                        isActive ? navActive : navIdle,
                      )}
                    >
                      {session.title}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </nav>
      </div>

      <div className="flex flex-col gap-2.5">
        <div className="px-4">
          <Link href="/settings/billing" onClick={onNavigate} className={cn(buttonVariants({ variant: "secondary" }), "w-full justify-start")}>
            <Sparkles className="size-4" aria-hidden="true" />
            Upgrade to VantagePro
          </Link>
        </div>

        <ProfileMenu user={user} onNavigate={onNavigate} />
      </div>
    </div>
  );
}
