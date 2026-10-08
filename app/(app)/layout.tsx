import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { requireCurrentUser } from "@/features/auth/get-current-user";
import { THEME_COOKIE, parseTheme } from "@/features/settings/theme";
import { listRecentSessions } from "@/features/sessions/queries";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireCurrentUser();
  // New accounts tell us their name first (onboarding).
  if (!user.fullName) redirect("/welcome");
  const recentSessions = await listRecentSessions(user.id);
  const cookieStore = await cookies();
  const initialTheme = parseTheme(cookieStore.get(THEME_COOKIE)?.value);

  return (
    <AppShell user={user} recentSessions={recentSessions} initialTheme={initialTheme}>
      {children}
    </AppShell>
  );
}
