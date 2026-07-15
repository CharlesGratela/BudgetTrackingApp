-- Phase 11: transaction receipts (Supabase Storage)
-- Enable Storage in your Supabase project, then run this after phase 10.

alter table public.transactions
  add column if not exists receipt_path text;

-- Private bucket for receipt images.
insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', false)
on conflict (id) do nothing;

-- Users may only touch files under a folder named after their own user id
-- (we upload to '<uid>/<file>'). Scoped to the 'receipts' bucket.
drop policy if exists "Users read their own receipts" on storage.objects;
create policy "Users read their own receipts" on storage.objects
  for select using (bucket_id = 'receipts' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users upload their own receipts" on storage.objects;
create policy "Users upload their own receipts" on storage.objects
  for insert with check (bucket_id = 'receipts' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users delete their own receipts" on storage.objects;
create policy "Users delete their own receipts" on storage.objects
  for delete using (bucket_id = 'receipts' and (storage.foldername(name))[1] = auth.uid()::text);
