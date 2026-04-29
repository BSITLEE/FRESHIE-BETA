-- Safe repair for auth sync, parent email lookup, and realtime publication setup.
-- Additive/non-destructive.

begin;

create extension if not exists "pgcrypto";

-- 1) Ensure every auth user has a public.users row.
insert into public.users (id, email, role)
select
  au.id,
  coalesce(au.email, ''),
  case
    when lower(coalesce(au.raw_user_meta_data ->> 'role', '')) = 'admin' then 'admin'::public.user_role
    when lower(coalesce(au.raw_user_meta_data ->> 'role', '')) = 'teacher' then 'teacher'::public.user_role
    else 'parent'::public.user_role
  end
from auth.users au
where not exists (
  select 1
  from public.users pu
  where pu.id = au.id
);

-- 2) Keep public.users email fresh from auth.users.
update public.users pu
set email = au.email
from auth.users au
where pu.id = au.id
  and coalesce(pu.email, '') is distinct from coalesce(au.email, '');

-- 3) Security-definer helper for teacher parent-email lookup.
create or replace function public.find_parent_user_id_by_email(target_email text)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  matched_user_id uuid;
begin
  select u.id
    into matched_user_id
  from public.users u
  where lower(u.email) = lower(trim(target_email))
  limit 1;

  if matched_user_id is not null then
    return matched_user_id;
  end if;

  select au.id
    into matched_user_id
  from auth.users au
  where lower(au.email) = lower(trim(target_email))
  limit 1;

  if matched_user_id is not null then
    insert into public.users (id, email, role)
    select
      au.id,
      coalesce(au.email, ''),
      case
        when lower(coalesce(au.raw_user_meta_data ->> 'role', '')) = 'admin' then 'admin'::public.user_role
        when lower(coalesce(au.raw_user_meta_data ->> 'role', '')) = 'teacher' then 'teacher'::public.user_role
        else 'parent'::public.user_role
      end
    from auth.users au
    where au.id = matched_user_id
    on conflict (id) do update
      set email = excluded.email;
  end if;

  return matched_user_id;
end;
$$;

grant execute on function public.find_parent_user_id_by_email(text) to authenticated;

-- 4) Safe realtime publication repair.
do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
end $$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'student_profiles',
    'student_progress',
    'teacher_students',
    'assignments',
    'teacher_classes',
    'class_students'
  ]
  loop
    if exists (
      select 1
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relname = t
    ) and not exists (
      select 1
      from pg_publication p
      join pg_publication_rel pr on pr.prpubid = p.oid
      join pg_class c on c.oid = pr.prrelid
      join pg_namespace n on n.oid = c.relnamespace
      where p.pubname = 'supabase_realtime'
        and n.nspname = 'public'
        and c.relname = t
    ) then
      execute format('alter publication supabase_realtime add table %I.%I', 'public', t);
    end if;
  end loop;
end $$;

commit;
