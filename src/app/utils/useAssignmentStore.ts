import { useState, useEffect } from 'react';
import { isSupabaseConfigured, supabase } from './supabaseClient';
import {
  clearCompletedAssignmentIndicator,
  createAssignmentsForStudents,
  fetchAssignmentsForStudent,
  markAssignmentCompleted as markAssignmentCompletedInDb,
} from './supabaseApi';

/**
 * Assignment Store - Database-Ready Structure
 *
 * This store manages teacher-to-student assignments using localStorage.
 * When integrating with Supabase, replace this with Supabase queries.
 *
 * Database Integration Points:
 * - Assignment.id → assignments.id (UUID)
 * - Assignment.activityType → assignments.activity_type
 * - Assignment.activityName → assignments.activity_name
 * - Assignment.assignedBy → assignments.assigned_by (foreign key to users)
 * - Assignment.assignedTo → assignments.assigned_to (foreign key to students)
 * - Assignment.assignedDate → assignments.assigned_date
 * - Assignment.completed → assignments.completed (boolean)
 *
 * Migration Path:
 * 1. Replace createAssignment() with: supabase.from('assignments').insert()
 * 2. Replace getAssignmentsForChild() with: supabase.from('assignments').select().eq('assigned_to', studentId)
 * 3. Replace markCompleted() with: supabase.from('assignments').update({ completed: true })
 *
 * Note: In database, one assignment = one student (1:1). Current implementation
 * uses arrays to assign to multiple students, which should be split into
 * multiple rows when migrating to Supabase.
 *
 * See DATABASE_SCHEMA.md for complete integration instructions.
 */

export interface Assignment {
  id: string;
  activityType: 'color-quiz' | 'shape-quiz' | 'drag-match';
  activityName: string;
  assignedBy: string;
  assignedTo: string;
  classId?: string | null;
  questionCount?: number | null;
  assignedDate: string;
  dueDate?: string;
  completed: boolean;
  completedAt?: string | null;
}

// Simple state management using localStorage (will be replaced with Supabase)
const STORAGE_KEY = 'freshie-assignments';

export const useAssignmentStore = () => {
  const [assignments, setAssignments] = useState<Assignment[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return [];
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(assignments));
  }, [assignments]);

  const createAssignment = async (
    activityType: 'color-quiz' | 'shape-quiz' | 'drag-match',
    activityName: string,
    assignedBy: string,
    assignedTo: string[],
    questionCount?: number | null,
    classId?: string | null
  ) => {
    if (isSupabaseConfigured && supabase) {
      const { data: authData } = await supabase.auth.getUser();
      const teacherId = authData.user?.id;
      if (!teacherId) throw new Error('Missing authenticated teacher');
      const inserted = await createAssignmentsForStudents({
        teacherId,
        activityType,
        activityName,
        studentIds: assignedTo,
        questionCount: questionCount ?? null,
        classId,
      });
      const mapped = inserted.map((row) => ({
        id: row.id,
        activityType: row.activity_type,
        activityName: row.activity_name,
        assignedBy,
        assignedTo: row.assigned_to,
        classId: row.class_id ?? null,
        questionCount: row.question_count ?? null,
        assignedDate: row.assigned_date,
        completed: row.completed,
        completedAt: row.completed_at,
      })) satisfies Assignment[];
      setAssignments((prev) => [...mapped, ...prev]);
      return mapped;
    }

    const now = new Date().toISOString();
    const newAssignments = assignedTo.map((studentId, index) => ({
      id: `assignment-${Date.now()}-${index}`,
      activityType,
      activityName,
      assignedBy,
      assignedTo: studentId,
      classId: classId ?? null,
      questionCount: questionCount ?? null,
      assignedDate: now,
      completed: false,
      completedAt: null,
    })) satisfies Assignment[];
    setAssignments((prev) => [...newAssignments, ...prev]);
    return newAssignments;
  };

  const markCompleted = async (assignmentId: string, childId: string) => {
    if (isSupabaseConfigured && supabase) {
      await markAssignmentCompletedInDb({ assignmentId, studentId: childId });
    }
    setAssignments((prev) =>
      prev.map((assignment) => {
        if (assignment.id === assignmentId && assignment.assignedTo === childId) {
          return {
            ...assignment,
            completed: true,
            completedAt: new Date().toISOString(),
          };
        }
        return assignment;
      })
    );
  };

  const getAssignmentsForChild = async (childId: string) => {
    if (isSupabaseConfigured && supabase) {
      const rows = await fetchAssignmentsForStudent(childId);
      const mapped = rows.map((row) => ({
        id: row.id,
        activityType: row.activity_type,
        activityName: row.activity_name,
        assignedBy: row.assigned_by,
        assignedTo: row.assigned_to,
        classId: row.class_id ?? null,
        questionCount: row.question_count ?? null,
        assignedDate: row.assigned_date,
        completed: row.completed,
        completedAt: row.completed_at,
      })) satisfies Assignment[];
      setAssignments((prev) => {
        const keep = prev.filter((a) => a.assignedTo !== childId);
        return [...mapped, ...keep];
      });
      return mapped.filter((assignment) => !assignment.completed);
    }

    return assignments.filter((assignment) => assignment.assignedTo === childId && !assignment.completed);
  };

  const getAllAssignments = () => {
    return assignments;
  };

  const deleteAssignment = (assignmentId: string) => {
    setAssignments((prev) => prev.filter((a) => a.id !== assignmentId));
  };

  const clearCompletedIndicator = async (assignmentId: string) => {
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase.auth.getUser();
      const teacherId = data.user?.id;
      if (!teacherId) throw new Error('Missing authenticated teacher');
      await clearCompletedAssignmentIndicator({ assignmentId, teacherId });
    }
    setAssignments((prev) => prev.filter((a) => a.id !== assignmentId));
  };

  return {
    assignments,
    createAssignment,
    markCompleted,
    getAssignmentsForChild,
    getAllAssignments,
    deleteAssignment,
    clearCompletedIndicator,
  };
};
