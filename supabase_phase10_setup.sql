-- Phase 10: merchant / payee on transactions
-- Run in the Supabase SQL editor after phase 9.

alter table public.transactions
  add column if not exists merchant text;

create index if not exists transactions_merchant_idx
  on public.transactions (user_id, merchant);
