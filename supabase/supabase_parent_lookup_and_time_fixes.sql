-- Safe additive fixes for:
-- 1) teacher -> parent email -> child profile lookup
-- 2) auth/public user backfill for lookup reliability
-- 3) local-time display support (timestamps remain UTC timestamptz in DB)

begin;

create index if not exists idx_users_email_lower
  on public.users (lower(email));

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

update public.users pu
set email = au.email
from auth.users au
where pu.id = au.id
  and coalesce(pu.email, '') is distinct from coalesce(au.email, '');

create or replace function public.find_parent_user_id_by_email(target_email text)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  normalized_email text := lower(trim(target_email));
  matched_user_id uuid;
begin
  if normalized_email is null or normalized_email = '' then
    return null;
  end if;

  select u.id
    into matched_user_id
  from public.users u
  where lower(trim(u.email)) = normalized_email
  limit 1;

  if matched_user_id is not null then
    return matched_user_id;
  end if;

  select au.id
    into matched_user_id
  from auth.users au
  where lower(trim(au.email)) = normalized_email
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

create or replace function public.find_student_profiles_by_parent_email(target_email text)
returns table (
  student_id uuid,
  parent_id uuid,
  parent_email text,
  student_name text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  normalized_email text := lower(trim(target_email));
  resolved_parent_id uuid;
begin
  if normalized_email is null or normalized_email = '' then
    return;
  end if;

  resolved_parent_id := public.find_parent_user_id_by_email(normalized_email);

  return query
  select
    sp.id as student_id,
    sp.parent_id,
    coalesce(pu.email, au.email, normalized_email) as parent_email,
    sp.name as student_name,
    sp.created_at
  from public.student_profiles sp
  left join public.users pu on pu.id = sp.parent_id
  left join auth.users au on au.id = sp.parent_id
  where sp.parent_id = resolved_parent_id
  order by sp.created_at asc;
end;
$$;

grant execute on function public.find_parent_user_id_by_email(text) to authenticated;
grant execute on function public.find_student_profiles_by_parent_email(text) to authenticated;

commit;
