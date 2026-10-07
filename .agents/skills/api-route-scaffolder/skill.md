---
title: API Route Scaffolder Skill
product: Vantage AI
version: 1.0.0
status: Active
owner: Engineering
applies_to:
  - API Routes
  - Server Actions
  - REST Endpoints
  - Authentication
  - AI Generation
  - Payments
related_files:
  - AGENTS.md
  - .agents/rules/architecture.md
  - .agents/rules/security.md
  - .agents/rules/code-style.md
---

# API Route Scaffolder Skill

This skill teaches AI agents how to create API routes throughout the **Vantage AI** codebase.

Every API endpoint should be:

- Secure
- Predictable
- Type-safe
- Well validated
- Easy to maintain
- Consistent with the architecture

API routes expose the application's capabilities—they are not the place for business logic.

---

# Core Philosophy

API routes should only orchestrate requests.

Their responsibilities are to:

1. Authenticate requests
2. Validate input
3. Call application services
4. Return standardized responses
5. Log important events

Business logic belongs in the Service Layer.

---

# Preferred Stack

All API routes should use:

- Next.js App Router
- Route Handlers (`app/api`)
- TypeScript
- Prisma
- Zod
- Supabase Authentication
- Server Components where appropriate

Avoid legacy `pages/api`.

---

# Directory Structure

Organize routes by domain.

```text
app/
└── api/
    ├── auth/
    │   └── session/
    │       └── route.ts
    │
    ├── sessions/
    │   ├── route.ts                      (list for Design Library, create New Session)
    │   └── [sessionId]/
    │       ├── route.ts                  (get, rename, soft delete)
    │       ├── analyses/
    │       │   └── route.ts              (start analysis, list iterations)
    │       └── assistant/
    │           └── route.ts              (streamed assistant replies)
    │
    ├── analyses/
    │   └── [analysisId]/
    │       ├── route.ts                  (get stored report)
    │       └── progress/
    │           └── route.ts              (stage progress stream)
    │
    ├── uploads/
    │   └── route.ts                      (signed upload URL + asset record)
    │
    ├── imports/
    │   ├── figma/
    │   │   └── route.ts
    │   └── url/
    │       └── route.ts
    │
    ├── billing/
    │   ├── checkout/
    │   │   └── route.ts
    │   ├── webhook/
    │   │   └── route.ts
    │   └── subscription/
    │       └── route.ts
    │
    └── health/
        └── route.ts
```

Each route should represent a single resource or action.

---

# Route Responsibilities

Each route should:

- Receive request
- Validate request
- Authenticate user
- Authorize action
- Call a service
- Return response

Avoid placing complex logic directly in `route.ts`.

---

# Service Layer

Every route should delegate work to a service.

Example:

```text
app/api/sessions/[sessionId]/analyses/route.ts

↓

services/analysis/run-design-analysis.ts

↓

Prisma

↓

AI Provider

↓

Response
```

The route should never contain the implementation itself.

---

# Authentication

Protected endpoints must verify the authenticated user before continuing.

Typical flow:

1. Read session
2. Verify identity
3. Verify permissions
4. Continue

Never trust client-supplied user IDs.

Always derive user identity from the authenticated session.

---

# Authorization

Authentication answers:

> Who is the user?

Authorization answers:

> Can they perform this action?

Every protected endpoint should perform both checks.

---

# Validation

All incoming data must be validated using **Zod**.

Example responsibilities include:

- Required fields
- String lengths
- Enums
- URLs
- Email addresses
- Numeric ranges
- File limits

Never trust request bodies.

---

# Supported HTTP Methods

Use REST conventions.

| Method | Purpose |
|---------|----------|
| GET | Retrieve data |
| POST | Create resources |
| PUT | Replace resources |
| PATCH | Update resources |
| DELETE | Remove resources |

Avoid custom verbs in endpoint names.

Good:

```
POST /api/projects
```

Avoid:

```
POST /api/createProject
```

---

# Response Format

Responses should be consistent.

Successful response:

```json
{
  "success": true,
  "data": {}
}
```

Error response:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Project name is required."
  }
}
```

Do not return inconsistent response structures.

---

# Status Codes

Use appropriate HTTP status codes.

| Status | Meaning |
|---------|----------|
| 200 | Success |
| 201 | Created |
| 204 | No Content |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 422 | Validation Error |
| 429 | Rate Limited |
| 500 | Internal Server Error |

Never return `200` for failed operations.

---

# AI Generation Routes

Vantage AI's AI endpoints should follow this flow:

```
User Request

↓

Validate Input

↓

Authenticate

↓

Check Subscription

↓

Call AI Service

↓

Validate AI Output

↓

Store Result

↓

Return Response
```

Analysis reports should never bypass schema validation. See `.agents/rules/analysis-output.md` and `.agents/skills/design-analysis-pipeline/skill.md`.

---

# File Upload Routes

Upload endpoints should:

- Validate file type by magic bytes, not the reported MIME type
- Validate file size
- Scan metadata
- Reject unsupported formats
- Store securely
- Return a reference, not raw binary

Supported MVP formats:

- PNG
- JPG
- JPEG
- WebP
- PDF

Reject executable files.

---

# Billing Routes

Billing endpoints must:

- Delegate payment logic to the Billing Service
- Never expose secret keys
- Verify transactions server-side
- Log payment events

Flutterwave is the only supported payment provider during MVP.

---

# Database Access

Routes should never interact with the database directly unless performing simple lookups.

Complex operations belong in services.

Use Prisma transactions for multi-step operations.

---

# Error Handling

Errors should be:

- Predictable
- Logged
- Human-readable
- Secure

Do not expose:

- Stack traces
- Database errors
- API secrets
- Internal implementation details

---

# Logging

Log:

- Authentication failures
- Validation failures
- AI generation requests
- Billing events
- Upload events
- Unexpected exceptions

Avoid logging sensitive information.

---

# Rate Limiting

Protect endpoints that are vulnerable to abuse.

Examples:

- AI generation
- Login
- Uploads
- Billing
- Assistant messages
- Figma and URL imports

Return:

```
429 Too Many Requests
```

when limits are exceeded.

---

# Idempotency

Routes handling payments or retries must be idempotent.

Examples:

- Flutterwave webhooks
- Subscription upgrades
- Analysis start (repeat submits must not create duplicate runs)

Repeated requests should not create duplicate records.

---

# Naming Conventions

Endpoints should use:

```
/api/projects

/api/sessions/[sessionId]/analyses

/api/billing/subscription
```

Avoid:

```
/api/getProjects

/api/newDesign

/api/paymentStuff
```

---

# Performance

Prefer:

- Pagination
- Cursor-based queries
- Streaming where appropriate
- Parallel requests when safe

Avoid:

- Returning excessive payloads
- Blocking operations
- N+1 queries

---

# Security Checklist

Every route should:

- Validate input
- Authenticate user
- Authorize action
- Sanitize data
- Protect secrets
- Prevent injection attacks
- Use HTTPS
- Apply rate limiting where needed

---

# Testing Checklist

Before merging a route:

- [ ] Input validation implemented
- [ ] Authentication verified
- [ ] Authorization verified
- [ ] Calls service layer
- [ ] Returns consistent response
- [ ] Handles expected errors
- [ ] Handles unexpected errors
- [ ] Logs important events
- [ ] Uses correct HTTP status codes
- [ ] Fully typed
- [ ] Passes linting
- [ ] Passes unit and integration tests

---

# Anti-Patterns

Never:

- Put business logic inside `route.ts`
- Trust client input
- Skip authentication
- Skip validation
- Return inconsistent JSON
- Expose stack traces
- Hardcode secrets
- Duplicate service logic
- Bypass authorization
- Ignore rate limiting

---

# Definition of Done

An API route is complete when it:

- Accepts only valid input.
- Authenticates and authorizes requests correctly.
- Delegates business logic to the appropriate service.
- Returns consistent, typed responses.
- Handles failures gracefully.
- Protects sensitive data.
- Follows Vantage AI's architecture and security standards.
- Is documented, tested, and ready for production.

Every API route should be small, focused, and predictable. It should act as a secure gateway between the client and Vantage AI's application services—not as the place where business logic lives.