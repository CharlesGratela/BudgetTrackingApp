alter table if exists budget_goals
add column if not exists rollover_enabled boolean not null default false;

create table if not exists user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  preferred_currency text not null default 'USD' check (preferred_currency in ('USD', 'PHP', 'EUR', 'GBP')),
  locale text not null default 'en-US',
  payday_frequency text not null default 'monthly' check (payday_frequency in ('weekly', 'biweekly', 'monthly')),
  default_landing_page text not null default 'dashboard' check (default_landing_page in ('dashboard', 'analytics')),
  budget_alerts_enabled boolean not null default true,
  recurring_alerts_enabled boolean not null default true,
  savings_alerts_enabled boolean not null default true,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now())
);

alter table user_preferences enable row level security;

drop policy if exists "Users can view their own preferences" on user_preferences;
create policy "Users can view their own preferences"
on user_preferences for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own preferences" on user_preferences;
create policy "Users can insert their own preferences"
on user_preferences for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own preferences" on user_preferences;
create policy "Users can update their own preferences"
on user_preferences for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create or replace function public.update_user_preferences_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

drop trigger if exists update_user_preferences_timestamp on user_preferences;
create trigger update_user_preferences_timestamp
before update on user_preferences
for each row
execute function public.update_user_preferences_timestamp();
