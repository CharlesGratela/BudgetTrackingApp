-- Phase 5: performance + write integrity
-- Run this in the Supabase SQL editor after phases 2-4.

-- 1. Index the hot transactions lookup (filtered by user, ordered by date).
--    The base transactions table only had a primary key on id.
create index if not exists transactions_user_created_idx
  on public.transactions (user_id, created_at desc);

-- 2. Atomic replace of a month's budget goals.
--    The client previously deleted then re-inserted in two separate requests;
--    a failure in between left the month with no goals. This function performs
--    both steps in a single transaction. `security invoker` keeps the caller's
--    Row Level Security in force (auth.uid() is the calling user), so only the
--    existing INSERT/DELETE policies are required — no UPDATE policy needed.
create or replace function public.replace_month_budget_goals(p_month_key text, p_goals jsonb)
returns setof public.budget_goals
language plpgsql
security invoker
set search_path = public
as $$
begin
  delete from public.budget_goals
  where user_id = auth.uid() and month_key = p_month_key;

  return query
  insert into public.budget_goals (user_id, category, monthly_limit, rollover_enabled, month_key)
  select
    auth.uid(),
    g->>'category',
    (g->>'monthly_limit')::numeric,
    coalesce((g->>'rollover_enabled')::boolean, false),
    p_month_key
  from jsonb_array_elements(coalesce(p_goals, '[]'::jsonb)) as g
  returning *;
end;
$$;
