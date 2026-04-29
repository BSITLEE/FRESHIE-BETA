# Supabase Setup Guide (Safe to delete)

This file is **safe to delete** after you finish setup.

## 1) Create a Supabase project

- **(SUPABASE DASHBOARD STEP)**: Create a new project in Supabase.
- **(SUPABASE DASHBOARD STEP)**: Wait for the database to be ready.

## 2) Add environment variables to the app

- **(VS CODE STEP)**: Create a file named `.env` in the project root (same folder as `package.json`).
- **(VS CODE STEP)**: Add:

```env
VITE_SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

- **(SUPABASE DASHBOARD STEP)**: Find these values in:
  - Project Settings → API → `Project URL`
  - Project Settings → API → `anon public`

## 3) Create the database schema (tables + relationships)

- **(SUPABASE DASHBOARD STEP)**: Go to SQL Editor → New query.
- **(SUPABASE DASHBOARD STEP)**: Paste and run the SQL below.

```sql
-- Enable UUID generation
create extension if not exists "pgcrypto";

-- 1) users
do $$ begin
  create type public.user_role as enum ('admin','teacher','parent');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.users (
  id uuid primary key,
  email text not null unique,
  role public.user_role not null default 'parent',
  created_at timestamptz not null default now()
);

-- 2) student_profiles
create table if not exists public.student_profiles (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

-- 3) student_progress
create table if not exists public.student_progress (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null unique references public.student_profiles(id) on delete cascade,
  color_score integer not null default 0,
  shape_score integer not null default 0,
  drag_match_score integer not null default 0,
  total_games integer not null default 0,
  updated_at timestamptz not null default now()
);

-- 4) teacher_students
create table if not exists public.teacher_students (
  id bigserial primary key,
  teacher_id uuid not null references public.users(id) on delete cascade,
  student_id uuid not null references public.student_profiles(id) on delete cascade,
  unique (teacher_id, student_id)
);

-- 5) analytics
create table if not exists public.analytics (
  id bigserial primary key,
  total_users integer not null default 0,
  total_students integer not null default 0,
  total_teachers integer not null default 0,
  total_games_played integer not null default 0,
  updated_at timestamptz not null default now()
);

-- Helpful indexes (performance)
create index if not exists idx_student_profiles_parent_id on public.student_profiles(parent_id);
create index if not exists idx_teacher_students_teacher_id on public.teacher_students(teacher_id);
create index if not exists idx_teacher_students_student_id on public.teacher_students(student_id);
create index if not exists idx_student_progress_student_id on public.student_progress(student_id);
```

## 4) Enable Row Level Security (RLS)

- **(SUPABASE DASHBOARD STEP)**: Database → Tables → for each table below, enable RLS:
  - `users`
  - `student_profiles`
  - `student_progress`
  - `teacher_students`
  - `analytics`

## 5) Add RLS policies

- **(SUPABASE DASHBOARD STEP)**: SQL Editor → New query.
- **(SUPABASE DASHBOARD STEP)**: Paste and run:

```sql
-- Helper: read role from app users table
create or replace function public.current_app_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select u.role from public.users u where u.id = auth.uid() limit 1),
    'parent'::public.user_role
  )
$$;

alter table public.users enable row level security;
alter table public.student_profiles enable row level security;
alter table public.student_progress enable row level security;
alter table public.teacher_students enable row level security;
alter table public.analytics enable row level security;

-- USERS TABLE
drop policy if exists "users admin full access" on public.users;
drop policy if exists "users self read" on public.users;

create policy "users admin full access"
on public.users
for all
to authenticated
using (public.current_app_role() = 'admin')
with check (public.current_app_role() = 'admin');

create policy "users self read"
on public.users
for select
to authenticated
using (id = auth.uid());

-- Allow a newly authenticated user to create their own row.
-- This is required because the app creates the row on first login/signup.
drop policy if exists "users self insert" on public.users;
create policy "users self insert"
on public.users
for insert
to authenticated
with check (id = auth.uid());

-- STUDENT PROFILES
drop policy if exists "profiles admin full" on public.student_profiles;
drop policy if exists "profiles parent own" on public.student_profiles;
drop policy if exists "profiles teacher assigned" on public.student_profiles;

create policy "profiles admin full"
on public.student_profiles
for all
to authenticated
using (public.current_app_role() = 'admin')
with check (public.current_app_role() = 'admin');

create policy "profiles parent own"
on public.student_profiles
for all
to authenticated
using (parent_id = auth.uid())
with check (parent_id = auth.uid());

create policy "profiles teacher assigned"
on public.student_profiles
for select
to authenticated
using (
  public.current_app_role() = 'teacher'
  and exists (
    select 1 from public.teacher_students ts
    where ts.teacher_id = auth.uid()
      and ts.student_id = student_profiles.id
  )
);

-- STUDENT PROGRESS
drop policy if exists "progress admin full" on public.student_progress;
drop policy if exists "progress parent own" on public.student_progress;
drop policy if exists "progress teacher assigned" on public.student_progress;

create policy "progress admin full"
on public.student_progress
for all
to authenticated
using (public.current_app_role() = 'admin')
with check (public.current_app_role() = 'admin');

create policy "progress parent own"
on public.student_progress
for all
to authenticated
using (
  exists (
    select 1
    from public.student_profiles sp
    where sp.id = student_progress.student_id
      and sp.parent_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.student_profiles sp
    where sp.id = student_progress.student_id
      and sp.parent_id = auth.uid()
  )
);

create policy "progress teacher assigned"
on public.student_progress
for select
to authenticated
using (
  public.current_app_role() = 'teacher'
  and exists (
    select 1 from public.teacher_students ts
    where ts.teacher_id = auth.uid()
      and ts.student_id = student_progress.student_id
  )
);

-- TEACHER_STUDENTS (junction)
drop policy if exists "teacher_students admin full" on public.teacher_students;
drop policy if exists "teacher_students teacher self" on public.teacher_students;

create policy "teacher_students admin full"
on public.teacher_students
for all
to authenticated
using (public.current_app_role() = 'admin')
with check (public.current_app_role() = 'admin');

create policy "teacher_students teacher self"
on public.teacher_students
for all
to authenticated
using (teacher_id = auth.uid())
with check (teacher_id = auth.uid());

-- ANALYTICS (admin only)
drop policy if exists "analytics admin only" on public.analytics;
create policy "analytics admin only"
on public.analytics
for all
to authenticated
using (public.current_app_role() = 'admin')
with check (public.current_app_role() = 'admin');
```

## 6) Set up Supabase Auth

- **(SUPABASE DASHBOARD STEP)**: Authentication → Providers → Email.
  - Enable Email auth.
  - (Optional) Disable email confirmations while testing locally.

## 7) Create test users (admin / teacher / parent)

Supabase Auth creates the login account, but your app also needs a row in `public.users` with the correct role.

- **(SUPABASE DASHBOARD STEP)**: Authentication → Users → “Add user”
  - Create:
    - an admin email + password
    - a teacher email + password
    - a parent email + password

- **(SUPABASE DASHBOARD STEP)**: SQL Editor → New query, then set roles (replace the emails):

```sql
update public.users set role = 'admin' where email = 'admin@example.com';
update public.users set role = 'teacher' where email = 'teacher@example.com';
update public.users set role = 'parent' where email = 'parent@example.com';
```

If the row doesn’t exist yet, insert it using the Auth user id:

- **(SUPABASE DASHBOARD STEP)**: In Authentication → Users, copy the user id, then:

```sql
insert into public.users (id, email, role)
values
  ('00000000-0000-0000-0000-000000000000', 'admin@example.com', 'admin');
```

## 8) Run the app locally

- **(VS CODE STEP)**: Install dependencies:

```bash
npm install
```

- **(VS CODE STEP)**: Start dev server:

```bash
npm run dev
```

## 9) Test authentication + role routing

- **(VS CODE STEP)**: Open the app and go to `/login`.
- **(VS CODE STEP)**: Log in as:
  - **Admin** → should land on `/admin-dashboard`
  - **Teacher** → should land on `/teacher-dashboard`
  - **Parent** → should land on `/parent-dashboard`

## 10) Verify dashboards are connected

- **Parent dashboard**
  - Create multiple child profiles in setup.
  - Switch between children; each child should show separate scores.
  - Play games; after finishing, scores should persist.

- **Teacher dashboard**
  - Connect a student using their `student_profiles.id` (UUID) as the “Student Code”.
  - You should see progress for linked students.

- **Admin dashboard**
  - Stats should update based on `users`, `student_profiles`, and `student_progress`.
  - Updates happen in near real-time via subscriptions.
