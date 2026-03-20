create table if not exists recurring_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  amount numeric not null check (amount >= 0),
  category text not null,
  type text not null check (type in ('income', 'expense')),
  description text,
  frequency text not null check (frequency in ('weekly', 'monthly')),
  start_date date not null,
  next_occurrence timestamp with time zone not null,
  is_active boolean not null default true,
  created_at timestamp with time zone not null default timezone('utc'::text, now())
);

alter table recurring_transactions enable row level security;

drop policy if exists "Users can view their own recurring transactions" on recurring_transactions;
create policy "Users can view their own recurring transactions"
on recurring_transactions for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own recurring transactions" on recurring_transactions;
create policy "Users can insert their own recurring transactions"
on recurring_transactions for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own recurring transactions" on recurring_transactions;
create policy "Users can update their own recurring transactions"
on recurring_transactions for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own recurring transactions" on recurring_transactions;
create policy "Users can delete their own recurring transactions"
on recurring_transactions for delete
using (auth.uid() = user_id);

create table if not exists savings_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  target_amount numeric not null check (target_amount >= 0),
  current_amount numeric not null default 0 check (current_amount >= 0),
  target_date date,
  created_at timestamp with time zone not null default timezone('utc'::text, now())
);

alter table savings_goals enable row level security;

drop policy if exists "Users can view their own savings goals" on savings_goals;
create policy "Users can view their own savings goals"
on savings_goals for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own savings goals" on savings_goals;
create policy "Users can insert their own savings goals"
on savings_goals for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own savings goals" on savings_goals;
create policy "Users can update their own savings goals"
on savings_goals for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own savings goals" on savings_goals;
create policy "Users can delete their own savings goals"
on savings_goals for delete
using (auth.uid() = user_id);
