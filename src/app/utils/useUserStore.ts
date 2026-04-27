import { useState, useEffect } from 'react';
import { ChildProfile, mockChildProfiles } from './mockData';

/**
 * User Store - Database-Ready Structure
 *
 * This store manages user authentication and child profiles using localStorage.
 * When integrating with Supabase, replace this with Supabase queries.
 *
 * Database Integration Points:
 * - UserState.email → users.email
 * - UserState.role → users.role
 * - UserState.children → students table (foreign key: parent_id)
 * - UserState.currentChild → selected student from students table
 *
 * Migration Path:
 * 1. Replace login() with Supabase Auth: supabase.auth.signInWithPassword()
 * 2. Replace children array with query: supabase.from('students').select('*').eq('parent_id', userId)
 * 3. Replace updateChildProgress() with: supabase.from('game_results').insert()
 * 4. Replace addChild() with: supabase.from('students').insert()
 *
 * See DATABASE_SCHEMA.md for complete integration instructions.
 */

export type UserRole = 'child' | 'parent' | 'teacher' | 'admin';

interface UserState {
  role: UserRole | null;
  currentChild: ChildProfile | null;
  children: ChildProfile[];
  email: string | null;
}

// Simple state management using localStorage (will be replaced with Supabase)
const STORAGE_KEY = 'freshie-user-state';

export const useUserStore = () => {
  const [userState, setUserState] = useState<UserState>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return {
          role: null,
          currentChild: null,
          children: [],
          email: null,
        };
      }
    }
    return {
      role: null,
      currentChild: null,
      children: [],
      email: null,
    };
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userState));
  }, [userState]);

  const login = (email: string, role: UserRole, children?: ChildProfile[]) => {
    const newState: UserState = {
      role,
      email,
      children: children || [],
      currentChild: children?.[0] || null,
    };
    setUserState(newState);
  };

  const logout = () => {
    setUserState({
      role: null,
      currentChild: null,
      children: [],
      email: null,
    });
    localStorage.removeItem(STORAGE_KEY);
  };

  const switchChild = (childId: string) => {
    const child = userState.children.find(c => c.id === childId);
    if (child) {
      setUserState({ ...userState, currentChild: child });
    }
  };

  const updateChildProgress = (score: number, gameType: 'color' | 'shape' | 'dragMatch') => {
    if (!userState.currentChild) return;

    const updatedChildren = userState.children.map(child => {
      if (child.id === userState.currentChild!.id) {
        const updatedProgress = { ...child.progress };
        updatedProgress.totalGamesPlayed += 1;

        if (gameType === 'color') {
          updatedProgress.colorQuizScore = Math.round((updatedProgress.colorQuizScore + score) / 2);
        } else if (gameType === 'shape') {
          updatedProgress.shapeQuizScore = Math.round((updatedProgress.shapeQuizScore + score) / 2);
        } else {
          updatedProgress.dragMatchScore = Math.round((updatedProgress.dragMatchScore + score) / 2);
        }

        // Add badges based on performance
        if (score >= 80 && !updatedProgress.badges.includes('Star')) {
          updatedProgress.badges.push('Star');
        }
        if (score === 100 && !updatedProgress.badges.includes('Trophy')) {
          updatedProgress.badges.push('Trophy');
        }

        return { ...child, progress: updatedProgress };
      }
      return child;
    });

    setUserState({
      ...userState,
      children: updatedChildren,
      currentChild: updatedChildren.find(c => c.id === userState.currentChild!.id) || null,
    });
  };

  const addChild = (name: string, avatar: string) => {
    // TODO: Replace with Supabase insert when integrating database
    // const { data } = await supabase.from('students').insert({ name, avatar, parent_id: userId })
    const newChild: ChildProfile = {
      id: `child-${Date.now()}`, // In production, use UUID from Supabase
      name,
      avatar,
      age: 4,
      progress: {
        totalGamesPlayed: 0,
        colorQuizScore: 0,
        shapeQuizScore: 0,
        dragMatchScore: 0,
        badges: [],
      },
    };

    const updatedChildren = [...userState.children, newChild];
    setUserState({
      ...userState,
      children: updatedChildren,
    });
  };

  const editChild = (id: string, name: string) => {
    const updatedChildren = userState.children.map(child => 
      child.id === id ? { ...child, name } : child
    );

    setUserState({
      ...userState,
      children: updatedChildren,
      currentChild: userState.currentChild?.id === id 
        ? { ...userState.currentChild, name }
        : userState.currentChild,
    });
  };

  const deleteChild = (id: string) => {
    const updatedChildren = userState.children.filter(c => c.id !== id);
    const newCurrentChild = userState.currentChild?.id === id
      ? updatedChildren[0] || null
      : userState.currentChild;

    setUserState({
      ...userState,
      children: updatedChildren,
      currentChild: newCurrentChild,
    });
  };

  return {
    userState,
    login,
    logout,
    switchChild,
    updateChildProgress,
    addChild,
    editChild,
    deleteChild,
  };
};