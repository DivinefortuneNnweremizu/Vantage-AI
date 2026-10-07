import type { Metadata } from "next";
import { cookies } from "next/headers";

import { ThemeSwitcher } from "@/components/settings/theme-switcher";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { requireCurrentUser } from "@/features/auth/get-current-user";
import { THEME_COOKIE, parseTheme } from "@/features/settings/theme";

export const metadata: Metadata = { title: "Settings and Privacy" };

export default async function SettingsPage() {
  const user = await requireCurrentUser();
  const cookieStore = await cookies();
  const theme = parseTheme(cookieStore.get(THEME_COOKIE)?.value);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="cv01 text-2xl font-semibold text-fg-strong">Settings and Privacy</h1>

      <div className="flex max-w-3xl flex-col gap-4">
        <Card>
          <CardHeader title="Account" />
          <CardBody className="flex flex-col gap-1 text-sm">
            <p className="cv01 font-semibold">{user.fullName ?? "Your account"}</p>
            <p className="text-fg-muted">{user.email}</p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Appearance" />
          <CardBody className="flex flex-col gap-3">
            <p className="text-sm text-fg-muted">Choose how Vantage looks. System follows your device setting.</p>
            <ThemeSwitcher initialTheme={theme} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Privacy" />
          <CardBody className="text-sm text-fg-muted">
            Your uploaded designs and reports are private to you. Only you can open them.
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
