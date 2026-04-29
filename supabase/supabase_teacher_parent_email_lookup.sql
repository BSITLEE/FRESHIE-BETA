-- Teacher "Connect Existing" by parent email hardening.
-- Additive only.

begin;

-- Case-insensitive lookup support for public.users.email
create index if not exists idx_users_email_lower on public.users (lower(email));

commit;
