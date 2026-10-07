import { AppShell } from "@/components/layout/app-shell";
import { requireCurrentUser } from "@/features/auth/get-current-user";
import { listRecentSessions } from "@/features/sessions/queries";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireCurrentUser();
  const recentSessions = await listRecentSessions(user.id);

  return (
    <AppShell user={user} recentSessions={recentSessions}>
      {children}
    </AppShell>
  );
}
