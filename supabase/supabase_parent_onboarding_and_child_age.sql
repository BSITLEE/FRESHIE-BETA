-- Safe additive migration for:
-- 1) Child profile age support
-- 2) Parent onboarding lifecycle metadata (optional analytics flag)

begin;

-- 1) Child age column (nullable for backward compatibility)
alter table if exists public.student_profiles
  add column if not exists age integer;

-- Keep existing rows valid and future writes clean.
alter table if exists public.student_profiles
  drop constraint if exists student_profiles_age_check;

alter table if exists public.student_profiles
  add constraint student_profiles_age_check
  check (age is null or (age >= 2 and age <= 12));

comment on column public.student_profiles.age is
  'Child age in years (nullable for legacy records).';

-- 2) Optional parent setup analytics flag
-- App flow already derives onboarding from "new signup marker + no children".
-- This flag is optional and useful for analytics/reporting.
alter table if exists public.users
  add column if not exists has_completed_child_setup boolean not null default false;

-- Backfill flag for existing parents with one or more children.
update public.users u
set has_completed_child_setup = true
where u.role = 'parent'
  and exists (
    select 1
    from public.student_profiles sp
    where sp.parent_id = u.id
  );

-- Keep flag in sync when a child profile is created.
create or replace function public.mark_parent_child_setup_complete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.users
  set has_completed_child_setup = true
  where id = new.parent_id
    and role = 'parent';
  return new;
end;
$$;

drop trigger if exists trg_mark_parent_child_setup_complete on public.student_profiles;
create trigger trg_mark_parent_child_setup_complete
after insert on public.student_profiles
for each row execute function public.mark_parent_child_setup_complete();

-- Keep parent email lookup RPC aligned with new age field (if this RPC exists in your app flow).
-- NOTE: return type changed (added age), so we must drop first to avoid 42P13.
drop function if exists public.find_student_profiles_by_parent_email(text);
create function public.find_student_profiles_by_parent_email(target_email text)
returns table (
  student_id uuid,
  parent_id uuid,
  student_name text,
  age integer,
  created_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    sp.id as student_id,
    sp.parent_id,
    sp.name as student_name,
    sp.age,
    sp.created_at
  from public.users u
  join public.student_profiles sp on sp.parent_id = u.id
  where lower(u.email) = lower(trim(target_email))
  order by sp.created_at asc;
$$;

commit;
