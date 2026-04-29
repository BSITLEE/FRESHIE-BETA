# NEW_SAFE_TO_REMOVE_SUPABASE_UPDATES

Apply only the new additive fixes below. This does not replace your earlier Supabase setup.

## 1) Run the new SQL

1. Open Supabase Dashboard -> SQL Editor.
2. Open `supabase/supabase_parent_lookup_and_time_fixes.sql`.
3. Run the full script once.

What this adds:
- refreshes/backfills missing `public.users` rows from `auth.users`
- refreshes `public.users.email` from `auth.users`
- adds a safe lowercase index for email lookup
- creates `public.find_parent_user_id_by_email(text)`
- creates `public.find_student_profiles_by_parent_email(text)`

Why this matters:
- teacher accounts usually cannot directly read other rows in `public.users` because of RLS
- the new RPC returns the child profiles safely from the database side
- parent email lookup now trims whitespace and ignores case

## 2) Verify parent email lookup is fixed

Run these in SQL Editor:

```sql
select public.find_parent_user_id_by_email('parent@example.com');

select *
from public.find_student_profiles_by_parent_email('parent@example.com');
```

Expected:
- the first query returns the parent's `uuid`
- the second query returns one row per child profile for that parent

If the second query returns no rows:

```sql
select id, email, role
from public.users
where lower(trim(email)) = lower(trim('parent@example.com'));

select id, parent_id, name, created_at
from public.student_profiles
where parent_id = public.find_parent_user_id_by_email('parent@example.com')
order by created_at asc;
```

This tells you whether the issue is:
- missing `public.users` row
- wrong email on the account
- child profiles not linked to that `parent_id`

## 3) Verify the teacher dashboard flow

1. Log in as teacher.
2. Open `Teacher Dashboard`.
3. Click `Add Student`.
4. Enter the parent's real email exactly as used in Supabase auth.
5. Click `Find`.

Expected:
- the UI now trims/lowercases the email automatically
- it shows a result message under the input
- real child profiles appear for selection

Then:
1. Select one or more child profiles.
2. Click `Connect Students`.
3. Confirm the child cards appear immediately in the teacher dashboard without refresh.

## 4) Verify the parent logout fix

1. Log in as a parent.
2. Open the menu page.
3. Click `Logout`.

Expected:
- the route changes immediately to `/login`
- you should not remain on the empty `No Child Profiles Yet` menu screen
- you should not need a manual refresh

Implementation note:
- the frontend now clears local app state and navigates first
- Supabase sign-out still runs right after that in the background

## 5) Verify local time behavior

Database rule:
- keep storing timestamps in UTC / `timestamptz` in Supabase

Frontend rule:
- convert timestamps on the client using the current device locale/timezone

Check these screens:
1. `Parent Dashboard` recent activity dates
2. `Teacher Dashboard` assignment tracker dates
3. `Admin Dashboard` recent users and activity timestamps

Expected:
- dates/times match the device's local timezone
- if your device says April 28, the app should also show April 28 where appropriate

## 6) Optional validation queries

These are safe read-only checks:

```sql
select id, email, role, created_at
from public.users
order by created_at desc
limit 10;

select id, parent_id, name, created_at
from public.student_profiles
order by created_at desc
limit 20;

select id, event_type, entity_type, created_at
from public.activity_logs
order by created_at desc
limit 20;

select id, activity_name, assigned_to, assigned_date, completed, completed_at
from public.assignments
order by assigned_date desc
limit 20;
```

## 7) Optional rollback for only this new patch

```sql
drop function if exists public.find_student_profiles_by_parent_email(text);
drop function if exists public.find_parent_user_id_by_email(text);
drop index if exists public.idx_users_email_lower;
```

Keep in mind:
- dropping the functions removes the new teacher email lookup fix
- do not remove these if your teacher connect flow depends on them
