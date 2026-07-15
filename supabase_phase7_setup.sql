-- Phase 7: scheduled server-side recurring generation
-- Materializes due recurring transactions even when nobody is logged in.
-- Run in the Supabase SQL editor after phase 6.

-- 1. Batch generator across ALL users. Intended for a scheduled job running as
--    service_role / postgres, which bypasses RLS. A normal authenticated caller
--    would be confined to their own rows by RLS, but the client already uses the
--    per-user RPC (generate_due_recurring_transactions), so execute is restricted
--    to service_role below. Same idempotent, capped logic as phase 6.
create or replace function public.generate_all_due_recurring_transactions(p_now timestamptz default now())
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  rec record;
  occ timestamptz;
  guard int;
  created_count int := 0;
begin
  for rec in
    select * from public.recurring_transactions
    where is_active = true and next_occurrence <= p_now
    for update skip locked
  loop
    occ := rec.next_occurrence;
    guard := 0;

    while occ <= p_now and guard < 120 loop
      insert into public.transactions
        (user_id, amount, category, type, description, created_at, recurring_transaction_id)
      values
        (rec.user_id, rec.amount, rec.category, rec.type, rec.description, occ, rec.id);

      created_count := created_count + 1;
      occ := case rec.frequency when 'weekly' then occ + interval '7 days' else occ + interval '1 month' end;
      guard := guard + 1;
    end loop;

    update public.recurring_transactions set next_occurrence = occ where id = rec.id;
  end loop;

  return created_count;
end;
$$;

-- Postgres grants EXECUTE to `public` by default on every new function, so we
-- must revoke from public (not just anon/authenticated) to truly lock it down.
revoke execute on function public.generate_all_due_recurring_transactions(timestamptz) from public;
grant execute on function public.generate_all_due_recurring_transactions(timestamptz) to service_role;

-- 2. OPTION A (recommended): schedule directly with pg_cron. Pure-DB, no HTTP,
--    no cold starts. The function is idempotent, so the hourly cadence only bounds
--    how soon a due item appears. Use this OR the Edge Function (Option B), not both.
create extension if not exists pg_cron;

do $$
begin
  if exists (select 1 from cron.job where jobname = 'generate-due-recurring') then
    perform cron.unschedule('generate-due-recurring');
  end if;
end $$;

select cron.schedule(
  'generate-due-recurring',
  '0 * * * *',
  $$ select public.generate_all_due_recurring_transactions(); $$
);

-- To inspect or stop it later:
--   select jobid, jobname, schedule, active from cron.job;
--   select cron.unschedule('generate-due-recurring');
