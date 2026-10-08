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
| Demo AI (fixture reports, clearly labeled) | Built. **Real AI is not connected yet** |
| Sign-in with Supabase | Built, **not yet tested against a real Supabase project** |
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

`DEV_AUTH=true` signs you in as a demo user. It is ignored when `NODE_ENV=production`, and a test enforces that.

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

## Design tokens

Edit `tokens/color-tokens.json`, then run `npm run tokens`. Never edit `tokens/design-tokens.css` by hand. Use the theme-aware class names listed in `design.md` so components work in both themes.

## Connecting the real services later

- **Supabase:** fill the three Supabase variables in `.env.local`, set `STORAGE_DRIVER=supabase`, create a private `designs` bucket, and remove `DEV_AUTH`.
- **AI:** implement `analyze` and `chat` in `services/ai/providers/deepseek.ts`. Nothing else needs to change.
