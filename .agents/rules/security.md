---
title: Security Rules
product: Vantage AI
version: 1.0.0
status: Active
owner: Engineering
last_updated: 2026-10
applies_to: Entire Repository
trigger: always_on
related_files:
  - AGENTS.md
  - .agents/rules/architecture.md
  - .agents/rules/code-style.md
  - .agents/rules/design-system.md
  - .agents/rules/analysis-output.md
  - design.md
---

# Security Rules

This document defines the security standards for **Vantage AI**.

Security is not a feature that is added at the end of development—it is a requirement for every feature, service, API route, AI interaction, and user workflow.

Every AI agent and developer working on Vantage AI **must** follow these rules.

---

# Security Philosophy

Vantage AI handles sensitive user information including:

- User accounts
- Uploaded design files, often unreleased or under client NDA
- Figma links and access tokens
- Design goals and prompts
- AI-generated analysis reports and assistant conversations
- Subscription information
- Payment transactions

Our responsibility is to protect user data at every layer.

Every architectural and implementation decision should follow the principle:

> **Assume every request is malicious until it has been validated and authorized.**

---

# Core Security Principles

## 1. Never Trust the Client

Everything coming from the browser must be considered untrusted.

Always validate:

- Form data
- Uploaded files
- Request bodies
- URL parameters
- Query parameters
- AI-generated content
- Payment callbacks

Client-side validation exists only to improve user experience.

Server-side validation is mandatory.

---

## 2. Least Privilege

Every user, service, API key, and database operation should have only the permissions required to perform its task.

Never grant broader access "just in case."

---

## 3. Secure by Default

When faced with multiple implementation choices:

Choose the most secure option unless there is a compelling reason not to.

---

## Authentication

Vantage AI uses **Supabase Auth**.

Authentication responsibilities include:

- Email/password login
- OAuth providers
- Session management
- Password recovery
- Email verification
- Token refresh

Authentication must never be implemented manually.

---

# Authorization

Authentication determines **who** the user is.

Authorization determines **what** the user can access.

Every protected resource must verify:

- User identity
- Resource ownership
- Subscription status (where applicable)

Never rely on hidden UI elements to enforce permissions.

Authorization belongs on the server.

---

# Row Level Security (RLS)

Supabase Row Level Security must remain enabled.

Every table containing user data should have explicit policies.

Users may only access data they own unless collaboration features explicitly permit shared access.

Never disable RLS to simplify development.

---

# Session Management

Use secure, HTTP-only cookies where supported.

Never:

- Store JWTs in localStorage.
- Expose refresh tokens to client-side code.
- Manually modify authentication tokens.

Always allow Supabase Auth to manage session lifecycle.

---

# Environment Variables

Sensitive values must never appear in source code.

Examples include:

- AI provider API keys
- Figma OAuth client secrets and user tokens
- Supabase service role keys
- Database URLs
- Flutterwave secret keys
- Webhook secrets
- Encryption keys

Use environment variables for all secrets.

Never commit `.env` files.

Provide a `.env.example` file containing placeholder values only.

---

# Secrets Management

Never:

- Log secrets
- Hardcode secrets
- Send secrets to the browser
- Embed secrets in analysis reports
- Include secrets in AI prompts

Secrets belong exclusively on the server.

---

# Input Validation

Every request must be validated using **Zod** before processing.

Validate:

- Request bodies
- URL parameters
- Query parameters
- Uploaded metadata
- AI request payloads

Reject malformed requests immediately.

---

# File Upload Security

Users may upload:

- Design images (PNG, JPG, WebP)
- PDFs
- Figma links and URLs

Every upload must be validated.

Validate:

- MIME type
- File extension
- File size
- Image integrity

Reject executable or unsupported file types.

Never trust the browser's reported file type.

---

# URL & Figma Import Security

Users can paste URLs and Figma links.

- Accept only `https` URLs.
- Resolve and block private, loopback, and link-local IP ranges before fetching (SSRF protection).
- Fetch remote pages and images from the server with strict timeouts and size limits.
- Store Figma access tokens encrypted and scoped to read-only file access.
- Never fetch a URL from the browser on the user's behalf with server credentials.

---

# Storage Security

All uploaded assets must be stored in **Supabase Storage**.

Never:

- Store files inside the repository.
- Save uploaded files on the application server.
- Expose storage buckets publicly unless required.

Private user assets should remain private by default.

---

# AI Security

AI prompts must never contain:

- API keys
- User passwords
- Session tokens
- Payment credentials
- Internal configuration
- Secret business logic

Only send the minimum context required to generate the requested output.

---

# Prompt Injection Protection

Treat all user input as potentially malicious.

Never allow uploaded content to:

- Override system prompts
- Change AI instructions
- Access hidden prompts
- Reveal internal implementation details

The system prompt always takes precedence.

---

# Output Validation

AI responses should be validated before being stored or rendered.

Check for:

- Unexpected HTML
- Embedded scripts
- Malicious Markdown or rich text
- Invalid JSON
- Unsafe URLs

Never render AI output directly without sanitization.

---

# Rendered Text Security

AI findings, recommendations, and assistant replies are rendered as sanitized Markdown.

Generated text must be sanitized before rendering.

Prevent:

- XSS
- Script injection
- Embedded HTML exploits

Markdown rendering should support only approved syntax.

---

# API Security

Every API route should:

- Authenticate the user
- Authorize access
- Validate input
- Log important events
- Return standardized responses

Do not expose internal implementation details.

---

# Rate Limiting

Protect sensitive endpoints with rate limiting.

Examples:

- Authentication
- AI generation
- File uploads
- Payment verification
- Assistant messages
- Figma imports

Return appropriate HTTP status codes when limits are exceeded.

---

# Payment Security

Vantage AI uses **Flutterwave** exclusively for payment processing during the MVP.

Never replace or bypass Flutterwave without explicit approval.

## Payment Rules

- Never trust payment status from the client.
- Every transaction must be verified server-side.
- Duplicate transaction references must be rejected.
- Webhook signatures must always be verified.
- Payment verification occurs before granting VantagePro access.
- Store transaction history for auditing.
- Never expose secret keys to the browser.

---

# Webhook Security

Every Flutterwave webhook must:

1. Verify signature.
2. Validate payload.
3. Confirm transaction with Flutterwave.
4. Check transaction uniqueness.
5. Update subscription status.
6. Log the event.

Ignore requests failing verification.

---

# Database Security

Database access should occur only through Prisma.

Avoid raw SQL.

If raw SQL is necessary:

- Parameterize queries.
- Never concatenate user input.
- Document the reason.

---

# SQL Injection Prevention

Never build SQL queries using string concatenation.

Always use:

- Prisma
- Parameterized queries

Validate all input before database operations.

---

# Cross-Site Scripting (XSS)

Prevent XSS by:

- Escaping user content
- Sanitizing Markdown
- Sanitizing HTML
- Avoiding `dangerouslySetInnerHTML`

Only use `dangerouslySetInnerHTML` after strict sanitization and with explicit approval.

---

# Cross-Site Request Forgery (CSRF)

Protect state-changing requests.

Use secure session handling and built-in framework protections.

Verify request origin where appropriate.

---

# Cross-Origin Resource Sharing (CORS)

Only allow trusted origins.

Do not use:

```
Access-Control-Allow-Origin: *
```

for authenticated endpoints.

---

# Content Security Policy (CSP)

Deploy a restrictive Content Security Policy.

Disallow:

- Inline scripts
- Unsafe eval
- Unknown script sources

Whitelist only required domains.

---

# HTTPS

All production traffic must use HTTPS.

Never transmit authentication or payment information over insecure connections.

---

# Logging & Auditing

Log:

- Authentication events
- Payment events
- Subscription changes
- AI generation requests
- Analysis runs
- Figma imports
- Security violations
- Administrative actions

Never log:

- Passwords
- Tokens
- Secrets
- Credit card data
- Personal authentication credentials

---

# Error Handling

Error messages shown to users should:

- Be clear
- Be actionable
- Avoid exposing implementation details

Do not reveal:

- Stack traces
- SQL errors
- Provider responses
- Internal file paths
- Secret configuration

Detailed diagnostics belong in server logs only.

---

# Dependency Management

Keep dependencies up to date.

Before introducing a new dependency:

- Verify maintenance status.
- Review security history.
- Prefer well-established libraries.
- Remove unused packages.

Do not install packages without a clear purpose.

---

# Third-Party Integrations

All external services should:

- Use HTTPS
- Authenticate securely
- Store credentials in environment variables
- Fail gracefully

Do not tightly couple business logic to external APIs.

---

# Privacy

Vantage AI is private by default.

Users own their:

- Projects
- Uploads
- Analysis reports

Do not expose private data to other users.

Collect only the information required to operate the product.

---

# Backups & Recovery

Critical application data should support:

- Regular backups
- Recovery procedures
- Disaster recovery planning

Database migrations should always be reversible where possible.

---

# Security Review Checklist

Before shipping a feature:

- [ ] Authentication enforced.
- [ ] Authorization verified.
- [ ] RLS policies reviewed.
- [ ] Inputs validated.
- [ ] Outputs sanitized.
- [ ] Secrets stored securely.
- [ ] No sensitive data exposed.
- [ ] File uploads validated.
- [ ] Payment verification implemented.
- [ ] Webhooks verified.
- [ ] Error messages sanitized.
- [ ] Logging implemented.
- [ ] Accessibility preserved.
- [ ] Dependencies reviewed.
- [ ] Matches Architecture Rules.

---

# Security Anti-Patterns

Do **not**:

- Trust client input.
- Store secrets in source code.
- Disable Row Level Security.
- Use `dangerouslySetInnerHTML` without sanitization.
- Expose stack traces.
- Skip payment verification.
- Store uploaded files locally.
- Use localStorage for authentication tokens.
- Trust AI-generated content without validation.
- Expose internal API responses.
- Ignore failed webhook verification.
- Circumvent authorization checks for convenience.

---

# Definition of Secure Code

Secure code in Vantage AI is:

- Authenticated
- Authorized
- Validated
- Sanitized
- Encrypted where necessary
- Logged appropriately
- Auditable
- Resilient
- Privacy-conscious

Every feature should uphold Vantage AI's promise:

> **Protect user ideas, data, and payments with security that is proactive, layered, and built into every part of the system—not added as an afterthought.**