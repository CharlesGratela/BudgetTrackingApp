-- Phase 6: automatic recurring-transaction generation
-- Run in the Supabase SQL editor after phases 2-5.

-- 1. Link generated transactions back to their recurring template (audit +
--    idempotency). Deleting a template keeps its historical transactions.
alter table public.transactions
  add column if not exists recurring_transaction_id uuid
  references public.recurring_transactions(id) on delete set null;

create index if not exists transactions_recurring_idx
  on public.transactions (recurring_transaction_id);

-- 2. Atomic, idempotent generation of all due occurrences for the caller.
--    For each active template whose next_occurrence has passed, it inserts one
--    transaction per missed occurrence (dated at that occurrence) and advances
--    next_occurrence past p_now, all in one transaction. Re-running is a no-op
--    because next_occurrence has moved forward. `for update` serializes
--    concurrent callers (e.g. two open tabs). A per-call cap bounds catch-up.
create or replace function public.generate_due_recurring_transactions(p_now timestamptz default now())
returns setof public.transactions
language plpgsql
security invoker
set search_path = public
as $$
declare
  rec record;
  occ timestamptz;
  guard int;
begin
  for rec in
    select * from public.recurring_transactions
    where user_id = auth.uid()
      and is_active = true
      and next_occurrence <= p_now
    for update
  loop
    occ := rec.next_occurrence;
    guard := 0;

    while occ <= p_now and guard < 120 loop
      return query
      insert into public.transactions
        (user_id, amount, category, type, description, created_at, recurring_transaction_id)
      values
        (auth.uid(), rec.amount, rec.category, rec.type, rec.description, occ, rec.id)
      returning *;

      occ := case rec.frequency
        when 'weekly' then occ + interval '7 days'
        else occ + interval '1 month'
      end;
      guard := guard + 1;
    end loop;

    update public.recurring_transactions set next_occurrence = occ where id = rec.id;
  end loop;
end;
$$;
