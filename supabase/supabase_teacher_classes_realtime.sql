-- Teacher classes + assignment class support + realtime-friendly indexes
-- Additive only.

begin;

create table if not exists public.teacher_classes (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.class_students (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.teacher_classes(id) on delete cascade,
  student_id uuid not null references public.student_profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create unique index if not exists uq_teacher_classes_teacher_name
  on public.teacher_classes(teacher_id, name);

create unique index if not exists uq_class_students_class_student
  on public.class_students(class_id, student_id);

create index if not exists idx_teacher_classes_teacher_id on public.teacher_classes(teacher_id);
create index if not exists idx_class_students_class_id on public.class_students(class_id);
create index if not exists idx_class_students_student_id on public.class_students(student_id);

alter table public.assignments add column if not exists class_id uuid null references public.teacher_classes(id) on delete set null;
create index if not exists idx_assignments_class_id on public.assignments(class_id);

alter table public.teacher_classes enable row level security;
alter table public.class_students enable row level security;

drop policy if exists "teacher_classes admin full" on public.teacher_classes;
drop policy if exists "teacher_classes teacher self" on public.teacher_classes;
drop policy if exists "class_students admin full" on public.class_students;
drop policy if exists "class_students teacher self" on public.class_students;

create policy "teacher_classes admin full"
on public.teacher_classes
for all
using (public.current_app_role() = 'admin')
with check (public.current_app_role() = 'admin');

create policy "teacher_classes teacher self"
on public.teacher_classes
for all
using (teacher_id = auth.uid())
with check (teacher_id = auth.uid());

create policy "class_students admin full"
on public.class_students
for all
using (public.current_app_role() = 'admin')
with check (public.current_app_role() = 'admin');

create policy "class_students teacher self"
on public.class_students
for all
using (
  exists (
    select 1
    from public.teacher_classes tc
    where tc.id = class_students.class_id
      and tc.teacher_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.teacher_classes tc
    where tc.id = class_students.class_id
      and tc.teacher_id = auth.uid()
  )
);

commit;
