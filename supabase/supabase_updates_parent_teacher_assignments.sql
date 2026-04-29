-- Parent <-> Child <-> Teacher <-> Assignments updates
-- Safe additive migration (does not drop existing tables/data).

begin;

-- 1) Ensure teacher->student links stay unique.
create unique index if not exists uq_teacher_students_teacher_student
  on public.teacher_students(teacher_id, student_id);

-- 2) Assignment table (teacher assigns activities to specific student profiles).
create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  activity_type text not null check (activity_type in ('color-quiz', 'shape-quiz', 'drag-match')),
  activity_name text not null,
  assigned_by uuid not null references public.users(id) on delete cascade,
  assigned_to uuid not null references public.student_profiles(id) on delete cascade,
  assigned_date timestamptz not null default now(),
  completed boolean not null default false,
  completed_at timestamptz
);

create index if not exists idx_assignments_assigned_to on public.assignments(assigned_to);
create index if not exists idx_assignments_assigned_by on public.assignments(assigned_by);
create index if not exists idx_assignments_completed on public.assignments(completed);

-- 3) Data quality trigger for assignment completion timestamp.
create or replace function public.sync_assignment_completed_at()
returns trigger
language plpgsql
as $$
begin
  if new.completed is true and old.completed is distinct from true and new.completed_at is null then
    new.completed_at = now();
  elsif new.completed is false then
    new.completed_at = null;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_sync_assignment_completed_at on public.assignments;
create trigger trg_sync_assignment_completed_at
before update on public.assignments
for each row
execute function public.sync_assignment_completed_at();

-- 4) RLS for assignments.
alter table public.assignments enable row level security;

drop policy if exists "assignments admin full" on public.assignments;
drop policy if exists "assignments teacher own" on public.assignments;
drop policy if exists "assignments parent own_children" on public.assignments;
drop policy if exists "assignments student_owner_select" on public.assignments;

create policy "assignments admin full"
on public.assignments
for all
using (
  exists (
    select 1 from public.users u
    where u.id = auth.uid() and u.role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.users u
    where u.id = auth.uid() and u.role = 'admin'
  )
);

create policy "assignments teacher own"
on public.assignments
for all
using (assigned_by = auth.uid())
with check (assigned_by = auth.uid());

create policy "assignments parent own_children"
on public.assignments
for select
using (
  exists (
    select 1
    from public.student_profiles sp
    where sp.id = assignments.assigned_to
      and sp.parent_id = auth.uid()
  )
);

-- Child profile "owners" in app are selected via parent account;
-- this policy allows reading assignments for linked students by parent/teacher.
create policy "assignments student_owner_select"
on public.assignments
for select
using (
  exists (
    select 1
    from public.teacher_students ts
    where ts.student_id = assignments.assigned_to
      and ts.teacher_id = auth.uid()
  )
);

-- 5) View for teacher dashboard rollups.
create or replace view public.teacher_student_assignment_stats as
select
  ts.teacher_id,
  sp.id as student_id,
  sp.name as student_name,
  coalesce(pr.color_score, 0) as color_score,
  coalesce(pr.shape_score, 0) as shape_score,
  coalesce(pr.drag_match_score, 0) as drag_match_score,
  coalesce(pr.total_games, 0) as total_games,
  count(a.id) as assignments_total,
  count(a.id) filter (where a.completed = true) as assignments_completed,
  count(a.id) filter (where a.completed = false) as assignments_pending
from public.teacher_students ts
join public.student_profiles sp on sp.id = ts.student_id
left join public.student_progress pr on pr.student_id = sp.id
left join public.assignments a on a.assigned_to = sp.id and a.assigned_by = ts.teacher_id
group by
  ts.teacher_id,
  sp.id,
  sp.name,
  pr.color_score,
  pr.shape_score,
  pr.drag_match_score,
  pr.total_games;

-- 6) Activity log table for cross-dashboard analytics.
create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid null references public.users(id) on delete set null,
  event_type text not null,
  entity_type text not null,
  entity_id text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_activity_logs_created_at on public.activity_logs(created_at desc);
create index if not exists idx_activity_logs_actor on public.activity_logs(actor_user_id);
create index if not exists idx_activity_logs_event on public.activity_logs(event_type);

alter table public.activity_logs enable row level security;

drop policy if exists "activity_logs admin read" on public.activity_logs;
drop policy if exists "activity_logs actor read" on public.activity_logs;
drop policy if exists "activity_logs service insert" on public.activity_logs;

create policy "activity_logs admin read"
on public.activity_logs
for select
using (
  exists (
    select 1 from public.users u
    where u.id = auth.uid() and u.role = 'admin'
  )
);

create policy "activity_logs actor read"
on public.activity_logs
for select
using (actor_user_id = auth.uid());

create policy "activity_logs service insert"
on public.activity_logs
for insert
with check (auth.uid() is not null);

-- 7) Admin analytics view (single-row aggregate).
create or replace view public.admin_analytics_rollup as
select
  (select count(*) from public.users) as total_users,
  (select count(*) from public.users where role = 'parent') as total_parents,
  (select count(*) from public.users where role = 'teacher') as total_teachers,
  (select count(*) from public.users where role = 'admin') as total_admins,
  (select count(*) from public.student_profiles) as total_students,
  (select count(*) from public.assignments) as total_assignments,
  (select count(*) from public.assignments where completed = true) as completed_assignments,
  (select coalesce(sum(total_games), 0) from public.student_progress) as total_games_played;

commit;
