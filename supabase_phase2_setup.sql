create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null check (type in ('income', 'expense')),
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  unique (user_id, name, type)
);

alter table categories enable row level security;

drop policy if exists "Users can view their own categories" on categories;
create policy "Users can view their own categories"
on categories for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own categories" on categories;
create policy "Users can insert their own categories"
on categories for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own categories" on categories;
create policy "Users can delete their own categories"
on categories for delete
using (auth.uid() = user_id);

create table if not exists budget_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null,
  monthly_limit numeric not null check (monthly_limit >= 0),
  month_key text not null,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  unique (user_id, category, month_key)
);

alter table budget_goals enable row level security;

drop policy if exists "Users can view their own budget goals" on budget_goals;
create policy "Users can view their own budget goals"
on budget_goals for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own budget goals" on budget_goals;
create policy "Users can insert their own budget goals"
on budget_goals for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own budget goals" on budget_goals;
create policy "Users can delete their own budget goals"
on budget_goals for delete
using (auth.uid() = user_id);
