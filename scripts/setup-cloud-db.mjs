// One-time setup of a hosted Postgres database (for example a new Supabase project) for Vantage.
//
//   npm run db:setup:cloud
//
// You paste the two connection lines Supabase shows, and type the database password. This script then:
//   1. puts the password into both addresses (and escapes special characters),
//   2. adds the settings the app needs (a separate "vantage" schema, and pgbouncer for the pooled one),
//   3. creates the tables, and checks that they are there,
//   4. prints the two finished addresses to paste into Vercel.
// Nothing is saved to disk. The addresses only live in this terminal window.
import { spawnSync } from "node:child_process";
import { createInterface } from "node:readline";

const SCHEMA = "vantage";

const say = (text = "") => process.stdout.write(text + "\n");
const heading = (text) => say(`\n\x1b[1m${text}\x1b[0m`);

const isTerminal = Boolean(process.stdin.isTTY);
let pipedLines;

/** Reads typed or pasted text in a terminal. Shows it as you type, or hides it for a password. */
function readInTerminal({ hidden }) {
  return new Promise((resolve) => {
    let value = "";
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding("utf8");
    const onData = (chunk) => {
      // Some terminals wrap pasted text in escape codes. Ignore them, and arrow keys.
      const text = chunk.replace(/\u001b\[[0-9;]*[~A-Za-z]/g, "");
      for (const char of text) {
        if (char === "\r" || char === "\n") {
          process.stdin.setRawMode(false);
          process.stdin.pause();
          process.stdin.removeListener("data", onData);
          process.stdout.write("\n");
          resolve(value.trim());
          return;
        }
        if (char === "\u0003") process.exit(1); // Ctrl+C
        if (char === "\u007f" || char === "\b") {
          if (value.length > 0 && !hidden) process.stdout.write("\b \b");
          value = value.slice(0, -1);
        } else {
          value += char;
          if (!hidden) process.stdout.write(char);
        }
      }
    };
    process.stdin.on("data", onData);
  });
}

/** Asks a question. In a terminal the answer can be hidden (for the password). Piped input is read line by line. */
async function ask(question, { hidden = false } = {}) {
  process.stdout.write(question);
  if (isTerminal) return readInTerminal({ hidden });
  pipedLines ??= createInterface({ input: process.stdin })[Symbol.asyncIterator]();
  const next = await pipedLines.next();
  process.stdout.write("\n");
  return (next.value ?? "").trim();
}

/** Finds the address in whatever was pasted: `DATABASE_URL="postgresql://..."`, or just the address. */
function extractAddress(pasted) {
  const match = pasted.match(/postgres(?:ql)?:\/\/[^\s"']+/i);
  return match ? match[0] : null;
}

function fail(message) {
  say(`\n\x1b[31m${message}\x1b[0m`);
  process.exit(1);
}

function safeDecode(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

say("Vantage database setup");
say("This creates the tables the app needs in your Supabase database. It takes about a minute.");

heading("Step 1 of 3: paste the two lines from Supabase");
say("In Supabase: click Connect, then the ORM tab. You will see two lines, DATABASE_URL and DIRECT_URL.");
say("Paste each one here and press Enter. Pasting the whole line, with DATABASE_URL= at the start, is fine.\n");

const pooledPasted = await ask("Paste the DATABASE_URL line (it uses port 6543): ");
const directPasted = await ask("Paste the DIRECT_URL line (it uses port 5432): ");
let pooled = extractAddress(pooledPasted);
let direct = extractAddress(directPasted);
if (!pooled || !direct) fail("I could not find a postgresql:// address in what you pasted. Copy the line again from Supabase and try once more.");

heading("Step 2 of 3: the database password");
const placeholder = /\[?YOUR-PASSWORD\]?/;
if (placeholder.test(pooled) || placeholder.test(direct)) {
  say("This is the password you set (or generated) when you created the Supabase project.");
  say("It is not your Supabase account login. If you lost it: Project Settings, then Database, then Reset database password.\n");
  const password = await ask("Type the database password (nothing will show as you type): ", { hidden: true });
  if (!password) fail("No password entered.");
  const encoded = encodeURIComponent(password);
  pooled = pooled.replace(placeholder, () => encoded);
  direct = direct.replace(placeholder, () => encoded);
} else {
  say("Your pasted addresses already include a password, so I will use that.");
}

function prepare(address, { pooler }) {
  let url;
  try {
    url = new URL(address);
  } catch {
    fail("One of the addresses does not look right. If your password has symbols, try a password with only letters and numbers.");
  }
  url.searchParams.set("schema", SCHEMA);
  if (pooler) url.searchParams.set("pgbouncer", "true");
  else url.searchParams.delete("pgbouncer");
  return url;
}

const pooledUrl = prepare(pooled, { pooler: true });
const directUrl = prepare(direct, { pooler: false });

const warnings = [];
if (pooledUrl.port && pooledUrl.port !== "6543") warnings.push(`The DATABASE_URL port is ${pooledUrl.port}, not 6543. Vercel works best with the "Transaction pooler" address (port 6543).`);
if (directUrl.port && directUrl.port !== "5432") warnings.push(`The DIRECT_URL port is ${directUrl.port}, not 5432. It should be the "Session pooler" address (port 5432).`);
if (/^db\..+\.supabase\.co$/.test(directUrl.hostname)) warnings.push("The DIRECT_URL looks like the direct connection (db.….supabase.co). On the free plan that is IPv6-only and often fails. Use the Session pooler address (…pooler.supabase.com, port 5432).");
for (const warning of warnings) say(`\x1b[33mNote: ${warning}\x1b[0m`);

heading("Step 3 of 3: creating the tables");
const env = { ...process.env, DATABASE_URL: pooledUrl.toString(), DIRECT_URL: directUrl.toString() };
const secrets = [pooledUrl.toString(), directUrl.toString(), pooledUrl.password, safeDecode(pooledUrl.password)].filter((secret) => secret && secret.length > 3);
const mask = (text) => secrets.reduce((result, secret) => result.split(secret).join("<hidden>"), text);

const migrate = spawnSync("npx prisma migrate deploy", { shell: true, env, encoding: "utf8" });
const migrateOutput = mask((migrate.stdout ?? "") + (migrate.stderr ?? ""));
if (migrate.status !== 0) {
  say("\n" + migrateOutput.split("\n").filter((line) => line.trim()).slice(-12).join("\n"));
  const hints = [];
  if (/P1000|authentication failed|password/i.test(migrateOutput)) hints.push("The password looks wrong. Check you typed the database password (not your account password).");
  if (/P1001|Can't reach|ENOTFOUND|ETIMEDOUT/i.test(migrateOutput)) hints.push("I could not reach the database. Check the addresses, and that the project has finished setting up (the dashboard stops saying it is being created).");
  if (/P3005|not empty/i.test(migrateOutput)) hints.push("The database already has tables in this schema. Send me this message and I will help.");
  fail("The tables could not be created.\n" + hints.map((hint) => "- " + hint).join("\n") + "\nIf you are stuck, send me the message above (it hides your password).");
}

// Check that the tables are really there, using the same address the app will use.
const { PrismaClient } = await import("@prisma/client");
const prisma = new PrismaClient({ datasourceUrl: pooledUrl.toString() });
let tableCount = 0;
try {
  const rows = await prisma.$queryRawUnsafe(`select count(*)::int as tables from information_schema.tables where table_schema = '${SCHEMA}'`);
  tableCount = rows[0]?.tables ?? 0;
} catch (error) {
  fail(`The tables were created, but the app's address could not read them: ${mask(String(error.message)).slice(0, 300)}`);
} finally {
  await prisma.$disconnect();
}
if (tableCount < 10) fail(`Only ${tableCount} tables were found in the "${SCHEMA}" schema, which is fewer than expected. Send me this message.`);

say(`\n\x1b[32mDone. ${tableCount} tables are ready in the "${SCHEMA}" schema.\x1b[0m`);

heading("Last step: put these two lines in Vercel");
say("In Vercel: your project, Settings, Environment Variables. Add each one (copy the part after the =).");
say("Keep them private. After you have copied them, clear this window (type: cls).\n");
say(`DATABASE_URL=${pooledUrl.toString()}`);
say(`DIRECT_URL=${directUrl.toString()}`);
say("\nAlso add: SHOWCASE_MODE=true, GEMINI_API_KEY=(your key), ALLOW_DEMO_AI=true");
