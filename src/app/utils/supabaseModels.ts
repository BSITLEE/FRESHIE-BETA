import type { ChildProfile } from './mockData';

export type AppRole = 'admin' | 'teacher' | 'parent';

export type DbUser = {
  id: string;
  email: string;
  role: AppRole;
  created_at: string;
};

export type DbStudentProfile = {
  id: string;
  parent_id: string;
  name: string;
  age: number | null;
  created_at: string;
};

export type DbStudentProgress = {
  id: string;
  student_id: string;
  color_score: number;
  shape_score: number;
  drag_match_score: number;
  total_games: number;
  updated_at: string;
};

export type DbTeacherStudent = {
  id: number;
  teacher_id: string;
  student_id: string;
};

export type DbAnalytics = {
  id: number;
  total_users: number;
  total_students: number;
  total_teachers: number;
  total_games_played: number;
  updated_at: string;
};

export type DbAssignment = {
  id: string;
  activity_type: 'color-quiz' | 'shape-quiz' | 'drag-match';
  activity_name: string;
  question_count: number | null;
  assigned_by: string;
  assigned_to: string;
  class_id?: string | null;
  assigned_date: string;
  completed: boolean;
  completed_at: string | null;
  teacher_cleared_at?: string | null;
};

export type DbAchievement = {
  id: string;
  student_id: string;
  achievement_type: string;
  icon: string;
  date_earned: string;
};

export type DbTeacherClass = {
  id: string;
  teacher_id: string;
  name: string;
  created_at: string;
};

export type DbClassStudent = {
  id: string;
  class_id: string;
  student_id: string;
  created_at: string;
};

export type ActivityEventType =
  | 'account_created'
  | 'login_success'
  | 'child_created'
  | 'child_deleted'
  | 'assignment_created'
  | 'assignment_completed'
  | 'score_saved';

export type DbActivityLog = {
  id: string;
  actor_user_id: string | null;
  event_type: ActivityEventType;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type DbAdminSnapshot = {
  totalUsers: number;
  totalParents: number;
  totalTeachers: number;
  totalAdmins: number;
  totalStudents: number;
  totalAssignments: number;
  completedAssignments: number;
  totalGamesPlayed: number;
  recentUsers: DbUser[];
  recentActivity: DbActivityLog[];
};

export function progressRowToChildProfile(
  student: DbStudentProfile,
  progress: DbStudentProgress | null,
  badges: string[] = []
): ChildProfile {
  const stableAvatar = ['🦁', '🐘', '🦒', '🐯', '🦓', '🐵', '🐼', '🐨', '🦊', '🐻'][
    Math.abs(hashString(student.id)) % 10
  ];

  return {
    id: student.id,
    name: student.name,
    age: student.age ?? 4,
    avatar: stableAvatar,
    parentId: student.parent_id,
    progress: {
      colorQuizScore: progress?.color_score ?? 0,
      shapeQuizScore: progress?.shape_score ?? 0,
      dragMatchScore: progress?.drag_match_score ?? 0,
      totalGamesPlayed: progress?.total_games ?? 0,
      badges,
    },
  };
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

