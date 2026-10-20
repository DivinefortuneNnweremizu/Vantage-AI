# Vantage AI

Principle-based design critique on demand. Upload a design, state a goal, and get a report that explains what to fix, why it matters, and how.

Read these first:

- [AGENTS.md](AGENTS.md): product, stack, rules for agents
- [design.md](design.md): design system (light and dark)
- [docs/implementation-plan.md](docs/implementation-plan.md): build plan, status, and what is next

## What works today

| Area | Status |
|---------|---------|
| New Session, Upload Images, My Goal, progress, report with five tabs, Design Library | Built, light and dark |
| Single Page and Multiple Page Journey, App and Web | Built |
| Re-analyzing a new version and comparing with the last | Built |
| Assistant chat grounded in the report | Built |
| Scoring from design standards, with the principle library | Built |
| Demo AI (fixture reports, clearly labeled) | Built |
| Real AI analysis and assistant (Gemini or DeepSeek, image input) | Built. **Needs an API key, and has not been tried against a live service yet.** Tested end to end against a fake Gemini endpoint |
| Daily caps on real analyses, with a labeled demo report past the cap | Built |
| Email and password sign-up, log-in, and onboarding (Supabase) | Built, **not yet tested against a real Supabase project**. No Google or social sign-in for now |
| Website URL, Figma, and PDF input | Not built |
| Plans, checkout, and limits (Flutterwave) | Not built |
| Dark and light themes with a switch in Settings | Built |

## Run it locally

You need Node 20 or later. No Docker and no Supabase account are needed for local development.

```bash
npm install     # first time only (pnpm install also works)
npm run dev
```

Then open http://localhost:3000.

`npm run dev` does three things, so you never start them yourself:

1. Starts the local database, unless one is already running.
2. Applies any pending database migrations.
3. Starts the app.

Press Ctrl+C once to stop both the app and the database. Use `npm run dev -- -p 3001` for another port.

### One-time setup on a new machine

The app reads two git-ignored files, `.env` (for Prisma) and `.env.local` (for Next.js). Copy `.env.example` to `.env.local`, then:

1. Run `npm run db:dev` once. It prints `DATABASE_URL`, `DIRECT_URL`, and `SHADOW_DATABASE_URL`. Press Ctrl+C to stop it.
2. Put those three lines in both `.env` and `.env.local`, and add `&pgbouncer=true` to the first two. The local database serves one session, so without that setting a second client breaks the running app.
3. In `.env.local` set `DEV_AUTH=true`, `STORAGE_DRIVER=local`, and `AI_PROVIDER=mock`.

`DEV_AUTH=true` replaces Supabase with a fake sign-in. Every `npm run dev` starts signed out. A browser with no account yet lands on **Sign up**, then onboarding ("What should we call you?"). A browser that already finished onboarding or logged in lands on **Log in** (any email and password continues as the demo user). Log out works too. The e2e tests sign in once in `tests/e2e/global-setup.ts`. It is ignored when `NODE_ENV=production`, and a test enforces that.

Reports made with `AI_PROVIDER=mock` are invented sample content. They carry a visible "Demo report" notice. The mock provider is refused in production.

### If something goes wrong

- **"Port 3000 is already in use".** Another dev server for this project is running. Press Ctrl+C in the terminal where it runs, then try again. Two servers sharing one build folder corrupt each other.
- **"The local database is still shutting down".** Wait about ten seconds and run `npm run dev` again.
- **`EINVAL ... readlink` on `.next`.** The build cache is corrupt. `npm run dev` clears it on every start, so just run it again. It happens because this folder is inside OneDrive. Moving the project outside OneDrive avoids it for good.
- The local database keeps its data under `%LOCALAPPDATA%\prisma-dev-nodejs`, outside this folder.
- Do not run `npm run db:migrate` or other database tools while the app is running unless the connection string has `pgbouncer=true`.

## Scripts

| Command | What it does |
|---------|---------|
| `npm run dev` | Start the database, apply migrations, and start the app |
| `npm run dev:app` | Start only the app, when you already run the database yourself |
| `npm run build` | Generate the Prisma client and build |
| `npm run lint` | ESLint, including the design-system color rules |
| `npm run typecheck` | TypeScript, no emit |
| `npm test` | Unit tests: scoring, validation, tokens and contrast, uploads, production guards |
| `npm run test:e2e` | Browser tests in both themes, including automated accessibility checks. Needs `npm run dev` running. Set `E2E_BASE_URL` if the app is not on port 3000 |
| `npm run tokens` | Rebuild `tokens/design-tokens.css` from `tokens/color-tokens.json` |
| `npm run db:dev` | Start the local development database |
| `npm run db:deploy` | Apply migrations |

## Showing it without Supabase (showcase mode)

For a demo link you do not need Supabase. Set `SHOWCASE_MODE=true` and give the app a Postgres `DATABASE_URL` (a free one such as Neon works). Then:

- **Sign-in** is a fake one. Any email and password works, and each browser gets its own private temporary account, so visitors never see each other's designs. The sign-up and onboarding screens stay. The sign-in pages say this is a showcase.
- **Uploaded images** are kept in the database (the `StoredFile` table) instead of on disk, which Vercel does not have. This is the default storage in showcase mode, or set `STORAGE_DRIVER=database`.
- **Big images** are shrunk in the browser to under about 3.5 MB before upload, so they fit under Vercel's 4.5 MB request limit. The server still keeps 2400 pixels, as before.

Showcase mode is a deliberate opt-in and works in production on purpose. It is not real security: anyone can "sign up" with a made-up email. Do not use it for real people's data. Real accounts need Supabase (see below).

On Vercel, set `SHOWCASE_MODE=true`, `DATABASE_URL`, `DIRECT_URL`, `GEMINI_API_KEY`, `ALLOW_DEMO_AI=true`, and `NEXT_PUBLIC_APP_URL`. Create the tables once with `npx prisma migrate deploy`, with `DATABASE_URL` and `DIRECT_URL` pointing at that database.

## Testing a production build

Some problems only show in a production build, and Vercel runs one. To check one on your machine, with the database already running (`npm run db:dev` in another terminal):

```
NEXT_DIST_DIR=.next-build npx next build
NEXT_DIST_DIR=.next-build NODE_ENV=production SHOWCASE_MODE=true STORAGE_DRIVER=database AI_PROVIDER=mock ALLOW_DEMO_AI=true npx next start -p 3200
E2E_BASE_URL=http://localhost:3200 E2E_SHOWCASE=true npx playwright test
```

Then delete `.next-build`, and undo the edit `next build` makes to `tsconfig.json`. Do not add a `loading.tsx` under `app/(app)/sessions/`: in the production build it made report tab switches hang.

## Design tokens

Edit `tokens/color-tokens.json`, then run `npm run tokens`. Never edit `tokens/design-tokens.css` by hand. Use the theme-aware class names listed in `design.md` so components work in both themes.

## Connecting the real services later

- **Supabase:** fill the three Supabase variables in `.env.local`, set `STORAGE_DRIVER=supabase`, create a private `designs` bucket, and remove `DEV_AUTH`.
- **AI:** put `GEMINI_API_KEY=your-key` in `.env.local` (a free key from Google AI Studio works) and restart `npm run dev`. A Gemini key on its own selects Gemini, and a `DEEPSEEK_API_KEY` selects DeepSeek if there is no Gemini key. `AI_PROVIDER` (`gemini`, `deepseek`, or `mock`) overrides that. `GEMINI_MODEL` defaults to `gemini-3.6-flash`; `gemini-3.5-flash-lite` is lighter. Reports from a real provider are not labeled "Demo report", and the designs you upload are sent to that provider.
- **Regions:** Google's terms say the free Gemini tier cannot be used for apps serving people in the EEA, Switzerland or the UK. On Vercel, visitors from those countries get a labeled demo report (and the demo assistant) instead of real AI. This uses Vercel's `x-vercel-ip-country` header, so it is a best guess: a VPN can get around it, and it does nothing when running locally. If you pay for the provider, set `REAL_AI_BLOCKED_COUNTRIES=none`.
- **Free-tier caps:** real analyses are limited to `REAL_AI_PER_USER_PER_DAY` per person (default 3) and `REAL_AI_PER_DAY` across the site (default 50), counted over 24 hours. Past a cap, or when the provider says it is at its limit, the person gets a labeled demo report. In production that needs `ALLOW_DEMO_AI=true`; without it they see a "come back tomorrow" message.
