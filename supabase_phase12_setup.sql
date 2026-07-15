-- Phase 12: notification log (dedupe emailed reminders)
-- Run after phase 11. Pairs with the send-notifications Edge Function.

create table if not exists notification_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,
  ref text not null,
  sent_at timestamp with time zone not null default timezone('utc'::text, now()),
  unique (user_id, kind, ref)
);

alter table notification_log enable row level security;

-- Users can see their own notification history; the Edge Function inserts rows
-- with the service role (which bypasses RLS).
drop policy if exists "Users read their own notifications" on notification_log;
create policy "Users read their own notifications" on notification_log
  for select using (auth.uid() = user_id);
