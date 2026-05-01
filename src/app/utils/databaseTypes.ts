// user account types
export interface UserAccount {
  user_id: string;
  email: string;
  role: 'child' | 'parent' | 'teacher' | 'admin';
  created_at: string;
  updated_at: string;
}

// child profile types
export interface ChildProfileDB {
  child_profile_id: string;
  parent_user_id: string;
  child_name: string;
  child_age: number;
  child_avatar: string;
  created_at: string;
  updated_at: string;
}

// game session types
export interface GameSession {
  game_session_id: string;
  child_profile_id: string;
  game_type: 'color_quiz' | 'shape_quiz' | 'drag_match';
  questions_count: number;
  correct_answers: number;
  score_percentage: number;
  started_at: string;
  completed_at: string;
}

// progress tracking types
export interface ChildProgress {
  progress_id: string;
  child_profile_id: string;
  total_games_played: number;
  color_quiz_score_avg: number;
  shape_quiz_score_avg: number;
  drag_match_score_avg: number;
  badges_earned: string[]; // JSON array in database
  last_played_at: string;
  updated_at: string;
}

// badge types
export interface BadgeAchievement {
  badge_id: string;
  child_profile_id: string;
  badge_type: string; 
  badge_name: string;
  earned_at: string;
}

// question types for the question bank
export interface QuizQuestionDB {
  question_id: string;
  question_type: 'color' | 'shape';
  question_text: string;
  correct_answer: string;
  difficulty_level: 'easy' | 'medium' | 'hard';
  created_at: string;
}

// activity log types
export interface ActivityLog {
  activity_id: string;
  child_profile_id: string;
  activity_type: 'game_started' | 'game_completed' | 'badge_earned' | 'login' | 'logout';
  activity_data: Record<string, any>; // JSON object for more flexible data
  timestamp: string;
}

// dashboard stats (aggregated data)
export interface DashboardStats {
  stat_id: string;
  child_profile_id: string;
  date: string;
  games_played_count: number;
  average_score: number;
  time_spent_minutes: number;
  created_at: string;
}

// parent-child relationship types
export interface ParentChildRelation {
  relation_id: string;
  parent_user_id: string;
  child_profile_id: string;
  relationship_type: 'parent' | 'guardian' | 'teacher';
  created_at: string;
}

// access key types (for role-based login)
export interface AccessKey {
  key_id: string;
  access_key: string;
  role: 'child' | 'parent' | 'teacher' | 'admin';
  is_active: boolean;
  created_at: string;
  expires_at: string | null;
}

// helper functions to convert between ui types and database types
import { ChildProfile } from './mockData';

export const childProfileToDB = (profile: ChildProfile, parentUserId: string): ChildProfileDB => {
  return {
    child_profile_id: profile.id,
    parent_user_id: parentUserId,
    child_name: profile.name,
    child_age: profile.age,
    child_avatar: profile.avatar,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
};

export const childProgressToDB = (profile: ChildProfile): ChildProgress => {
  return {
    progress_id: `progress_${profile.id}`,
    child_profile_id: profile.id,
    total_games_played: profile.progress.totalGamesPlayed,
    color_quiz_score_avg: profile.progress.colorQuizScore,
    shape_quiz_score_avg: profile.progress.shapeQuizScore,
    drag_match_score_avg: profile.progress.dragMatchScore,
    badges_earned: profile.progress.badges,
    last_played_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
};

export const createGameSession = (
  childProfileId: string,
  gameType: 'color_quiz' | 'shape_quiz' | 'drag_match',
  questionsCount: number,
  correctAnswers: number
): GameSession => {
  const scorePercentage = Math.round((correctAnswers / questionsCount) * 100);
  
  return {
    game_session_id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    child_profile_id: childProfileId,
    game_type: gameType,
    questions_count: questionsCount,
    correct_answers: correctAnswers,
    score_percentage: scorePercentage,
    started_at: new Date().toISOString(),
    completed_at: new Date().toISOString(),
  };
};

export const createActivityLog = (
  childProfileId: string,
  activityType: ActivityLog['activity_type'],
  activityData: Record<string, any> = {}
): ActivityLog => {
  return {
    activity_id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    child_profile_id: childProfileId,
    activity_type: activityType,
    activity_data: activityData,
    timestamp: new Date().toISOString(),
  };
};

export const createBadgeAchievement = (
  childProfileId: string,
  badgeType: string,
  badgeName: string
): BadgeAchievement => {
  return {
    badge_id: `badge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    child_profile_id: childProfileId,
    badge_type: badgeType,
    badge_name: badgeName,
    earned_at: new Date().toISOString(),
  };
};
