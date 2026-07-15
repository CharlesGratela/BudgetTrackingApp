---
name: budgetflow-conventions
description: BudgetFlow correctness rules and repo conventions for money, currency, dates, Supabase access, and React Query. Read this BEFORE writing or editing any code that formats or sums money, handles a transaction/budget/recurring date or month, adds a Supabase query/mutation, or creates a data hook. Prevents the currency-preference and timezone/float bugs.
---

# BudgetFlow Conventions

Authoritative rules for working in this repo. When a rule here conflicts with existing code, the existing code is a **known bug to fix**, not a pattern to copy. See `CLAUDE.md` for general engineering standards.

## Money

- **Never hardcode a currency symbol and never call `toFixed` inline for display.** All money shown to the user MUST go through a currency-aware formatter that respects `user_preferences.preferred_currency` (USD / PHP / EUR / GBP) via `Intl.NumberFormat` (see `src/lib/preferences.ts`). `src/lib/transactions.ts::formatCurrency` currently hardcodes `$` — treat it as deprecated; route display through the preference-aware path used by `DashboardOverview`.
- **Postgres `numeric` is exact — keep it for storage.** The drift risk is only in JS.
- **Round monetary results to cents at aggregation boundaries.** In JS, amounts are `number`. Sums use naive `+=` today (`buildSummary`, `buildCategoryData`, budget spend reducers) which can drift (`0.1 + 0.2`). Round each computed total to 2 decimals with a shared helper (e.g. `Math.round(x * 100) / 100`) rather than comparing raw floats. Prefer working in integer cents for any new accumulation-heavy logic.
- Never use `toFixed` for rounding math (it mis-rounds, e.g. `(1.005).toFixed(2) === "1.00"`); use it only for final string rendering inside the formatter.

## Dates & months (the highest-risk area)

The bug class here is **mixing local time and UTC**. Pick **one zone (UTC) for all bucketing, boundaries, and month keys** and never mix.

- **Anchor date-only values at noon UTC.** A `yyyy-MM-dd` value from a date input must become `new Date(\`${date}T12:00:00.000Z\`)`, not `new Date(date)` (which is UTC-midnight and rolls back a day for users west of UTC). This safe pattern already exists in `src/lib/planning.ts::getPreviousMonthKey` and `src/lib/phase3.ts::getNextOccurrence` — reuse it.
- **Derive month keys in UTC.** Use `getUTCFullYear()/getUTCMonth()` (or a single shared `toMonthKey(instant)` helper), NOT date-fns `format(new Date(x), "yyyy-MM")`, which uses the local zone and can bucket a boundary transaction into the wrong month. `src/lib/planning.ts` (spend bucketing) and `src/lib/analytics.ts::buildDailyData` currently use local-time `format()` — fix, don't copy.
- **Range/period boundaries must be built in the same zone as the data they compare against** (`created_at` is a UTC instant). `analytics.ts` custom-range and salary-period boundaries currently build local-time edges — a bug.
- **Day/period comparisons: watch strict vs inclusive.** `last-30-days` / `this-year` use strict `isAfter`, excluding a transaction landing exactly on the boundary. Use inclusive comparisons for period starts.
- `buildDailyData` chart keys must include the year (currently `"MMM dd"` collapses same-day-of-month across months/years).

## Supabase access

- Import the singleton client from `@/lib/supabase`. Never construct another client.
- **Every user-owned table has RLS enabled and 4 policies** scoped by `auth.uid() = user_id`. See `add-supabase-feature` skill for the exact template. Only add an UPDATE policy if a hook actually calls `.update()`/`.upsert()` (the repo omits UPDATE on `categories`/`budget_goals` because they use insert/delete and delete-then-insert respectively — deliberate).
- **Prefer atomic writes.** The `budget_goals` delete-then-insert (`use-budget-goals.ts`) is two non-transactional round-trips; a mid-failure wipes the month. New multi-row replacements should use `.upsert(..., { onConflict })` (add the UPDATE policy) or a Postgres RPC, not delete-then-insert.
- **Detect "table not set up" by error `code`, not substring.** `planning.ts::isMissingRelationError` matches any message containing `"relation"` or `"categories"`, silently swallowing real errors. New code should check `error.code === '42P01'` (undefined_table) instead.
- **CSV/export:** neutralize spreadsheet formula injection — prefix a leading `= + - @` with `'` in `escapeCsvValue` before writing user text.

## React Query & hooks

- One hook file per entity in `src/hooks/use-*.ts`. Reads use `useQuery({ queryKey: [KEY, userId, ...], enabled: !!userId, queryFn })`; writes use `useMutation` and MUST `queryClient.invalidateQueries({ queryKey: [KEY, userId] })` in `onSuccess`.
- **Short-circuit on missing `userId`.** `userId` is `string | undefined`; guard mutations (`if (!userId) throw new Error(...)`) instead of issuing `.eq("user_id", undefined)`.
- Normalize DB rows through a `normalize*` function in the matching `src/lib/*.ts` (coerce `numeric` → `Number`, apply defaults) before returning to components.
- Keep components thin: business logic and derivations belong in `src/lib/*.ts` (pure, testable), not inline in pages.

## Types

- Shared types live in `src/types/*.ts`. No `any`. Avoid `as` casts on Select handlers where a typed union callback works.
- `strictNullChecks` is being turned on — write null-safe code (optional chaining, explicit `?? fallback`).

## Before you finish

Run the `write-tests` skill for any lib/date/money change, then verify: `npm run test && npm run build && npm run lint`.
