# NEW SAFE TO REMOVE: Logout, Assignment Count, Achievements

This file contains only the **new incremental steps** for:
- stable logout redirect to the real login/signup page
- editable child age in Manage Children (UI + DB)
- teacher assignment question counts (5/10/15/20)
- assignment completion sync + clear completed indicators
- persistent achievements with local-time display

---

## 1) Run the new SQL file (conflict-safe)

Run this in Supabase SQL Editor:

- `supabase/supabase_assignment_questioncount_achievements_logout_sync.sql`

What it adds:
- `assignments.question_count` (nullable, limited to 5/10/15/20)
- `assignments.teacher_cleared_at` (soft-clear completed rows from teacher dashboard)
- `student_achievements` table with unique `(student_id, achievement_type)`
- helpful indexes for parent/teacher dashboard reads

---

## 2) Confirm parent logout behavior

Expected behavior now:
1. Parent clicks **Logout** from menu
2. App executes `supabase.auth.signOut()`
3. App clears local user state
4. App navigates to `/login`
5. Hard fallback redirect ensures no stale menu screen remains

Verification:
- Log in as parent → open menu → logout
- You should land directly on login/signup without manual refresh

---

## 3) Confirm child age edit in Manage Children

Expected behavior now:
- Manage Children supports updating both **name** and **age**
- Age updates are saved in Supabase (`student_profiles.age`)
- Updated age appears in parent/teacher dashboard contexts after refresh/sync

Verification:
1. Parent opens Manage Children
2. Edit child age
3. Confirm updated `student_profiles.age` in Supabase
4. Confirm teacher and parent views show updated age

---

## 4) Confirm teacher question-count assignments

Expected behavior now:
- During assignment (Color/Shape), teacher can set question count: `5`, `10`, `15`, or `20`
- Assigned child opens that activity with assigned count automatically
- On finish, assignment status becomes `Completed` (teacher + parent views sync)

Verification:
1. Teacher assigns Color or Shape with question count
2. Child starts from assigned activity card and finishes
3. Teacher tracker changes from Pending to Completed automatically
4. Parent assignment history reflects completion

---

## 5) Confirm clear completed indicator

Expected behavior now:
- Teacher can click **Clear** on completed assignment rows
- Row is hidden from teacher dashboard (`teacher_cleared_at` set)
- History is not hard-deleted

Verification:
1. Complete assignment
2. Click Clear in teacher tracker
3. Confirm row disappears from teacher list
4. Confirm row still exists in DB with `teacher_cleared_at` populated

---

## 6) Confirm persistent achievements + local time

Expected behavior now:
- Achievements are stored in `student_achievements`
- Child badges persist across sessions/dashboards
- Assignment/activity completion dates display using device local time format in UI
- DB timestamps remain UTC-compatible (`timestamptz`)

Verification:
1. Child earns badge via gameplay
2. Refresh/relogin as parent and teacher
3. Badge remains visible
4. Dates shown in UI match your local device date/time context

---

Safe to remove after rollout is stable and validated.
