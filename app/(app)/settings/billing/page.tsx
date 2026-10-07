import type { Metadata } from "next";

import { Card, CardBody, CardHeader } from "@/components/ui/card";

export const metadata: Metadata = { title: "Billing" };

export default function BillingPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="cv01 text-2xl font-semibold text-fg-strong">Billing</h1>
      <Card className="max-w-3xl">
        <CardHeader title="VantagePro" />
        <CardBody className="text-sm text-fg-muted">
          Plans and checkout are coming soon. You are on the Free plan.
        </CardBody>
      </Card>
    </div>
  );
}
