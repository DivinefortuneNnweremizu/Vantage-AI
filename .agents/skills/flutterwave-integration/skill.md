---
title: Flutterwave Integration Skill
product: Vantage AI
version: 1.0.0
status: Active
owner: Engineering
applies_to:
  - Billing
  - Subscriptions
  - Payment Verification
  - Webhooks
related_files:
  - AGENTS.md
  - .agents/rules/architecture.md
  - .agents/rules/security.md
---

# Flutterwave Integration Skill

This skill teaches AI agents how payments are implemented in **Vantage AI**.

Vantage AI uses **Flutterwave** as its only payment provider during the MVP.

Do **not** introduce Paystack, Stripe, Lemon Squeezy, Paddle, or any other payment provider unless explicitly instructed by the maintainer.

Every payment implementation must follow the standards defined in this document.

---

# Purpose

Flutterwave is responsible for:

- Subscription payments
- Payment verification
- Webhook notifications
- Subscription upgrades
- Subscription renewals
- Payment history

Flutterwave is **not** responsible for business logic.

Business logic belongs to the application.

---

# Payment Philosophy

Never trust the client.

The browser should only initiate payments.

Every successful payment must be verified by the server before:

- unlocking VantagePro features
- updating subscriptions
- recording payment history

---

# Supported Plans

The mock-ups show two plans: **Free** and **VantagePro**.

The exact entitlements are **not yet decided** (see Open Questions in `AGENTS.md`).

Implement entitlements as data in one place (`features/billing/plans.ts`) so the maintainer can set limits without code changes elsewhere.

Candidate entitlement keys, pending confirmation:

| Key | Meaning |
|---------|---------|
| `analysesPerMonth` | Analysis runs allowed per billing period |
| `journeyAnalysis` | Whether Multiple Page Journey is available |
| `pagesPerJourney` | Maximum pages in one journey |
| `assistantMessagesPerMonth` | Assistant replies allowed per billing period |
| `figmaImport` | Whether Figma link import is available |
| `iterationHistory` | Whether re-analysis comparison is available |

## Free

Entitlements to be confirmed by the maintainer.

---

## VantagePro

Entitlements to be confirmed by the maintainer.

---

# Payment Flow

Always implement the following flow.

```text
User

↓

Clicks Upgrade

↓

Server creates Flutterwave payment

↓

Flutterwave Checkout

↓

Payment Completed

↓

Flutterwave Webhook

↓

Verify Signature

↓

Verify Transaction

↓

Update Database

↓

Activate Subscription

↓

Notify User
```

Never activate subscriptions before verification.

---

# Architecture

```
Client

↓

Server Action

↓

Billing Service

↓

Flutterwave API

↓

Webhook

↓

Payment Verification

↓

Database Update

↓

Subscription Activated
```

Business logic must never exist inside React components.

---

# Directory Structure

```
services/

billing/

flutterwave/

verify-payment.ts

create-payment.ts

subscription.ts

webhook.ts
```

Avoid scattering payment logic throughout the application.

---

# Responsibilities

The Billing Service is responsible for:

- Creating checkout sessions
- Verifying transactions
- Processing webhooks
- Updating subscriptions
- Recording payment history

The UI is responsible only for initiating checkout.

---

# Environment Variables

Use environment variables.

Example:

```
FLW_PUBLIC_KEY=

FLW_SECRET_KEY=

FLW_WEBHOOK_SECRET=

FLW_ENCRYPTION_KEY=
```

Never hardcode keys.

Never commit secrets.

---

# Database Tables

Expected tables include:

```
users

subscriptions

payments

payment_events
```

Do not duplicate payment information.

---

# Subscription States

Allowed states:

```
free

active

past_due

cancelled

expired
```

Do not invent additional states without approval.

---

# Creating a Subscription

When a user upgrades:

1. Authenticate user.
2. Confirm current subscription.
3. Create Flutterwave checkout.
4. Store pending payment.
5. Redirect user.
6. Wait for webhook.

Never activate immediately.

---

# Webhooks

Every webhook must:

1. Verify signature.
2. Validate payload.
3. Confirm payment with Flutterwave.
4. Check transaction uniqueness.
5. Record payment.
6. Update subscription.
7. Log the event.

Ignore invalid requests.

---

# Signature Verification

Every webhook request must verify:

- Signature header
- Secret
- Payload integrity

Never trust incoming webhook data.

---

# Payment Verification

Before unlocking VantagePro:

Verify:

- Transaction exists
- Amount matches
- Currency matches
- Status is successful
- Transaction reference matches
- Customer matches

Never rely on redirect URLs.

---

# Duplicate Payments

Transaction references must be unique.

Before processing:

Check:

```
payments.reference
```

If already processed:

Ignore.

Do not duplicate subscriptions.

---

# Refunds

Refund processing should:

- Record refund
- Update subscription
- Notify user
- Preserve payment history

Never delete payment records.

---

# Failed Payments

If payment fails:

- Preserve pending state
- Notify user
- Allow retry

Do not delete payment attempts.

---

# Renewals

Renewals should:

- Verify payment
- Extend subscription
- Record payment
- Notify user

---

# Cancellations

Cancelling a subscription should:

- Stop future renewals
- Preserve current access until expiry
- Keep payment history

Never immediately delete user access unless required.

---

# Payment History

Store:

- Reference
- Amount
- Currency
- Status
- Plan
- User
- Timestamp

Payment history is immutable.

Never edit historical records.

---

# Logging

Log:

- Checkout creation
- Verification
- Webhooks
- Refunds
- Failures
- Subscription changes

Never log:

- Secret keys
- Card information
- Tokens

---

# Error Handling

Users should receive:

- Clear
- Friendly
- Actionable

messages.

Never expose Flutterwave API responses directly.

---

# Security

Always:

- Verify signatures
- Validate payloads
- Authenticate users
- Authorize updates
- Use HTTPS
- Use environment variables

Never:

- Trust client payment status
- Skip verification
- Expose secret keys

---

# Testing

Before deployment verify:

- Successful payment
- Failed payment
- Duplicate webhook
- Invalid webhook
- Cancelled payment
- Retry flow
- Subscription upgrade
- Renewal
- Expiration

---

# AI Agent Checklist

Before merging payment-related code:

- [ ] Uses Billing Service
- [ ] Uses Flutterwave only
- [ ] Server-side verification implemented
- [ ] Webhook signature verified
- [ ] Duplicate transaction protection
- [ ] Subscription updated correctly
- [ ] Payment history stored
- [ ] Secrets stored in environment variables
- [ ] Logs implemented
- [ ] Error handling implemented
- [ ] Matches Architecture Rules
- [ ] Matches Security Rules

---

# Anti-Patterns

Never:

- Trust redirect URLs
- Trust client payment status
- Skip webhook verification
- Hardcode API keys
- Put payment logic inside React components
- Duplicate payment processing
- Delete payment history
- Expose secret credentials
- Mix multiple payment providers

---

# Definition of Done

A payment implementation is complete when:

- Users can upgrade successfully.
- Transactions are verified server-side.
- Webhooks are authenticated.
- Subscriptions update automatically.
- Payment history is recorded.
- Failed payments are handled gracefully.
- Duplicate webhooks are ignored.
- Security standards are met.
- The implementation aligns with Vantage AI's architecture.

The objective of every payment flow is simple:

> **Provide a secure, reliable, and frictionless upgrade experience while ensuring that subscription status always reflects verified payment data.**