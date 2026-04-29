-- Safe additive migration:
-- - assignment question count + clear indicator
-- - persistent child achievements
-- - indexes for parent/teacher/dashboard reads
-- This script is conflict-safe for reruns.

begin;

-- 1) Assignments: question count + clear indicator
alter table if exists public.assignments
  add column if not exists question_count integer;

alter table if exists public.assignments
  add column if not exists teacher_cleared_at timestamptz;

alter table if exists public.assignments
  drop constraint if exists assignments_question_count_check;

alter table if exists public.assignments
  add constraint assignments_question_count_check
  check (question_count is null or question_count in (5, 10, 15, 20));

create index if not exists idx_assignments_assigned_to_completed
  on public.assignments (assigned_to, completed, assigned_date desc);

create index if not exists idx_assignments_assigned_by_completed
  on public.assignments (assigned_by, completed, assigned_date desc);

create index if not exists idx_assignments_teacher_cleared_at
  on public.assignments (teacher_cleared_at);

-- 2) Persistent achievements per child
create table if not exists public.student_achievements (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.student_profiles(id) on delete cascade,
  achievement_type text not null,
  icon text not null,
  date_earned timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- One achievement type per student (upsert target used by app)
create unique index if not exists uq_student_achievement_type
  on public.student_achievements (student_id, achievement_type);

create index if not exists idx_student_achievements_student_date
  on public.student_achievements (student_id, date_earned desc);

-- 3) Realtime publication safety (if already present, no-op)
do $$
begin
  begin
    alter publication supabase_realtime add table public.student_achievements;
  exception
    when duplicate_object then null;
    when undefined_object then null;
  end;
end $$;

commit;
