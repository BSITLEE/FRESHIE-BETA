import { supabase } from './supabaseClient';
import type {
  AppRole,
  DbActivityLog,
  DbAdminSnapshot,
  DbAnalytics,
  DbAchievement,
  DbAssignment,
  DbClassStudent,
  DbStudentProfile,
  DbStudentProgress,
  DbTeacherClass,
  DbUser,
} from './supabaseModels';
import { debugLog } from './debugLog';

export function requireSupabase() {
  if (!supabase) throw new Error('Supabase is not configured');
  return supabase;
}

export async function getOrCreateAppUser(params: {
  id: string;
  email: string;
  role: AppRole;
}): Promise<DbUser> {
  const sb = requireSupabase();

  const { data: existing, error: existingError } = await sb
    .from('users')
    .select('id,email,role,created_at')
    .eq('id', params.id)
    .maybeSingle();

  if (existingError) throw existingError;
  if (existing) return existing as DbUser;

  const { data: inserted, error: insertError } = await sb
    .from('users')
    .insert({
      id: params.id,
      email: params.email,
      role: params.role,
    })
    .select('id,email,role,created_at')
    .single();

  // #region agent log
  if (insertError) {
    debugLog({
      runId: 'pre-fix',
      hypothesisId: 'H5',
      location: 'src/app/utils/supabaseApi.ts:55',
      message: 'insert into users failed',
      data: { code: (insertError as any)?.code, status: (insertError as any)?.status, message: (insertError as any)?.message },
    });
  }
  // #endregion

  if (insertError) throw insertError;
  await logActivity({
    actorUserId: params.id,
    eventType: 'account_created',
    entityType: 'users',
    entityId: params.id,
    metadata: { role: params.role, email: params.email },
  }).catch(() => undefined);
  return inserted as DbUser;
}

export async function getUserRoleById(userId: string): Promise<AppRole> {
  const sb = requireSupabase();
  const { data, error } = await sb.from('users').select('role').eq('id', userId).maybeSingle();
  // #region agent log
  if (error) {
    debugLog({
      runId: 'pre-fix',
      hypothesisId: 'H4',
      location: 'src/app/utils/supabaseApi.ts:74',
      message: 'select role from users failed',
      data: { code: (error as any)?.code, status: (error as any)?.status, message: (error as any)?.message },
    });
  }
  // #endregion
  if (error) throw error;
  if (!data) throw new Error('User row not found');
  return (data as { role: AppRole }).role;
}

export async function fetchParentStudents(parentId: string): Promise<DbStudentProfile[]> {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from('student_profiles')
    .select('id,parent_id,name,age,created_at')
    .eq('parent_id', parentId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as DbStudentProfile[];
}

export async function fetchTeacherStudents(teacherId: string): Promise<DbStudentProfile[]> {
  const sb = requireSupabase();

  // only pulls student_profiles via the junction.
  const { data, error } = await sb
    .from('teacher_students')
    .select('student_profiles(id,parent_id,name,age,created_at)')
    .eq('teacher_id', teacherId);

  if (error) throw error;
  const rows = (data ?? []) as Array<{ student_profiles: DbStudentProfile | null }>;
  return rows.map((r) => r.student_profiles).filter(Boolean) as DbStudentProfile[];
}

export async function fetchTeacherStudentsForClass(params: {
  teacherId: string;
  classId?: string | null;
}): Promise<DbStudentProfile[]> {
  const sb = requireSupabase();
  if (!params.classId) return fetchTeacherStudents(params.teacherId);

  const { data, error } = await sb
    .from('class_students')
    .select('student_profiles!inner(id,parent_id,name,age,created_at), teacher_classes!inner(teacher_id)')
    .eq('class_id', params.classId)
    .eq('teacher_classes.teacher_id', params.teacherId);

  if (error) throw error;
  const rows = (data ?? []) as Array<{ student_profiles: DbStudentProfile | null }>;
  return rows.map((r) => r.student_profiles).filter(Boolean) as DbStudentProfile[];
}

export async function fetchProgressForStudents(studentIds: string[]): Promise<Record<string, DbStudentProgress>> {
  const sb = requireSupabase();
  if (studentIds.length === 0) return {};

  const { data, error } = await sb
    .from('student_progress')
    .select('id,student_id,color_score,shape_score,drag_match_score,total_games,updated_at')
    .in('student_id', studentIds);

  if (error) throw error;
  const map: Record<string, DbStudentProgress> = {};
  for (const row of (data ?? []) as DbStudentProgress[]) map[row.student_id] = row;
  return map;
}

export async function createStudentForParent(params: {
  parentId: string;
  name: string;
  age?: number | null;
}): Promise<DbStudentProfile> {
  const sb = requireSupabase();

  const { data: student, error: studentError } = await sb
    .from('student_profiles')
    .insert({
      parent_id: params.parentId,
      name: params.name,
      age: typeof params.age === 'number' ? params.age : null,
    })
    .select('id,parent_id,name,age,created_at')
    .single();

  if (studentError) throw studentError;

  // initializes progress row (keeps tables empty until a student exists)
  const { error: progressError } = await sb.from('student_progress').insert({
    student_id: (student as DbStudentProfile).id,
    color_score: 0,
    shape_score: 0,
    drag_match_score: 0,
    total_games: 0,
  });
  if (progressError) throw progressError;

  await logActivity({
    actorUserId: params.parentId,
    eventType: 'child_created',
    entityType: 'student_profiles',
    entityId: (student as DbStudentProfile).id,
    metadata: { name: params.name },
  }).catch(() => undefined);

  return student as DbStudentProfile;
}

export async function updateStudentProfile(params: {
  studentId: string;
  name: string;
  age?: number | null;
  parentId?: string;
}): Promise<void> {
  const sb = requireSupabase();
  const patch: { name: string; age?: number | null } = { name: params.name };
  if (typeof params.age !== 'undefined') patch.age = params.age;
  const query = sb.from('student_profiles').update(patch).eq('id', params.studentId);
  if (params.parentId) query.eq('parent_id', params.parentId);
  const { error } = await query;
  if (error) throw error;
}

export async function deleteStudentProfile(params: {
  studentId: string;
  parentId?: string;
}): Promise<void> {
  const sb = requireSupabase();
  const query = sb.from('student_profiles').delete().eq('id', params.studentId);
  if (params.parentId) query.eq('parent_id', params.parentId);
  const { error } = await query;
  if (error) throw error;
  await logActivity({
    actorUserId: params.parentId ?? null,
    eventType: 'child_deleted',
    entityType: 'student_profiles',
    entityId: params.studentId,
    metadata: {},
  }).catch(() => undefined);
}

export async function assignStudentToTeacher(params: { teacherId: string; studentId: string }) {
  const sb = requireSupabase();
  const { error } = await sb.from('teacher_students').insert({
    teacher_id: params.teacherId,
    student_id: params.studentId,
  });
  if (error) throw error;
  await logActivity({
    actorUserId: params.teacherId,
    eventType: 'assignment_created',
    entityType: 'teacher_students',
    entityId: params.studentId,
    metadata: { teacherId: params.teacherId, studentId: params.studentId },
  }).catch(() => undefined);
}

export async function findUserIdByEmail(email: string): Promise<string | null> {
  const sb = requireSupabase();
  const normalized = email.trim();
  const { data, error } = await sb.from('users').select('id').ilike('email', normalized).maybeSingle();
  if (error) throw error;
  return (data as { id: string } | null)?.id ?? null;
}

export async function fetchParentStudentsByEmail(email: string): Promise<DbStudentProfile[]> {
  const sb = requireSupabase();
  const normalizedEmail = email.trim().toLowerCase();

  const { data: profileRows, error: profileLookupError } = await sb.rpc('find_student_profiles_by_parent_email', {
    target_email: normalizedEmail,
  });

  if (!profileLookupError && Array.isArray(profileRows)) {
    return (profileRows as Array<{
      student_id: string;
      parent_id: string;
      student_name: string;
      age: number | null;
      created_at: string;
    }>).map((row) => ({
      id: row.student_id,
      parent_id: row.parent_id,
      name: row.student_name,
      age: row.age ?? null,
      created_at: row.created_at,
    }));
  }

  let parentId: string | null = null;
  const { data: rpcData, error: rpcError } = await sb.rpc('find_parent_user_id_by_email', {
    target_email: normalizedEmail,
  });

  if (!rpcError) {
    parentId = (rpcData as string | null) ?? null;
  } else {
    debugLog({
      runId: 'lookup-fix',
      hypothesisId: 'EMAIL_LOOKUP_RPC',
      location: 'src/app/utils/supabaseApi.ts:fetchParentStudentsByEmail',
      message: 'rpc parent email lookup failed, falling back to direct users table lookup',
      data: {
        profileLookupMessage: (profileLookupError as any)?.message,
        profileLookupCode: (profileLookupError as any)?.code,
        message: (rpcError as any)?.message,
        code: (rpcError as any)?.code,
      },
    });
    parentId = await findUserIdByEmail(normalizedEmail);
  }

  if (!parentId) return [];
  return fetchParentStudents(parentId);
}

export async function fetchStudentById(studentId: string): Promise<DbStudentProfile | null> {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from('student_profiles')
    .select('id,parent_id,name,age,created_at')
    .eq('id', studentId)
    .maybeSingle();
  if (error) throw error;
  return (data as DbStudentProfile | null) ?? null;
}

export async function unassignStudentFromTeacher(params: { teacherId: string; studentId: string }): Promise<void> {
  const sb = requireSupabase();
  const { error } = await sb
    .from('teacher_students')
    .delete()
    .eq('teacher_id', params.teacherId)
    .eq('student_id', params.studentId);
  if (error) throw error;
  await logActivity({
    actorUserId: params.teacherId,
    eventType: 'child_deleted',
    entityType: 'teacher_students',
    entityId: params.studentId,
    metadata: { teacherId: params.teacherId, studentId: params.studentId },
  }).catch(() => undefined);
}

export async function deleteAssignmentsForTeacherStudent(params: {
  teacherId: string;
  studentId: string;
}): Promise<void> {
  const sb = requireSupabase();
  const { error } = await sb
    .from('assignments')
    .delete()
    .eq('assigned_by', params.teacherId)
    .eq('assigned_to', params.studentId);
  if (error) throw error;
}

export async function fetchHydratedChildrenForUser(params: {
  userId: string;
  role: AppRole;
}): Promise<DbStudentProfile[]> {
  if (params.role === 'teacher') return fetchTeacherStudents(params.userId);
  if (params.role === 'parent') return fetchParentStudents(params.userId);
  return [];
}

export async function fetchAchievementsForStudents(studentIds: string[]): Promise<Record<string, string[]>> {
  const sb = requireSupabase();
  if (studentIds.length === 0) return {};
  const { data, error } = await sb
    .from('student_achievements')
    .select('id,student_id,achievement_type,icon,date_earned')
    .in('student_id', studentIds)
    .order('date_earned', { ascending: false });
  if (error) throw error;
  const grouped: Record<string, string[]> = {};
  for (const row of (data ?? []) as DbAchievement[]) {
    const list = grouped[row.student_id] ?? [];
    if (!list.includes(row.icon)) list.push(row.icon);
    grouped[row.student_id] = list;
  }
  return grouped;
}

export async function fetchAchievementHistoryForStudent(studentId: string): Promise<DbAchievement[]> {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from('student_achievements')
    .select('id,student_id,achievement_type,icon,date_earned')
    .eq('student_id', studentId)
    .order('date_earned', { ascending: false });
  if (error) throw error;
  return (data ?? []) as DbAchievement[];
}

export async function upsertStudentAchievements(params: {
  studentId: string;
  badges: Array<{ type: string; icon: string }>;
}): Promise<void> {
  const sb = requireSupabase();
  if (params.badges.length === 0) return;
  const payload = params.badges.map((b) => ({
    student_id: params.studentId,
    achievement_type: b.type,
    icon: b.icon,
  }));
  const { error } = await sb.from('student_achievements').insert(payload);
  if (error) throw error;
}

export async function fetchTeacherClasses(teacherId: string): Promise<DbTeacherClass[]> {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from('teacher_classes')
    .select('id,teacher_id,name,created_at')
    .eq('teacher_id', teacherId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as DbTeacherClass[];
}

export async function createTeacherClass(params: {
  teacherId: string;
  name: string;
}): Promise<DbTeacherClass> {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from('teacher_classes')
    .insert({ teacher_id: params.teacherId, name: params.name })
    .select('id,teacher_id,name,created_at')
    .single();
  if (error) throw error;
  return data as DbTeacherClass;
}

export async function fetchClassStudents(classId: string): Promise<DbClassStudent[]> {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from('class_students')
    .select('id,class_id,student_id,created_at')
    .eq('class_id', classId);
  if (error) throw error;
  return (data ?? []) as DbClassStudent[];
}

export async function assignStudentsToClass(params: {
  classId: string;
  studentIds: string[];
}): Promise<void> {
  const sb = requireSupabase();
  if (params.studentIds.length === 0) return;
  const { error } = await sb
    .from('class_students')
    .insert(params.studentIds.map((studentId) => ({ class_id: params.classId, student_id: studentId })));
  if (error) throw error;
}

export async function removeStudentFromClass(params: {
  classId: string;
  studentId: string;
}): Promise<void> {
  const sb = requireSupabase();
  const { error } = await sb
    .from('class_students')
    .delete()
    .eq('class_id', params.classId)
    .eq('student_id', params.studentId);
  if (error) throw error;
}

export async function upsertStudentProgress(params: {
  studentId: string;
  colorScore?: number;
  shapeScore?: number;
  dragMatchScore?: number;
  incrementTotalGames?: boolean;
}): Promise<void> {
  const sb = requireSupabase();

  // read current once (single row), then update with minimal fields
  const { data: current, error: readError } = await sb
    .from('student_progress')
    .select('id,student_id,color_score,shape_score,drag_match_score,total_games')
    .eq('student_id', params.studentId)
    .maybeSingle();
  if (readError) throw readError;

  const existing = current as (DbStudentProgress & { total_games: number }) | null;
  const nextTotalGames = (existing?.total_games ?? 0) + (params.incrementTotalGames ? 1 : 0);

  const patch: Record<string, unknown> = { total_games: nextTotalGames, updated_at: new Date().toISOString() };
  if (typeof params.colorScore === 'number') patch.color_score = params.colorScore;
  if (typeof params.shapeScore === 'number') patch.shape_score = params.shapeScore;
  if (typeof params.dragMatchScore === 'number') patch.drag_match_score = params.dragMatchScore;

  if (existing?.id) {
    const { error: updateError } = await sb.from('student_progress').update(patch).eq('id', existing.id);
    if (updateError) throw updateError;
    await logActivity({
      actorUserId: null,
      eventType: 'score_saved',
      entityType: 'student_progress',
      entityId: params.studentId,
      metadata: {
        colorScore: params.colorScore,
        shapeScore: params.shapeScore,
        dragMatchScore: params.dragMatchScore,
        incrementTotalGames: Boolean(params.incrementTotalGames),
      },
    }).catch(() => undefined);
    return;
  }

  const { error: insertError } = await sb.from('student_progress').insert({
    student_id: params.studentId,
    color_score: typeof params.colorScore === 'number' ? params.colorScore : 0,
    shape_score: typeof params.shapeScore === 'number' ? params.shapeScore : 0,
    drag_match_score: typeof params.dragMatchScore === 'number' ? params.dragMatchScore : 0,
    total_games: nextTotalGames,
    updated_at: new Date().toISOString(),
  });
  if (insertError) throw insertError;
  await logActivity({
    actorUserId: null,
    eventType: 'score_saved',
    entityType: 'student_progress',
    entityId: params.studentId,
    metadata: {
      colorScore: params.colorScore,
      shapeScore: params.shapeScore,
      dragMatchScore: params.dragMatchScore,
      incrementTotalGames: Boolean(params.incrementTotalGames),
    },
  }).catch(() => undefined);
}

export async function fetchAdminAnalytics(): Promise<DbAnalytics> {
  const sb = requireSupabase();

  // computes quickly with counts and keeps a single row in analytics as a cache.
  const [{ count: usersCount }, { count: studentsCount }, { count: teachersCount }] = await Promise.all([
    sb.from('users').select('id', { count: 'exact', head: true }),
    sb.from('student_profiles').select('id', { count: 'exact', head: true }),
    sb.from('users').select('id', { count: 'exact', head: true }).eq('role', 'teacher'),
  ]);

  const { data: progress, error: progressError } = await sb
    .from('student_progress')
    .select('total_games');
  if (progressError) throw progressError;
  const totalGames = (progress ?? []).reduce((sum: number, r: any) => sum + (r.total_games ?? 0), 0);

  const next = {
    total_users: usersCount ?? 0,
    total_students: studentsCount ?? 0,
    total_teachers: teachersCount ?? 0,
    total_games_played: totalGames,
    updated_at: new Date().toISOString(),
  };

  const { data: existing, error: existingError } = await sb
    .from('analytics')
    .select('id')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (existingError) throw existingError;

  if (existing?.id) {
    const { data: updated, error: updateError } = await sb
      .from('analytics')
      .update(next)
      .eq('id', existing.id)
      .select('*')
      .single();
    if (updateError) throw updateError;
    return updated as DbAnalytics;
  }

  const { data: inserted, error: insertError } = await sb.from('analytics').insert(next).select('*').single();
  if (insertError) throw insertError;
  return inserted as DbAnalytics;
}

export async function createAssignmentsForStudents(params: {
  teacherId: string;
  activityType: 'color-quiz' | 'shape-quiz' | 'drag-match';
  activityName: string;
  studentIds: string[];
  questionCount?: number | null;
  classId?: string | null;
}): Promise<DbAssignment[]> {
  const sb = requireSupabase();
  if (params.studentIds.length === 0) return [];

  const rows = params.studentIds.map((studentId) => ({
    activity_type: params.activityType,
    activity_name: params.activityName,
    question_count: params.questionCount ?? null,
    assigned_by: params.teacherId,
    assigned_to: studentId,
    class_id: params.classId ?? null,
    completed: false,
  }));

  const { data, error } = await sb
    .from('assignments')
    .insert(rows)
    .select('id,activity_type,activity_name,question_count,assigned_by,assigned_to,class_id,assigned_date,completed,completed_at,teacher_cleared_at');

  if (error) throw error;
  await Promise.all(
    ((data ?? []) as DbAssignment[]).map((row) =>
      logActivity({
        actorUserId: params.teacherId,
        eventType: 'assignment_created',
        entityType: 'assignments',
        entityId: row.id,
        metadata: {
          activityType: params.activityType,
          activityName: params.activityName,
          studentId: row.assigned_to,
        },
      }).catch(() => undefined)
    )
  );
  return (data ?? []) as DbAssignment[];
}

export async function fetchAssignmentsForStudent(studentId: string): Promise<DbAssignment[]> {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from('assignments')
    .select('id,activity_type,activity_name,question_count,assigned_by,assigned_to,class_id,assigned_date,completed,completed_at,teacher_cleared_at')
    .eq('assigned_to', studentId)
    .order('assigned_date', { ascending: false });
  if (error) throw error;
  return (data ?? []) as DbAssignment[];
}

export async function fetchAssignmentsForTeacher(teacherId: string): Promise<DbAssignment[]> {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from('assignments')
    .select('id,activity_type,activity_name,question_count,assigned_by,assigned_to,class_id,assigned_date,completed,completed_at,teacher_cleared_at')
    .eq('assigned_by', teacherId)
    .is('teacher_cleared_at', null)
    .order('assigned_date', { ascending: false });
  if (error) throw error;
  return (data ?? []) as DbAssignment[];
}

export async function markAssignmentCompleted(params: { assignmentId: string; studentId: string }): Promise<void> {
  const sb = requireSupabase();
  const { error } = await sb
    .from('assignments')
    .update({ completed: true, completed_at: new Date().toISOString() })
    .eq('id', params.assignmentId)
    .eq('assigned_to', params.studentId);
  if (error) throw error;
  await logActivity({
    actorUserId: null,
    eventType: 'assignment_completed',
    entityType: 'assignments',
    entityId: params.assignmentId,
    metadata: { studentId: params.studentId },
  }).catch(() => undefined);
}

export async function clearCompletedAssignmentIndicator(params: {
  assignmentId: string;
  teacherId: string;
}): Promise<void> {
  const sb = requireSupabase();
  const { error } = await sb
    .from('assignments')
    .update({ teacher_cleared_at: new Date().toISOString() })
    .eq('id', params.assignmentId)
    .eq('assigned_by', params.teacherId)
    .eq('completed', true);
  if (error) throw error;
}

export async function logActivity(params: {
  actorUserId: string | null;
  eventType: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const sb = requireSupabase();
  const { error } = await sb.from('activity_logs').insert({
    actor_user_id: params.actorUserId,
    event_type: params.eventType,
    entity_type: params.entityType,
    entity_id: params.entityId ?? null,
    metadata: params.metadata ?? {},
  });
  if (error) throw error;
}

export async function fetchAdminSnapshot(): Promise<DbAdminSnapshot> {
  const sb = requireSupabase();

  const [
    { count: totalUsers },
    { count: totalParents },
    { count: totalTeachers },
    { count: totalAdmins },
    { count: totalStudents },
    { count: totalAssignments },
    { count: completedAssignments },
  ] = await Promise.all([
    sb.from('users').select('id', { count: 'exact', head: true }),
    sb.from('users').select('id', { count: 'exact', head: true }).eq('role', 'parent'),
    sb.from('users').select('id', { count: 'exact', head: true }).eq('role', 'teacher'),
    sb.from('users').select('id', { count: 'exact', head: true }).eq('role', 'admin'),
    sb.from('student_profiles').select('id', { count: 'exact', head: true }),
    sb.from('assignments').select('id', { count: 'exact', head: true }),
    sb.from('assignments').select('id', { count: 'exact', head: true }).eq('completed', true),
  ]);

  const { data: progressRows, error: progressError } = await sb.from('student_progress').select('total_games');
  if (progressError) throw progressError;

  const { data: recentUsers, error: recentUsersError } = await sb
    .from('users')
    .select('id,email,role,created_at')
    .order('created_at', { ascending: false })
    .limit(8);
  if (recentUsersError) throw recentUsersError;

  const { data: recentActivity, error: activityError } = await sb
    .from('activity_logs')
    .select('id,actor_user_id,event_type,entity_type,entity_id,metadata,created_at')
    .order('created_at', { ascending: false })
    .limit(12);
  if (activityError) throw activityError;

  return {
    totalUsers: totalUsers ?? 0,
    totalParents: totalParents ?? 0,
    totalTeachers: totalTeachers ?? 0,
    totalAdmins: totalAdmins ?? 0,
    totalStudents: totalStudents ?? 0,
    totalAssignments: totalAssignments ?? 0,
    completedAssignments: completedAssignments ?? 0,
    totalGamesPlayed: (progressRows ?? []).reduce((sum: number, row: any) => sum + (row.total_games ?? 0), 0),
    recentUsers: (recentUsers ?? []) as DbUser[],
    recentActivity: (recentActivity ?? []) as DbActivityLog[],
  };
}

