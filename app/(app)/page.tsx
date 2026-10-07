import type { Metadata } from "next";

import { Composer } from "@/components/session/composer";
import { requireCurrentUser } from "@/features/auth/get-current-user";

export const metadata: Metadata = { title: "New Session" };

export default async function NewSessionPage() {
  const user = await requireCurrentUser();
  const firstName = (user.fullName ?? user.email).split(/[\s@]/)[0] ?? "there";

  return <Composer firstName={firstName} />;
}
