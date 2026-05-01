import { useState, useEffect } from 'react';
import { isSupabaseConfigured, supabase } from './supabaseClient';
import {
  clearCompletedAssignmentIndicator,
  createAssignmentsForStudents,
  fetchAssignmentsForStudent,
  markAssignmentCompleted as markAssignmentCompletedInDb,
} from './supabaseApi';

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

// simple state management using localStorage
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
    try {
      if (isSupabaseConfigured && supabase) {
        try {
          await markAssignmentCompletedInDb({ assignmentId, studentId: childId });
        } catch (updateError) {
          console.error('Initial assignment completion update failed:', updateError);
          throw updateError;
        }

        // waits a moment for the update to propagate
        await new Promise((resolve) => setTimeout(resolve, 100));

        // verifies update succeeded by fetching fresh assignment data
        let rows = await fetchAssignmentsForStudent(childId);
        let updated = rows.find((r) => r.id === assignmentId);

        // if not immediately reflected, wait a bit more and retry
        if (!updated || !updated.completed) {
          console.warn('Assignment completion not immediately reflected, retrying verification...');
          await new Promise((resolve) => setTimeout(resolve, 500));
          rows = await fetchAssignmentsForStudent(childId);
          updated = rows.find((r) => r.id === assignmentId);
        }

        if (!updated || !updated.completed) {
          throw new Error(
            `Assignment completion verification failed - status not persisted after retry. Assignment: ${assignmentId}, studentId: ${childId}`
          );
        }

        console.log('Assignment completion verified:', { assignmentId, childId, completedAt: updated.completed_at });
      }
    } catch (e) {
      console.error('Failed to mark assignment completed:', e);
      throw e;
    }

    // updates local state after successful verification
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
