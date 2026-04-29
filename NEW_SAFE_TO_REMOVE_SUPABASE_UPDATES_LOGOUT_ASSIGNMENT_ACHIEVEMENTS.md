# NEW SAFE TO REMOVE: Landing Logout + Assignment Sync + Achievement History

This file contains only the latest incremental steps.

## 1) Run the new SQL

Run in Supabase SQL Editor:

- `supabase/supabase_logout_assignment_sync_achievement_history.sql`

What it does:
- drops old unique-achievement index so the same badge can be recorded multiple times over account lifetime
- keeps assignment completion queries fast for child/teacher/parent views
- ensures realtime publication includes `assignments` and `student_achievements`

## 2) Logout behavior check (landing page only)

Expected:
1. Parent clicks Logout
2. `supabase.auth.signOut()` runs
3. local state/session is cleared
4. app redirects to `/` (landing page), not `/login`

Quick test:
- login as parent -> go to menu -> logout -> should land on landing page instantly

## 3) Assignment completion sync check

Expected:
- child completes assignment -> DB `assignments.completed=true`, `completed_at` set
- assignment disappears from child pending assignment cards
- teacher dashboard flips pending -> completed automatically
- parent dashboard shows completed state automatically

Quick test:
1. Teacher assigns activity
2. Child opens assigned activity and finishes
3. Confirm row status updates in teacher + parent dashboards without manual refresh

## 4) Achievement history accumulation check

Expected:
- each earned achievement is inserted as a new history row
- no overwrite of older rows
- parent dashboard and child profile view show historical entries with device local timestamps

Quick test:
1. Play and earn badge multiple times
2. Confirm multiple rows in `student_achievements` for same child/type over time
3. Confirm timeline appears in Parent Dashboard + Menu child profile sections

## 5) Safe cleanup notes

Included safe cleanup:
- removed unused `src/app/pages/SetupProfilePage.tsx`

Optional local cleanup (manual):
- remove `dist/` from workspace if you do not need local build artifacts
- keep `node_modules/` as-is unless reinstalling dependencies

Safe to remove this file once rollout is stable.
