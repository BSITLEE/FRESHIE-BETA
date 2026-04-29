-- Safe additive patch for:
-- 1) assignment completion sync performance
-- 2) achievement history accumulation (no overwrite)
-- 3) realtime consistency across parent/teacher/child views

begin;

-- If an old unique index exists from earlier patch, drop it so achievements can accumulate over time.
drop index if exists public.uq_student_achievement_type;

-- Keep fast reads for timeline/history queries.
create index if not exists idx_student_achievements_student_type_date
  on public.student_achievements (student_id, achievement_type, date_earned desc);

-- Assignments: make sure completion + child pending fetches stay fast.
create index if not exists idx_assignments_child_pending
  on public.assignments (assigned_to, completed, assigned_date desc);

create index if not exists idx_assignments_teacher_status
  on public.assignments (assigned_by, completed, teacher_cleared_at, assigned_date desc);

-- Realtime publication safety (no-op if already added)
do $$
begin
  begin
    alter publication supabase_realtime add table public.assignments;
  exception
    when duplicate_object then null;
    when undefined_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.student_achievements;
  exception
    when duplicate_object then null;
    when undefined_object then null;
  end;
end $$;

commit;
