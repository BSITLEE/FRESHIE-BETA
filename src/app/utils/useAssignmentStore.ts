import { useState, useEffect } from 'react';

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
  assignedTo: string[]; // Child profile IDs (will be single value in DB)
  assignedDate: string;
  dueDate?: string;
  completed: string[]; // Child IDs who completed (will be boolean in DB)
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

  const createAssignment = (
    activityType: 'color-quiz' | 'shape-quiz' | 'drag-match',
    activityName: string,
    assignedBy: string,
    assignedTo: string[]
  ) => {
    // TODO: Replace with Supabase insert when integrating database
    // For each student, create a separate assignment row:
    // assignedTo.forEach(studentId => {
    //   await supabase.from('assignments').insert({
    //     activity_type: activityType,
    //     activity_name: activityName,
    //     assigned_by: assignedBy,
    //     assigned_to: studentId
    //   })
    // })
    const newAssignment: Assignment = {
      id: `assignment-${Date.now()}`, // In production, use UUID from Supabase
      activityType,
      activityName,
      assignedBy,
      assignedTo,
      assignedDate: new Date().toISOString(),
      completed: [],
    };
    setAssignments([...assignments, newAssignment]);
    return newAssignment;
  };

  const markCompleted = (assignmentId: string, childId: string) => {
    setAssignments(
      assignments.map((assignment) => {
        if (assignment.id === assignmentId && !assignment.completed.includes(childId)) {
          return {
            ...assignment,
            completed: [...assignment.completed, childId],
          };
        }
        return assignment;
      })
    );
  };

  const getAssignmentsForChild = (childId: string) => {
    return assignments.filter(
      (assignment) =>
        assignment.assignedTo.includes(childId) &&
        !assignment.completed.includes(childId)
    );
  };

  const getAllAssignments = () => {
    return assignments;
  };

  const deleteAssignment = (assignmentId: string) => {
    setAssignments(assignments.filter((a) => a.id !== assignmentId));
  };

  return {
    assignments,
    createAssignment,
    markCompleted,
    getAssignmentsForChild,
    getAllAssignments,
    deleteAssignment,
  };
};
