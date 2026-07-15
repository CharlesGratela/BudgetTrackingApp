-- Phase 14: accounts + net worth
-- Run after phase 13.

create table if not exists accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null default 'checking' check (type in ('checking', 'savings', 'credit', 'cash', 'investment')),
  starting_balance numeric not null default 0,
  created_at timestamp with time zone not null default timezone('utc'::text, now())
);

alter table accounts enable row level security;

drop policy if exists "Users view their own accounts" on accounts;
create policy "Users view their own accounts" on accounts for select using (auth.uid() = user_id);
drop policy if exists "Users insert their own accounts" on accounts;
create policy "Users insert their own accounts" on accounts for insert with check (auth.uid() = user_id);
drop policy if exists "Users update their own accounts" on accounts;
create policy "Users update their own accounts" on accounts for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Users delete their own accounts" on accounts;
create policy "Users delete their own accounts" on accounts for delete using (auth.uid() = user_id);

alter table public.transactions
  add column if not exists account_id uuid references public.accounts(id) on delete set null;

create index if not exists transactions_account_idx on public.transactions (account_id);

-- Backfill: give every user who has transactions a default "Main" account and
-- point their existing (unassigned) transactions at it.
do $$
declare
  r record;
  v_account uuid;
begin
  for r in select distinct user_id from public.transactions where account_id is null loop
    select id into v_account from public.accounts where user_id = r.user_id order by created_at limit 1;
    if v_account is null then
      insert into public.accounts (user_id, name, type) values (r.user_id, 'Main', 'checking') returning id into v_account;
    end if;
    update public.transactions set account_id = v_account where user_id = r.user_id and account_id is null;
  end loop;
end $$;
