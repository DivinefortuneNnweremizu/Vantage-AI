---
title: Database Migration Runner Skill
product: Vantage AI
version: 1.0.0
status: Active
owner: Engineering
applies_to:
  - Database Schema
  - Prisma Migrations
  - PostgreSQL
  - Data Integrity
  - Schema Evolution
related_files:
  - AGENTS.md
  - .agents/rules/architecture.md
  - .agents/rules/security.md
  - .agents/rules/code-style.md
---

# Database Migration Runner Skill

This skill teaches AI agents how database schema changes are created, reviewed, tested, and deployed throughout the **Vantage AI** codebase.

Vantage AI uses:

- PostgreSQL
- Prisma ORM
- Prisma Migrate

Database migrations are **permanent changes** to the application's source of truth. Every migration should be treated as a production change.

---

# Core Philosophy

The database is one of the most critical parts of Vantage AI.

Every migration should be:

- Safe
- Reversible where practical
- Versioned
- Tested
- Small
- Explicit
- Backwards-compatible whenever possible

Never make schema changes casually.

---

# Database Stack

Vantage AI uses:

- PostgreSQL
- Prisma ORM
- Prisma Migrate
- TypeScript

The Prisma schema is the canonical definition of the database structure.

Never edit generated SQL files manually unless explicitly required.

---

# Database Architecture

```text
Application

↓

Service Layer

↓

Prisma ORM

↓

PostgreSQL
```

The application should never communicate directly with SQL unless there is a justified performance requirement.

---

# Schema Ownership

All schema changes begin in:

```text
prisma/schema.prisma
```

AI agents should:

1. Update the Prisma schema.
2. Generate a migration.
3. Review the generated SQL.
4. Test locally.
5. Commit both the schema and migration.

Never commit only one of them.

---

# Project Structure

```text
prisma/
├── schema.prisma
├── migrations/
│   ├── 20260725094500_initial_schema/
│   │   └── migration.sql
│   ├── 20260728113000_add_projects/
│   │   └── migration.sql
│   └── migration_lock.toml
│
└── seed.ts
```

Every migration should have a descriptive name.

---

# Migration Naming

Migration names should clearly describe the change.

Good:

```text
add_projects_table

create_subscriptions

add_version_history

add_project_status

add_flutterwave_payments
```

Avoid:

```text
update

fix

new

migration2

changes
```

---

# Migration Workflow

Every schema change should follow this process:

```text
Update schema.prisma

↓

Generate migration

↓

Review SQL

↓

Run locally

↓

Run tests

↓

Commit migration

↓

Deploy
```

Never skip review.

---

# Prisma Commands

Development:

```bash
npx prisma migrate dev --name add_projects
```

Generate Prisma Client:

```bash
npx prisma generate
```

Production:

```bash
npx prisma migrate deploy
```

Reset local database (development only):

```bash
npx prisma migrate reset
```

Never run destructive commands in production.

---

# Data Integrity

Protect existing data whenever possible.

Avoid:

- Dropping columns
- Renaming tables without migration strategy
- Changing data types destructively

Prefer:

- Adding new columns
- Backfilling data
- Deprecating old fields gradually

---

# Transactions

Use database transactions whenever multiple writes must succeed together.

Examples:

- Subscription activation
- Payment recording
- Project creation
- Version history updates

If one step fails, the transaction should roll back.

---

# Foreign Keys

Always define relationships explicitly.

Examples:

- User → Projects
- Session → Analyses (iterations)
- Analysis → Findings → Recommendations
- User → Subscription
- Subscription → Payments

Never leave orphaned records.

---

# Indexing

Create indexes for frequently queried fields.

Typical candidates:

- userId
- projectId
- createdAt
- updatedAt
- email
- slug
- paymentReference

Do not add indexes without a performance reason.

Too many indexes slow writes.

---

# Unique Constraints

Use unique constraints for identifiers that must never duplicate.

Examples:

- Email
- Payment reference
- Project slug (if public)
- API key

Never rely solely on application code to enforce uniqueness.

---

# Soft Deletes

Prefer soft deletes for user-owned resources.

Example:

```text
deletedAt
```

instead of permanently deleting records.

This preserves history and enables recovery.

---

# Auditing

Important events should be auditable.

Examples:

- Subscription changes
- Payment events
- AI generations
- Analysis runs and assistant usage

Audit logs should be append-only.

Never modify historical records.

---

# Seed Data

Seed files should create:

- Development users
- Sample projects
- Test subscriptions
- Example analysis reports built from synthetic sample designs

Seed data should never contain production secrets.

---

# Environment Separation

Maintain separate databases for:

- Development
- Testing
- Staging
- Production

Never point development tools at the production database.

---

# Rollback Strategy

Before deploying a migration:

- Understand how to recover if deployment fails.
- Ensure backups exist.
- Document any irreversible changes.

Prisma migrations are forward-only by default.

Plan carefully before applying destructive changes.

---

# Performance Considerations

When altering large tables:

- Avoid long-running locks.
- Batch data migrations where necessary.
- Prefer adding nullable columns before enforcing constraints.
- Consider background backfills for large datasets.

---

# Security

Never store:

- Passwords in plain text
- API secrets
- Tokens without encryption

Sensitive fields should be encrypted or securely hashed where appropriate.

Follow the Security Rules document.

---

# Vantage AI Core Tables

The database is expected to include tables similar to:

```text
users

sessions            (a design being critiqued; shown in Design Library)

assets              (uploaded images, PDF pages, Figma frames, URL captures)

analyses            (one immutable report per run; iteration number, scope, platform, goal, rubric version)

findings            (valence, severity, category, principleId, marker)

recommendations     (rank, change, rationale)

recommendationFindings (join table)

assistantMessages   (scoped to a session)

subscriptions

payments

paymentEvents
```

These may evolve over time but should remain normalized and well-related.

---

# AI Agent Checklist

Before committing a migration:

- [ ] Prisma schema updated
- [ ] Migration generated
- [ ] SQL reviewed
- [ ] Migration tested locally
- [ ] Prisma Client regenerated
- [ ] Relationships verified
- [ ] Indexes reviewed
- [ ] Constraints reviewed
- [ ] Existing data preserved
- [ ] No unnecessary destructive changes
- [ ] Migration committed with schema changes

---

# Anti-Patterns

Never:

- Modify production databases manually.
- Edit migration history after deployment.
- Commit schema changes without migrations.
- Create destructive migrations without review.
- Store secrets in database fields without encryption.
- Ignore foreign key relationships.
- Disable constraints to "make it work."
- Use raw SQL when Prisma provides an equivalent solution.
- Rename or drop tables without a migration strategy.

---

# Definition of Done

A database migration is complete when it:

- Reflects the intended schema change.
- Is generated from the Prisma schema.
- Has been reviewed and tested locally.
- Preserves existing data whenever possible.
- Maintains referential integrity.
- Includes appropriate indexes and constraints.
- Regenerates the Prisma Client.
- Passes application tests.
- Is ready for deployment without manual intervention.

Every migration should leave the database in a predictable, reliable, and production-ready state while supporting Vantage AI's long-term evolution.