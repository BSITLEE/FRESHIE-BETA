-- Auth + role sync hardening for reliable login/role routing.
-- Additive only.

begin;

-- 1) Keep public.users in sync with auth.users inserts/updates.
create or replace function public.handle_auth_user_upsert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce((new.raw_user_meta_data ->> 'role')::text, 'parent')::public.user_role
  )
  on conflict (id) do update
  set email = excluded.email;

  return new;
end;
$$;

drop trigger if exists trg_handle_auth_user_upsert on auth.users;
create trigger trg_handle_auth_user_upsert
after insert or update of email, raw_user_meta_data
on auth.users
for each row
execute function public.handle_auth_user_upsert();

-- 2) Optional helper for admin role updates by email.
create or replace function public.set_user_role_by_email(target_email text, next_role public.user_role)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.users
  set role = next_role
  where lower(email) = lower(target_email);
end;
$$;

-- 3) Ensure users can update their own email row in public.users after auth changes.
drop policy if exists "users self update" on public.users;
create policy "users self update"
on public.users
for update
using (id = auth.uid())
with check (id = auth.uid());

commit;
