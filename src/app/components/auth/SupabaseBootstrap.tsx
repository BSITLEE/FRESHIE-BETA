import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { isSupabaseConfigured, supabase } from '../../utils/supabaseClient';
import { debugLog } from '../../utils/debugLog';
import {
  fetchHydratedChildrenForUser,
  fetchAchievementsForStudents,
  fetchProgressForStudents,
  getOrCreateAppUser,
  getUserRoleById,
} from '../../utils/supabaseApi';
import { progressRowToChildProfile } from '../../utils/supabaseModels';
import type { AppRole } from '../../utils/supabaseModels';
import { useUserStore, type UserRole } from '../../utils/useUserStore';

export function SupabaseBootstrap() {
  const navigate = useNavigate();
  const { login, logout } = useUserStore();
  const bootstrappedRef = useRef(false);

  useEffect(() => {
    // #region agent log??
    debugLog({
      runId: 'pre-fix',
      hypothesisId: 'H2',
      location: 'src/app/components/auth/SupabaseBootstrap.tsx:24',
      message: 'bootstrap effect entered',
      data: { isSupabaseConfigured: Boolean(isSupabaseConfigured), hasClient: Boolean(supabase) },
    });
    // #endregion

    if (!isSupabaseConfigured || !supabase) return;
    const sb = supabase;
    if (bootstrappedRef.current) return;
    bootstrappedRef.current = true;

    const getRoleWithFallback = async (userId: string, email: string): Promise<UserRole> => {
      try {
        return (await getUserRoleById(userId)) as UserRole;
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        if (!message.toLowerCase().includes('not found')) throw e;
        const created = await getOrCreateAppUser({ id: userId, email, role: 'parent' });
        return created.role as UserRole;
      }
    };

    const hydrateFromSession = async (userId: string, email: string) => {
      const role = await getRoleWithFallback(userId, email);
      const students = await fetchHydratedChildrenForUser({ userId, role: role as AppRole });
      const progressMap = await fetchProgressForStudents(students.map((s) => s.id));
      const achievementMap = await fetchAchievementsForStudents(students.map((s) => s.id));
      const children = students.map((s) => progressRowToChildProfile(s, progressMap[s.id] ?? null, achievementMap[s.id] ?? []));
      login(email, role, children);
      return { role, students, children, progressMap, achievementMap };
    };

    let activeChannel: ReturnType<typeof supabase.channel> | null = null;

    const attachRealtime = (userId: string, email: string) => {
      if (activeChannel) {
        sb.removeChannel(activeChannel);
      }
      activeChannel = sb
        .channel(`freshie-realtime-${userId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'student_progress' }, async () => {
          await hydrateFromSession(userId, email);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'teacher_students' }, async () => {
          await hydrateFromSession(userId, email);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'student_profiles' }, async () => {
          await hydrateFromSession(userId, email);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'assignments' }, async () => {
          await hydrateFromSession(userId, email);
        })
        .subscribe();
    };

    const bootstrapSession = async () => {
      const { data } = await sb.auth.getSession();
      const session = data.session;
      debugLog({
        runId: 'pre-fix',
        hypothesisId: 'H3',
        location: 'src/app/components/auth/SupabaseBootstrap.tsx:bootstrapSession',
        message: 'session fetched',
        data: { hasSession: Boolean(session), hasUser: Boolean(session?.user), hasEmail: Boolean(session?.user?.email) },
      });
      if (!session?.user) {
        logout();
        navigate('/', { replace: true });
        return;
      }

      const hydrated = await hydrateFromSession(session.user.id, session.user.email ?? '');
      debugLog({
        runId: 'pre-fix',
        hypothesisId: 'H6',
        location: 'src/app/components/auth/SupabaseBootstrap.tsx:hydrateFromSession',
        message: 'dashboard state hydrated',
        data: {
          role: hydrated.role,
          studentsCount: hydrated.students.length,
          childrenCount: hydrated.children.length,
          progressRows: Object.keys(hydrated.progressMap || {}).length,
          achievementRows: Object.keys(hydrated.achievementMap || {}).length,
        },
      });
      attachRealtime(session.user.id, session.user.email ?? '');
    };

    bootstrapSession().catch((e) => {
      console.error(e);
      toast.error('Supabase session hydrate failed. Please retry login.');
    });

    const { data } = sb.auth.onAuthStateChange((event, session) => {
      if (!session) {
        if (activeChannel) sb.removeChannel(activeChannel);
        logout();
        navigate('/', { replace: true });
        return;
      }

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED' || event === 'INITIAL_SESSION') {
        hydrateFromSession(session.user.id, session.user.email ?? '')
          .then(() => attachRealtime(session.user.id, session.user.email ?? ''))
          .catch((e) => {
            console.error(e);
            toast.error('Auth role sync failed.');
          });
      }
    });

    return () => {
      if (activeChannel) sb.removeChannel(activeChannel);
      data.subscription.unsubscribe();
    };
  }, [login, logout, navigate]);

  return null;
}

