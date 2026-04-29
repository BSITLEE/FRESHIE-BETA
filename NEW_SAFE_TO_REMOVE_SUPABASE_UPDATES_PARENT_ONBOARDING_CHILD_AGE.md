# NEW SAFE TO REMOVE: Parent Onboarding + Child Age

This file contains only the additional steps for:
- one-time parent onboarding popup flow
- child `age` support across app + dashboards
- immediate logout redirect behavior

---

## 1) Run the new SQL patch

In Supabase SQL Editor, run:

- `supabase/supabase_parent_onboarding_and_child_age.sql`

What this adds:
- `student_profiles.age` (nullable, backward compatible)
- age validation (`2..12`)
- optional `users.has_completed_child_setup` boolean
- trigger to mark parent setup complete after first child insert
- updated `find_student_profiles_by_parent_email(...)` RPC to return age

---

## 2) Deploy app changes (already included in this patch set)

The app now:
- removes old `setup-profile` route from routing
- uses a one-time parent onboarding modal on `menu` after parent signup
- shows onboarding only when:
  - account is parent
  - parent has zero children
  - current browser has signup onboarding marker for that account
- clears marker permanently after first child creation
- routes existing parent logins directly to `menu` with no popup
- logs out via `supabase.auth.signOut()` first, then clears local state and redirects to `login` immediately

---

## 3) Confirm child age is stored and read

Quick checks:

1. Sign up as a new parent
2. Verify onboarding modal appears on `menu`
3. Create first child with name + age
4. Confirm:
   - row exists in `student_profiles` with `age`
   - onboarding popup no longer appears for that account
5. Login as teacher/admin and verify child age appears in dashboard contexts

---

## 4) Backward compatibility notes

- Existing child records without age continue to work
- UI defaults missing ages safely (legacy rows stay readable)
- Parent onboarding does not depend on destructive schema changes

---

## 5) Safe rollback (if needed)

If you need to rollback only this addition:

- remove onboarding local storage key usage in frontend (`freshie-parent-onboarding-email`)
- optionally drop trigger/function/column added by this SQL (only if you want full revert)

This file is safe to remove after rollout is complete.
