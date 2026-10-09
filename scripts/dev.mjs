// One command for local development: `npm run dev` (or `pnpm dev`).
//
// 1. Starts the local database (Prisma's local Postgres), unless one is already running.
// 2. Applies any pending migrations.
// 3. Starts the Next.js dev server and opens it on http://localhost:3000.
//
// Ctrl+C stops both. Development only: this never runs in production.
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { existsSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import net from "node:net";
import { startPrismaDevServer } from "@prisma/dev";

if (process.env.NODE_ENV === "production") {
  process.stderr.write("scripts/dev.mjs is for local development only.\n");
  process.exit(1);
}

const require = createRequire(import.meta.url);
const DB_NAME = "vantage-ai";
const DB_PORT = 51214;

function isPortOpen(port) {
  return new Promise((resolve) => {
    const socket = net.connect({ port, host: "127.0.0.1" });
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("error", () => resolve(false));
    socket.setTimeout(1500, () => {
      socket.destroy();
      resolve(false);
    });
  });
}

function run(scriptPath, args) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [scriptPath, ...args], { stdio: "inherit", env: process.env });
    child.once("exit", (code) => resolve(code ?? 1));
  });
}

/** The port the app will use: -p or --port from the command line, then PORT, then 3000. */
function appPort() {
  const args = process.argv.slice(2);
  const flag = args.findIndex((arg) => arg === "-p" || arg === "--port");
  const raw = flag >= 0 ? args[flag + 1] : (process.env.PORT ?? "3000");
  const port = Number.parseInt(raw ?? "3000", 10);
  return Number.isFinite(port) ? port : 3000;
}

let database = null;
let app = null;
let stopping = false;

async function stop(exitCode = 0) {
  if (stopping) return;
  stopping = true;
  if (app && app.exitCode === null) app.kill();
  if (database) {
    process.stdout.write("\nStopping the local database...\n");
    try {
      await database.close();
    } catch {
      // It was already closing.
    }
  }
  process.exit(exitCode);
}

process.on("SIGINT", () => void stop(0));
process.on("SIGTERM", () => void stop(0));
process.on("SIGBREAK", () => void stop(0));

// 0. Make sure nothing else is using this app's port or build folder.
// Two dev servers sharing one build folder corrupt each other, so refuse to start a second one.
const port = appPort();
if (await isPortOpen(port)) {
  const lines = [
    "",
    `Port ${port} is already in use, most likely by another dev server for this project.`,
    "Stop it first (press Ctrl+C in the terminal where it is running), then run the command again.",
    "",
  ];
  process.stderr.write(lines.join("\n"));
  process.exit(1);
}

// A build folder left by a previous run, especially inside a OneDrive folder, can be corrupt
// ("EINVAL: readlink"). It is only a cache, so start from a clean one.
const distDir = process.env.NEXT_DIST_DIR || ".next";
if (existsSync(distDir)) {
  try {
    rmSync(distDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 });
  } catch {
    process.stderr.write(`Could not clear the old build folder (${distDir}). Close other programs using it and try again.\n`);
    process.exit(1);
  }
}

// 1. Database
if (await isPortOpen(DB_PORT)) {
  process.stdout.write("Using the local database that is already running.\n");
} else {
  process.stdout.write("Starting the local database...\n");
  try {
    database = await startPrismaDevServer({ name: DB_NAME, persistenceMode: "stateful" });
    process.stdout.write("Local database ready.\n");
  } catch (error) {
    if (error && error.code === "ELOCKED") {
      process.stderr.write(
        "\nThe local database is still shutting down from the last run.\n" +
          "Wait about 10 seconds and run the command again.\n",
      );
    } else {
      process.stderr.write(`\nCould not start the local database: ${error instanceof Error ? error.message : String(error)}\n`);
    }
    process.exit(1);
  }
}

// 2. Migrations
process.stdout.write("Checking the database tables...\n");
const migrateCode = await run(require.resolve("prisma/build/index.js"), ["migrate", "deploy"]);
if (migrateCode !== 0) {
  process.stderr.write("\nThe database tables could not be updated. See the message above.\n");
  await stop(1);
}

// 3. App
process.stdout.write("Starting the app...\n\n");
app = spawn(process.execPath, [require.resolve("next/dist/bin/next"), "dev", ...process.argv.slice(2)], {
  stdio: "inherit",
  // A new id each start makes earlier dev sessions invalid, so the app starts at Sign up or Log in.
  env: { ...process.env, DEV_BOOT_ID: randomUUID() },
});
app.once("exit", (code) => void stop(code ?? 0));
