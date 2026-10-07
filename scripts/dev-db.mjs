// Local development database. Dev only. Never used in production.
//
// Starts Prisma's local Postgres (PGlite, no Docker and no native installs) so the
// app runs without Supabase. Data persists under the name "vantage-ai".
// Stop it with Ctrl+C.
//
// Usage: pnpm db:dev
// Then put the printed URL in .env.local as DATABASE_URL and DIRECT_URL.
import { getPrismaDevServerConnection, startPrismaDevServer } from "@prisma/dev";

const NAME = "vantage-ai";

const server = await startPrismaDevServer({
  name: NAME,
  persistenceMode: "stateful",
});

const connection = await getPrismaDevServerConnection({ name: NAME });

process.stdout.write("Local database ready.\n");
process.stdout.write(`DATABASE_URL="${server.database.prismaORMConnectionString}"\n`);
process.stdout.write(`DIRECT_URL="${server.database.prismaORMConnectionString}"\n`);
if (connection) {
  // "prisma migrate dev" needs a separate shadow database.
  process.stdout.write(`SHADOW_DATABASE_URL="${connection.shadowDatabaseUrl}"\n`);
}

async function shutdown() {
  process.stdout.write("\nStopping local database...\n");
  await server.close();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

// Keep the process alive while the server runs.
setInterval(() => {}, 1 << 30);
