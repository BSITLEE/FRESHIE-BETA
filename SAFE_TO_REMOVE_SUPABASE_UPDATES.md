# SAFE_TO_REMOVE_SUPABASE_UPDATES

This project already has Supabase configured. Apply only the additive updates below.

## 1) Run the new SQL patches

1. Open Supabase Dashboard -> SQL Editor.
2. Open `supabase/supabase_updates_parent_teacher_assignments.sql`.
3. Run the full script once.
4. Open `supabase/supabase_auth_role_sync.sql`.
5. Run the full script once.

### 1.5) If you get this error

Error shown:

`ERROR: 42704: type public.app_role does not exist`

Cause:
- Your DB uses `public.user_role` (from `supabase-setup-guide.md`), not `public.app_role`.

Continue with this recovery SQL (run once), then proceed to Step 2:

```sql
-- If a previous failed run left partial objects, this is safe:
drop trigger if exists trg_handle_auth_user_upsert on auth.users;
drop function if exists public.handle_auth_user_upsert();
drop function if exists public.set_user_role_by_email(text, public.app_role);

-- Ensure role enum exists (normally already created in supabase-setup-guide)
do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'user_role'
  ) then
    create type public.user_role as enum ('admin','teacher','parent');
  end if;
end $$;
```

Then:
- re-open `supabase/supabase_auth_role_sync.sql` (already updated to use `public.user_role`)
- run it again
- continue from Step 2 in this guide

This script adds:
- `assignments` table linked to `users` and `student_profiles`
- Unique protection for duplicate `teacher_students` links
- Completion timestamp trigger for assignments
- RLS policies for admin/teacher/parent reads
- `teacher_student_assignment_stats` view for teacher monitoring
- `activity_logs` table for account/game/assignment events
- `admin_analytics_rollup` view for admin totals
- auth-to-public users sync trigger for reliable role lookup
- helper function for safe role updates by email

## 2) Verify table and relationship creation

Run:

```sql
select to_regclass('public.assignments') as assignments_table;
select to_regclass('public.activity_logs') as activity_logs_table;
select tgname from pg_trigger where tgname = 'trg_handle_auth_user_upsert';
select indexname from pg_indexes where tablename = 'teacher_students';
```

Expected:
- `assignments_table` is `public.assignments`
- `activity_logs_table` is `public.activity_logs`
- trigger `trg_handle_auth_user_upsert` exists
- `uq_teacher_students_teacher_student` index exists

## 2.1) Teacher connect-by-email lookup support (new)

Run this once (additive):

1. Open Supabase Dashboard -> SQL Editor.
2. Open `supabase/supabase_teacher_parent_email_lookup.sql`.
3. Run it.

This adds a case-insensitive index on `public.users.email` so teacher “Find” by parent email remains fast and reliable.

## 2.2) Teacher classes + realtime support (new)

Run this once (additive):

1. Open Supabase Dashboard -> SQL Editor.
2. Open `supabase/supabase_teacher_classes_realtime.sql`.
3. Run it.

This adds:
- `teacher_classes`
- `class_students`
- `assignments.class_id`
- teacher/admin RLS for class data
- indexes for faster realtime-driven refreshes

## 2.3) Auth + realtime repair (new)

Run this once if any of these happen:
- `Auth role sync failed`
- `Supabase session hydrate failed`
- teacher lookup says `No child profiles found for this parent email`
- you already ran publication SQL manually and want a safe repair

Steps:

1. Open Supabase Dashboard -> SQL Editor.
2. Open `supabase/supabase_auth_realtime_repair.sql`.
3. Run it once.

This safely:
- backfills missing `public.users` rows from `auth.users`
- refreshes `public.users.email` from `auth.users`
- creates a secure helper used by teacher parent-email lookup
- safely ensures only the needed realtime tables are present in `supabase_realtime`

After running it, test these in order:

```sql
select count(*) as public_users_count from public.users;

select public.find_parent_user_id_by_email('parent@example.com');

select p.pubname, c.relname
from pg_publication p
join pg_publication_rel pr on pr.prpubid = p.oid
join pg_class c on c.oid = pr.prrelid
join pg_namespace n on n.oid = c.relnamespace
where p.pubname = 'supabase_realtime'
  and n.nspname = 'public'
order by c.relname;
```

After running it, enable realtime for these tables in Supabase if not already enabled:
- `student_profiles`
- `student_progress`
- `teacher_students`
- `assignments`
- `teacher_classes`
- `class_students`

## 3) Verify parent child create/delete sync

1. Login as parent.
2. Add a child from setup/profile management.
3. Confirm row exists in `public.student_profiles`.
4. Delete that child from Manage Children.
5. Confirm row is removed from `public.student_profiles`.
6. Confirm related rows are removed automatically from:
   - `public.student_progress`
   - `public.teacher_students`
   - `public.assignments` (new)

## 4) Verify teacher add/connect and assignments

1. Login as teacher.
2. Use **Add Student** to create a student profile.
3. Use **Connect Existing**:
   - enter parent email, click **Find**
   - select one or more child profiles, click **Connect Selected Profiles**
4. Assign activities to students.
5. Confirm rows are inserted in `public.assignments`.
6. Start assigned activity from child menu and finish it.
7. Confirm assignment status becomes completed (`completed=true`, `completed_at` set).

## 5) Verify admin analytics + logs

1. Login as admin.
2. Open Admin Dashboard.
3. Confirm Overview totals update from real DB data:
   - users by role
   - students
   - assignments + completion
   - games played
4. Confirm Users tab shows recent accounts from `public.users`.
5. Confirm System tab shows recent activity from `public.activity_logs`.
6. Validate analytics SQL directly:

```sql
select * from public.admin_analytics_rollup;
select event_type, entity_type, created_at from public.activity_logs order by created_at desc limit 20;
```

## 6) Optional rollback (safe removal)

If you need to remove only these new updates:

```sql
drop view if exists public.teacher_student_assignment_stats;
drop view if exists public.admin_analytics_rollup;
drop table if exists public.activity_logs cascade;
drop table if exists public.assignments cascade;
drop function if exists public.sync_assignment_completed_at();
drop function if exists public.set_user_role_by_email(text, public.user_role);
drop function if exists public.set_user_role_by_email(text, public.app_role);
drop trigger if exists trg_handle_auth_user_upsert on auth.users;
drop function if exists public.handle_auth_user_upsert();
drop policy if exists "users self update" on public.users;
drop index if exists public.uq_teacher_students_teacher_student;
```

This rollback removes only the new analytics + assignment extension layer.
