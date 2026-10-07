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

You need Node 20 or later and pnpm. No Docker and no Supabase account are needed for local development.

1. Install: `pnpm install`
2. Start the local database and leave it running: `pnpm db:dev`
   It prints `DATABASE_URL`, `DIRECT_URL`, and `SHADOW_DATABASE_URL`. Put them in `.env` and `.env.local` (copy `.env.example`), and add `&pgbouncer=true` to the first two. The local database serves one session, so without that setting a second client breaks the running app.
3. Create the tables: `pnpm db:deploy`
4. In `.env.local` set `DEV_AUTH=true`, `STORAGE_DRIVER=local`, and `AI_PROVIDER=mock`.
5. Start the app: `pnpm dev`, then open http://localhost:3000

`DEV_AUTH=true` signs you in as a demo user. It is ignored when `NODE_ENV=production`, and a test enforces that.

Reports made with `AI_PROVIDER=mock` are invented sample content. They carry a visible "Demo report" notice. The mock provider is refused in production.

### Local database tips

- The local database keeps its data under `%LOCALAPPDATA%\prisma-dev-nodejs`, outside this folder.
- If it says a lock file is already held after a restart, wait about ten seconds and try again.
- Do not run `pnpm db:migrate` or other database tools while the app is running unless the connection string has `pgbouncer=true`.

### Keep this folder out of OneDrive

OneDrive syncs `node_modules` and `.next`, which is slow and can corrupt the Next.js build cache (`EINVAL ... readlink`). If that happens, delete `.next` and restart. Moving the project outside OneDrive avoids it.

## Scripts

| Command | What it does |
|---------|---------|
| `pnpm dev` | Start the dev server |
| `pnpm build` | Generate the Prisma client and build |
| `pnpm lint` | ESLint, including the design-system color rules |
| `pnpm typecheck` | TypeScript, no emit |
| `pnpm test` | Unit tests: scoring, validation, tokens and contrast, uploads, production guards |
| `pnpm test:e2e` | Browser tests in both themes, including automated accessibility checks. Needs the database and `pnpm dev` running. Set `E2E_BASE_URL` if the app is not on port 3000 |
| `pnpm tokens` | Rebuild `tokens/design-tokens.css` from `tokens/color-tokens.json` |
| `pnpm db:dev` | Start the local development database |
| `pnpm db:deploy` | Apply migrations |

## Design tokens

Edit `tokens/color-tokens.json`, then run `pnpm tokens`. Never edit `tokens/design-tokens.css` by hand. Use the theme-aware class names listed in `design.md` so components work in both themes.

## Connecting the real services later

- **Supabase:** fill the three Supabase variables in `.env.local`, set `STORAGE_DRIVER=supabase`, create a private `designs` bucket, and remove `DEV_AUTH`.
- **AI:** implement `analyze` and `chat` in `services/ai/providers/deepseek.ts`. Nothing else needs to change.
