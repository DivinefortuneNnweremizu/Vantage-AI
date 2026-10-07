import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Fixed id so the seed is repeatable. This user does not exist in Supabase Auth,
// so it is only for local data views. Sign up through the app to get a real user.
const DEMO_USER_ID = "00000000-0000-4000-8000-000000000001";

async function main(): Promise<void> {
  await prisma.user.upsert({
    where: { id: DEMO_USER_ID },
    create: { id: DEMO_USER_ID, email: "demo@vantage.local", fullName: "Demo Designer" },
    update: {},
  });

  await prisma.subscription.upsert({
    where: { userId: DEMO_USER_ID },
    create: { userId: DEMO_USER_ID },
    update: {},
  });

  const existing = await prisma.designSession.count({ where: { userId: DEMO_USER_ID } });
  if (existing === 0) {
    await prisma.designSession.createMany({
      data: [
        { userId: DEMO_USER_ID, title: "Product Designers Bio", pageScope: "SINGLE_PAGE", platform: "WEB" },
        { userId: DEMO_USER_ID, title: "Checkout Flow", pageScope: "JOURNEY", platform: "APP" },
      ],
    });
  }
}

main()
  .catch((error: unknown) => {
    process.stderr.write(`Seed failed: ${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
