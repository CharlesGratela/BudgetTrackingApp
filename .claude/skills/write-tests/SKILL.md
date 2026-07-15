---
name: write-tests
description: Write Vitest tests for BudgetFlow. Use when adding or updating tests for lib helpers, hooks, or components — covers the project's test setup, the boundary/timezone/fractional-money fixtures that catch this repo's real bugs, and how to test React Query hooks. Invoke after any change to src/lib/*, src/hooks/*, or money/date logic.
---

# Writing tests for BudgetFlow

## Setup (already configured)

- Runner: **Vitest** + jsdom, `globals: true` (no need to import `describe/it/expect`).
- Config: `vitest.config.ts` — `include: src/**/*.{test,spec}.{ts,tsx}`, alias `@` → `src`, setup `src/test/setup.ts` (jest-dom + `matchMedia` stub).
- Run: `npm run test` (once) / `npm run test:watch`.
- Place a test next to its subject: `src/lib/foo.ts` → `src/lib/foo.test.ts`.
- **Delete `src/test/example.test.ts`** — it's a `expect(true).toBe(true)` placeholder.

## Pure lib functions (primary target)

Import from `@/lib/...`, build **typed** fixtures, assert exact shapes. Model after `src/lib/planning.test.ts`:

```ts
import { buildSummary } from "@/lib/analytics";
import type { Transaction } from "@/types/transactions";

const tx = (over: Partial<Transaction>): Transaction => ({
  id: "t", user_id: "u", amount: 0, category: "food",
  type: "expense", description: null, created_at: "2026-03-10T08:00:00.000Z", ...over,
});
```

## Fixtures that actually catch this repo's bugs

The existing suite hides bugs by using whole numbers and `T08:00:00Z` timestamps. New tests MUST include:

1. **Timezone boundaries.** Use a near-midnight, month-edge instant AND force a non-UTC zone so local/UTC divergence is exposed. Set the zone by running with `TZ=America/New_York npx vitest run` (or assert with explicit UTC expectations). Example that should pass once month-keying is UTC-correct:
   ```ts
   // 2026-02-28T23:30Z is still February in UTC, but Feb 28 18:30 in America/New_York — also Feb.
   // The failing case is a UTC instant that is a DIFFERENT month locally, e.g. 2026-03-01T02:00Z → Feb 28 21:00 EST.
   expect(getMonthKey(new Date("2026-03-01T02:00:00.000Z"))).toBe("2026-03"); // must not drift to 2026-02
   ```
2. **Fractional money / float drift.** Amounts like `0.1`, `0.2`, `10.005`, and sums that would drift under naive `+=`:
   ```ts
   expect(buildSummary([tx({ type: "income", amount: 0.1 }), tx({ type: "income", amount: 0.2 })]).income).toBe(0.3);
   ```
3. **Inclusive vs strict period boundaries.** A transaction landing exactly on `startOfYear` / the 30-day edge should be included.
4. **Currency formatting across preferences.** Assert the same amount renders `$`, `₱`, `€`, `£` per `preferred_currency` (guards the hardcoded-`$` regression).
5. **Malformed input.** `getNextOccurrence` with a bad `start_date` must not throw `RangeError`; `escapeCsvValue` must neutralize a leading `=`/`+`/`-`/`@`.

## React Query hooks (currently 0% covered)

Render with a fresh `QueryClient` wrapper and mock the Supabase client. Assert query-key gating (`enabled: !!userId`), that mutations invalidate, and that a missing `userId` short-circuits.

```ts
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi } from "vitest";

vi.mock("@/lib/supabase", () => ({ supabase: { from: vi.fn() } }));

const wrapper = ({ children }) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
};
```

Prioritize the `budget_goals` delete-then-insert flow (test that a failed insert is surfaced, not silently swallowed) and `use-transactions` mutations.

## Definition of done

`npm run test` green, then `npm run build && npm run lint`. When you fix a bug from the analysis, add the regression test in the SAME change.
