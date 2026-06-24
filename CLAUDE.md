# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run start:dev        # watch mode
npm run build            # prisma generate + nest build
npm run start:prod       # run compiled output

# Testing
npm test                 # unit tests (all *.spec.ts under src/)
npm test -- --testPathPattern=transactions  # single test file
npm run test:e2e         # e2e tests (test/jest-e2e.json)
npm run test:cov         # coverage

# Quality
npm run lint             # eslint --fix
npm run typecheck        # tsc --noEmit (also runs on pre-commit)
npm run format           # prettier

# Database
npx prisma migrate dev   # apply migrations (uses DIRECT_URL)
npx prisma studio        # visual DB browser

# Commits (commitizen enforced by husky)
npm run commit           # interactive conventional-commit prompt
```

## Required Environment Variables

Copy `.env.example` to `.env`. The app refuses to start without:

- `JWT_SECRET` — sign/verify access tokens
- `DATABASE_URL` — pooled connection (PgBouncer, port 6543)
- `RESEND_API_KEY` — transactional email

`DIRECT_URL` is needed for migrations (non-pooled, port 5432). `GOOGLE_CLIENT_ID` enables Google OAuth.

## Architecture

NestJS REST API backed by PostgreSQL via Prisma. Each domain has its own module under `src/`:

| Module                | Responsibility                                                       |
| --------------------- | -------------------------------------------------------------------- |
| `auth`                | JWT + Google OAuth, email verification, password reset               |
| `users`               | User profile, balance settings                                       |
| `transactions`        | Manual income/expense entries with pagination                        |
| `categories`          | User-defined transaction categories                                  |
| `recurring-templates` | Template-driven recurring transactions (realize/skip per occurrence) |
| `credit-cards`        | Card management, purchase installments, invoice lifecycle            |
| `goals`               | Savings goals with contribution tracking                             |
| `imports`             | OFX/QFX file import with fuzzy duplicate detection                   |
| `support`             | Contact/support email endpoint                                       |
| `mailer`              | Resend-based transactional email (Resend SDK)                        |
| `prisma`              | Global `PrismaService` singleton                                     |

### Global infrastructure (wired in `AppModule`)

- **Rate limiting**: `ThrottlerGuard` at 100 req/min globally; auth endpoints override to 10 req/min.
- **Error tracking**: `SentryGlobalFilter` + `SentryUserInterceptor` attach user context to every Sentry event.
- **Static files**: served from `/public` via `ServeStaticModule`.
- **CORS**: `localhost:3000/3001` in dev, `nubolso.com` only in production.

### Validation pattern

All request bodies are validated with Zod schemas (not class-validator). Each module keeps its schemas in a `schemas.ts` file and applies them via `ZodValidationPipe` at the controller level:

```ts
@Post('register')
register(@Body(new ZodValidationPipe(registerSchema)) dto: RegisterDto) { ... }
```

DTOs under `dto/` are TypeScript types derived from Zod (`z.infer<typeof schema>`), not classes.

### Auth flow

`JwtAuthGuard` (passport-jwt) protects routes. The guard populates `req.user` with `{ sub: userId, email }`. Endpoints read the authenticated user via the `@CurrentUser()` decorator (`src/auth/decorators/current-user.decorator.ts`). All resource queries filter by `userId` to enforce ownership.

### Credit card domain

The most complex domain. Key concepts:

- A **`CreditCard`** has `closingDay`, `dueDay`, and `paymentDay`.
- A **`CreditCardPurchase`** is split into **`CreditCardInstallment`** rows, one per invoice month.
- **`CreditCardInvoice`** is created on demand (upserted) when a purchase is added. `resolveInvoicesAndCreateInstallments` in `src/credit-cards/utils/invoice-batch.ts` handles batch invoice resolution to avoid per-installment upserts timing out.
- Paying an invoice creates a `Transaction` linked back via `transactionId`.
- **`InstallmentAdvance`** records early payoff of remaining installments, moving them into the current invoice with a discount.

### OFX import flow

1. `POST /imports/ofx/upload` — parses the file, fuzzy-matches against existing transactions (±2 days window via `findFuzzyMatch`), returns a preview `ImportBatch` in `PENDING_REVIEW`.
2. `POST /imports/ofx/:batchId/confirm` — user decides per item (`IMPORT`/`SKIP`); confirmed items become `Transaction` rows. Uses chunked DB writes (`DB_CHUNK_SIZE = 500`) and extended Prisma transaction timeout (30 s).

### Database notes

- Two connection URLs: `DATABASE_URL` (pgBouncer pooled) for runtime, `DIRECT_URL` (direct) for migrations.
- `Transaction.fitId` is unique per user (`@@unique([userId, fitId])`) to prevent OFX duplicate imports.
- `@@unique([templateId, date])` on `Transaction` prevents duplicate recurring-template instances.
- Credit card invoices are unique per `(cardId, referenceYear, referenceMonth)`.
