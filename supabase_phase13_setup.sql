-- Phase 13: rename a category and cascade the new name everywhere it is used.
-- Categories are referenced by name string in transactions/budget_goals/recurring,
-- so a rename must update all of them atomically. Run after phase 12.

create or replace function public.rename_category(p_type text, p_old_name text, p_new_name text)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_old text := lower(btrim(regexp_replace(p_old_name, '\s+', ' ', 'g')));
  v_new text := lower(btrim(regexp_replace(p_new_name, '\s+', ' ', 'g')));
begin
  if v_new = '' then
    raise exception 'New category name cannot be empty';
  end if;

  if v_new <> v_old and exists (
    select 1 from public.categories
    where user_id = auth.uid() and name = v_new and type = p_type
  ) then
    raise exception 'A category with that name already exists';
  end if;

  update public.categories set name = v_new
   where user_id = auth.uid() and name = v_old and type = p_type;

  update public.transactions set category = v_new
   where user_id = auth.uid() and category = v_old and type = p_type;

  -- budget_goals has no type column; match by name only.
  update public.budget_goals set category = v_new
   where user_id = auth.uid() and category = v_old;

  update public.recurring_transactions set category = v_new
   where user_id = auth.uid() and category = v_old and type = p_type;
end;
$$;
