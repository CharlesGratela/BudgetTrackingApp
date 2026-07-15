---
name: add-supabase-feature
description: Scaffold a new user-owned, Supabase-backed feature in BudgetFlow end to end — a phased SQL migration with Row Level Security, shared TypeScript types, and a React Query data hook that matches repo conventions. Use when adding a new entity/table (e.g. "add a payees table", "track savings contributions") or a new data hook for an existing table.
---

# Add a Supabase-backed feature

Follow these steps in order. Read `budgetflow-conventions` first for the money/date/RLS rules. Match the style of the existing phase files and hooks exactly.

## 1. SQL migration

Add a new `supabase_phaseN_setup.sql` at the repo root (increment N past the highest existing phase). Every user-owned table follows this template:

```sql
create table if not exists <table> (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  -- columns; money as numeric with check (>= 0); dates as `date`; enums via check (x in (...))
  created_at timestamp with time zone not null default timezone('utc'::text, now())
);

alter table <table> enable row level security;

drop policy if exists "Users can view their own <table>" on <table>;
create policy "Users can view their own <table>" on <table>
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert their own <table>" on <table>;
create policy "Users can insert their own <table>" on <table>
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update their own <table>" on <table>;
create policy "Users can update their own <table>" on <table>
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own <table>" on <table>;
create policy "Users can delete their own <table>" on <table>
  for delete using (auth.uid() = user_id);
```

Rules:
- **Omit the UPDATE policy only if no hook will `.update()`/`.upsert()`** this table (see `categories`/`budget_goals`).
- Add a `unique (user_id, ...)` constraint for natural keys — it also indexes the `user_id`-leading lookup.
- Add `create index if not exists <table>_user_created_idx on <table> (user_id, created_at desc);` for tables queried by user and ordered by time (the base `transactions` table is missing this).
- Document the new file in `README.md` under "Additional SQL Files".

## 2. Types

Add interfaces to `src/types/<domain>.ts`: the row type (matching DB columns), a `*FormValues` type (string-based form fields), and a `*MutationInput` type (what gets inserted). Model exactly like `src/types/transactions.ts`.

## 3. Normalizer

Add a `normalize<Entity>(row): <Entity>` to `src/lib/<domain>.ts` that coerces `numeric` → `Number` and applies defaults. Keep any derived calculations here as pure functions (testable).

## 4. React Query hook

Create `src/hooks/use-<entity>.ts` mirroring `src/hooks/use-transactions.ts`:

```ts
const KEY = "<entity>";

export const use<Entities> = (userId?: string) =>
  useQuery({
    queryKey: [KEY, userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.from("<table>").select("*").eq("user_id", userId).order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map(normalize<Entity>);
    },
  });

export const useAdd<Entity> = (userId?: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: <Entity>MutationInput) => {
      if (!userId) throw new Error("Missing user");
      const { data, error } = await supabase.from("<table>").insert([{ ...payload, user_id: userId }]).select("*").single();
      if (error) throw error;
      return normalize<Entity>(data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY, userId] }),
  });
};
// update/delete follow the same shape; scope every write with .eq("user_id", userId)
```

Conventions: `enabled: !!userId`, guard mutations on missing `userId`, invalidate the `[KEY, userId]` prefix in `onSuccess`. Detect missing tables via `error.code === '42P01'`, not substring matching.

## 5. Wire into UI

Consume the hook in a page or a dialog. Keep the component thin — no aggregation logic inline. If it's a dialog, extract/reuse the shared dialog shell rather than copy-pasting a 6th near-identical dialog.

## 6. Verify

Add tests (see `write-tests`) for the normalizer and any derived pure functions, then `npm run test && npm run build && npm run lint`.
