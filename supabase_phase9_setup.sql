-- Phase 9: recurring end date + schedule-aware generation
-- Run in the Supabase SQL editor after phase 8.

alter table public.recurring_transactions
  add column if not exists end_date date;

-- Replace the per-user generator (phase 6): stop generating past end_date and
-- deactivate a template once its schedule is complete.
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
    where user_id = auth.uid() and is_active = true and next_occurrence <= p_now
    for update
  loop
    occ := rec.next_occurrence;
    guard := 0;

    while occ <= p_now and guard < 120 and (rec.end_date is null or occ::date <= rec.end_date) loop
      return query
      insert into public.transactions
        (user_id, amount, category, type, description, created_at, recurring_transaction_id)
      values
        (auth.uid(), rec.amount, rec.category, rec.type, rec.description, occ, rec.id)
      returning *;

      occ := case rec.frequency when 'weekly' then occ + interval '7 days' else occ + interval '1 month' end;
      guard := guard + 1;
    end loop;

    update public.recurring_transactions
      set next_occurrence = occ,
          is_active = case when rec.end_date is not null and occ::date > rec.end_date then false else is_active end
      where id = rec.id;
  end loop;
end;
$$;

-- Replace the batch generator (phase 7) with the same end_date behavior.
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

    while occ <= p_now and guard < 120 and (rec.end_date is null or occ::date <= rec.end_date) loop
      insert into public.transactions
        (user_id, amount, category, type, description, created_at, recurring_transaction_id)
      values
        (rec.user_id, rec.amount, rec.category, rec.type, rec.description, occ, rec.id);

      created_count := created_count + 1;
      occ := case rec.frequency when 'weekly' then occ + interval '7 days' else occ + interval '1 month' end;
      guard := guard + 1;
    end loop;

    update public.recurring_transactions
      set next_occurrence = occ,
          is_active = case when rec.end_date is not null and occ::date > rec.end_date then false else is_active end
      where id = rec.id;
  end loop;

  return created_count;
end;
$$;

revoke execute on function public.generate_all_due_recurring_transactions(timestamptz) from public;
grant execute on function public.generate_all_due_recurring_transactions(timestamptz) to service_role;
