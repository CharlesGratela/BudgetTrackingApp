-- Phase 8: savings-goal contributions
-- A contribution ledger per goal that keeps savings_goals.current_amount in sync.
-- Run in the Supabase SQL editor after phase 7.

create table if not exists savings_contributions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  savings_goal_id uuid not null references savings_goals(id) on delete cascade,
  amount numeric not null check (amount <> 0),
  note text,
  created_at timestamp with time zone not null default timezone('utc'::text, now())
);

alter table savings_contributions enable row level security;

drop policy if exists "Users can view their own savings contributions" on savings_contributions;
create policy "Users can view their own savings contributions" on savings_contributions
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert their own savings contributions" on savings_contributions;
create policy "Users can insert their own savings contributions" on savings_contributions
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own savings contributions" on savings_contributions;
create policy "Users can delete their own savings contributions" on savings_contributions
  for delete using (auth.uid() = user_id);

create index if not exists savings_contributions_goal_idx
  on savings_contributions (savings_goal_id, created_at desc);

-- Atomic: record a contribution and move the goal's current_amount in one tx.
create or replace function public.add_savings_contribution(p_goal_id uuid, p_amount numeric, p_note text default null)
returns public.savings_goals
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_goal public.savings_goals;
begin
  update public.savings_goals
     set current_amount = greatest(current_amount + p_amount, 0)
   where id = p_goal_id and user_id = auth.uid()
  returning * into v_goal;

  if v_goal.id is null then
    raise exception 'Savings goal not found';
  end if;

  insert into public.savings_contributions (user_id, savings_goal_id, amount, note)
  values (auth.uid(), p_goal_id, p_amount, nullif(btrim(p_note), ''));

  return v_goal;
end;
$$;

-- Atomic: remove a contribution and reverse its effect on current_amount.
create or replace function public.delete_savings_contribution(p_contribution_id uuid)
returns public.savings_goals
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_amount numeric;
  v_goal_id uuid;
  v_goal public.savings_goals;
begin
  delete from public.savings_contributions
   where id = p_contribution_id and user_id = auth.uid()
  returning amount, savings_goal_id into v_amount, v_goal_id;

  if v_goal_id is null then
    raise exception 'Contribution not found';
  end if;

  update public.savings_goals
     set current_amount = greatest(current_amount - v_amount, 0)
   where id = v_goal_id and user_id = auth.uid()
  returning * into v_goal;

  return v_goal;
end;
$$;
